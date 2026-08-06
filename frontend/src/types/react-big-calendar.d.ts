declare module "react-big-calendar" {
  import type { Component } from "react";

  export interface ViewProps {
    date: Date;
    [key: string]: unknown;
  }

  export interface CalendarProps {
    events?: unknown[];
    date?: Date;
    view?: string;
    onView?: (view: string) => void;
    onNavigate?: (newDate: Date, view: string, action: string) => void;
    onSelectEvent?: (event: unknown, e: unknown) => void;
    onSelectSlot?: (slotInfo: { start: Date; end: Date; slots: Date[]; action: string }) => void;
    onEventDrop?: ({ event, start, end }: { event: unknown; start: Date; end: Date }) => void;
    eventPropGetter?: (event: unknown, start: Date, end: Date, isSelected: boolean) => { className?: string; style?: React.CSSProperties };
    slotPropGetter?: (date: Date) => { className?: string; style?: React.CSSProperties };
    dayPropGetter?: (date: Date) => { className?: string; style?: React.CSSProperties };
    style?: React.CSSProperties;
    className?: string;
    popup?: boolean;
    culture?: string;
    localizer?: unknown;
    formats?: Record<string, unknown>;
    messages?: Record<string, string>;
    components?: Record<string, unknown>;
    step?: number;
    showMultiDayTimes?: boolean;
    min?: Date;
    max?: Date;
    timeslots?: number;
    scrollToTime?: Date;
    selectable?: boolean;
    longPressThreshold?: number;
    toolbar?: boolean;
    views?: string[] | Record<string, unknown>;
    defaultView?: string;
    [key: string]: unknown;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export class Calendar<TEvent = unknown> extends Component<CalendarProps> {}

  export function momentLocalizer(moment: unknown): unknown;
  export function dateFnsLocalizer(config: unknown): unknown;
  export function dayjsLocalizer(dayjs: unknown): unknown;

  export function navigate(
    date: Date,
    action: "PREV" | "NEXT" | "TODAY" | "DATE",
    view?: string
  ): Date;

  export const Views: Record<string, string>;
  export const Navigate: Record<string, string>;
}

declare module "react-big-calendar/lib/localizers/moment" {
  export function momentLocalizer(moment: unknown): unknown;
}

declare module "react-big-calendar/lib/css/react-big-calendar.css" {}

declare module "react-big-calendar/lib/addons/dragAndDrop" {
  import type { Component } from "react";
  import type { CalendarProps } from "react-big-calendar";

  interface DragAndDropCalendarProps extends CalendarProps {
    onEventDrop?: (data: { event: unknown; start: Date; end: Date; isAllDay: boolean }) => void;
    onEventResize?: (data: { event: unknown; start: Date; end: Date; isAllDay: boolean }) => void;
    draggableAccessor?: (event: unknown) => boolean;
    resizableAccessor?: (event: unknown) => boolean;
    onDragStart?: (data: unknown) => void;
    onDragOver?: (data: unknown) => void;
    onDropFromOutside?: (data: unknown) => void;
    dragFromOutsideItem?: () => unknown;
  }

  function withDragAndDrop<P extends CalendarProps>(
    calendar: Component<P>
  ): Component<DragAndDropCalendarProps & P>;

  export default withDragAndDrop;
}

declare module "react-big-calendar/lib/addons/dragAndDrop/styles.css" {}

declare module "moment/locale/*" {}
