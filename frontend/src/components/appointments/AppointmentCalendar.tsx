import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import localeData from "dayjs/plugin/localeData";
import localizedFormat from "dayjs/plugin/localizedFormat";
import minMax from "dayjs/plugin/minMax";
import utc from "dayjs/plugin/utc";
import isLeapYear from "dayjs/plugin/isLeapYear";
import "dayjs/locale/ar";
import "dayjs/locale/en-gb";
import { Calendar, Views, dayjsLocalizer } from "react-big-calendar";
import withDragAndDrop from "@/lib/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { useAppointmentCalendar, useAppointmentSearch, useWorkingHours } from "@/hooks/useAppointments";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import type { Appointment } from "@/types/models";

// Extend dayjs with all plugins required by react-big-calendar's dayjsLocalizer
// before creating the localizer, to ensure they are loaded on our dayjs instance
// regardless of Vite's module resolution / pre-bundling order.
dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(localeData);
dayjs.extend(localizedFormat);
dayjs.extend(minMax);
dayjs.extend(utc);
dayjs.extend(isLeapYear);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RBCEvent = any;

const localizer = dayjsLocalizer(dayjs);
const DnDCalendar = withDragAndDrop(Calendar);

export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
}

interface CalendarFilters {
  status: string;
  search: string;
  appointmentType: string;
}

interface AppointmentCalendarProps {
  onEventClick: (appointment: Appointment) => void;
  onSlotSelect: (slot: { start: Date; end: Date }) => void;
  onEventDrop?: (appointment: Appointment, newStart: Date, newEnd: Date) => void;
  onEventResize?: (appointment: Appointment, newStart: Date, newEnd: Date) => void;
  filters?: CalendarFilters;
}

const STATUS_CLASS: Record<string, string> = {
  upcoming: "rbc-event-primary",
  confirmed: "rbc-event-info",
  completed: "rbc-event-success",
  cancelled: "rbc-event-danger",
  "no-show": "rbc-event-muted",
  rescheduled: "rbc-event-warning",
};

const TYPE_CLASS: Record<string, string> = {
  consultation: "rbc-event-type-consultation",
  "follow-up": "rbc-event-type-follow-up",
  checkup: "rbc-event-type-checkup",
  surgery: "rbc-event-type-surgery",
  emergency: "rbc-event-type-emergency",
  vaccination: "rbc-event-type-vaccination",
  "lab-test": "rbc-event-type-lab-test",
  imaging: "rbc-event-type-imaging",
  other: "rbc-event-type-other",
};

function toCalendarEvent(apt: Appointment): CalendarEvent {
  const start = new Date(`${apt.appointmentDate}T${apt.startTime}`);
  const end = new Date(`${apt.appointmentDate}T${apt.endTime}`);
  const title = apt.patient?.fullName ?? apt.quickName ?? apt.displayId;
  return { id: apt.id, title, start, end, resource: apt };
}

export function AppointmentCalendar({
  onEventClick,
  onSlotSelect,
  onEventDrop,
  onEventResize,
  filters,
}: AppointmentCalendarProps) {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<string>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    dayjs.locale(i18n.language === "ar" ? "ar" : "en-gb");
  }, [i18n.language]);

  const { startDate, endDate } = useMemo(() => {
    const base = dayjs(currentDate);
    if (view === Views.MONTH) {
      return {
        startDate: base.startOf("month").subtract(7, "day").format("YYYY-MM-DD"),
        endDate: base.endOf("month").add(7, "day").format("YYYY-MM-DD"),
      };
    }
    return {
      startDate: base.startOf("week").subtract(1, "day").format("YYYY-MM-DD"),
      endDate: base.endOf("week").add(1, "day").format("YYYY-MM-DD"),
    };
  }, [currentDate, view]);

  const { workingHours } = useWorkingHours();
  const whStart = workingHours?.start ?? "09:00";
  const whEnd = workingHours?.end ?? "18:00";
  const [minH, minM] = whStart.split(":").map(Number);
  const [maxH, maxM] = whEnd.split(":").map(Number);
  const minDate = new Date(2000, 1, 1, minH || 9, minM || 0, 0);
  const maxDate = new Date(2000, 1, 1, maxH || 18, maxM || 0, 0);

  const hasFilters = !!(filters && (filters.status || filters.search || filters.appointmentType));

  const { appointments, isLoading, isError, refetch } = useAppointmentCalendar({
    startDate,
    endDate,
  });

  const { appointments: searchAppointments, isFetching: isSearchFetching } = useAppointmentSearch({
    search: filters?.search,
    status: filters?.status,
    appointmentType: filters?.appointmentType,
    startDate,
    endDate,
    enabled: hasFilters,
  });

  const events = useMemo<CalendarEvent[]>(() => {
    const source = hasFilters ? searchAppointments : appointments;
    return source.map(toCalendarEvent);
  }, [appointments, searchAppointments, hasFilters]);

  const handleNavigate = useCallback(
    (newDate: Date, _view: string, _action: string) => {
      setCurrentDate(newDate);
    },
    []
  );

  const eventPropGetter = useCallback(
    (event: unknown) => {
      const calEvent = event as CalendarEvent;
      const status = calEvent.resource?.status ?? "upcoming";
      const type = calEvent.resource?.appointmentType ?? "other";
      const statusCls = STATUS_CLASS[status] ?? STATUS_CLASS["upcoming"];
      const typeCls = TYPE_CLASS[type] ?? TYPE_CLASS["other"];
      return { className: `${statusCls} ${typeCls}` };
    },
    []
  );

  const handleEventDrop = useCallback(
    async ({ event, start, end }: { event: unknown; start: Date; end: Date }) => {
      const calEvent = event as CalendarEvent;
      if (onEventDrop) {
        try {
          await onEventDrop(calEvent.resource, start, end);
        } catch {
          // error already handled by caller / mutation onError
        }
      }
    },
    [onEventDrop]
  );

  const handleEventResize = useCallback(
    async ({ event, start, end }: { event: unknown; start: Date; end: Date }) => {
      const calEvent = event as CalendarEvent;
      const handler = onEventResize ?? onEventDrop;
      if (handler) {
        try {
          await handler(calEvent.resource, start, end);
        } catch {
          // error already handled by caller / mutation onError
        }
      }
    },
    [onEventDrop, onEventResize]
  );

  const messages = useMemo(
    () => ({
      next: t("common.next"),
      previous: t("common.previous"),
      today: t("appointments.calendar.today"),
      month: t("appointments.calendar.month"),
      week: t("appointments.calendar.week"),
      day: t("appointments.calendar.day"),
      agenda: t("appointments.calendar.agenda"),
    }),
    [t]
  );

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (isLoading || (hasFilters && isSearchFetching && searchAppointments.length === 0)) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="rbc-calendar-container rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <DnDCalendar
        localizer={localizer}
        events={events}
        date={currentDate}
        view={view}
        onView={setView}
        onNavigate={handleNavigate}
        onSelectEvent={(event: RBCEvent) => {
          const calEvent = event as CalendarEvent;
          onEventClick(calEvent.resource);
        }}
        onSelectSlot={({ start, end }: { start: Date; end: Date }) => onSlotSelect({ start, end })}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        eventPropGetter={eventPropGetter}
        selectable
        popup
        rtl={i18n.language === "ar"}
        culture={i18n.language === "ar" ? "ar" : undefined}
        messages={messages}
        step={30}
        timeslots={2}
        min={minDate}
        max={maxDate}
        style={{ height: "70vh" }}
      />
    </div>
  );
}
