import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ClockIcon, Loader2Icon } from "lucide-react";
import type { TimeSlot } from "@/services/AppointmentService";

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
  isLoading?: boolean;
}

export function TimeSlotPicker({
  slots,
  selectedSlot,
  onSelect,
  isLoading,
}: TimeSlotPickerProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        {t("appointments.loadingSlots")}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
        {t("appointments.noSlotsAvailable")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => {
        const isSelected =
          selectedSlot?.startTime === slot.startTime &&
          selectedSlot?.endTime === slot.endTime;

        return (
          <Button
            key={`${slot.startTime}-${slot.endTime}`}
            type="button"
            variant={isSelected ? "default" : "outline"}
            size="sm"
            className="flex flex-col gap-0.5 h-auto py-1.5"
            onClick={() => onSelect(slot)}
          >
            <span className="flex items-center gap-1 text-xs font-medium">
              <ClockIcon className="size-3" />
              {slot.startTime}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {slot.duration}min
            </span>
          </Button>
        );
      })}
    </div>
  );
}
