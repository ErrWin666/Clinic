import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { TimeSlotPicker } from "@/components/appointments/TimeSlotPicker";
import type { TimeSlot } from "@/services/AppointmentService";

const mockSlots: TimeSlot[] = [
  { startTime: "09:00", endTime: "09:30", duration: 30 },
  { startTime: "09:30", endTime: "10:00", duration: 30 },
  { startTime: "10:00", endTime: "10:30", duration: 30 },
];

describe("TimeSlotPicker", () => {
  it("renders loading state when isLoading is true", () => {
    renderWithProviders(
      <TimeSlotPicker slots={[]} selectedSlot={null} onSelect={vi.fn()} isLoading />
    );
    expect(screen.getByText(/loading available slots/i)).toBeInTheDocument();
  });

  it("renders no slots message when slots array is empty", () => {
    renderWithProviders(
      <TimeSlotPicker slots={[]} selectedSlot={null} onSelect={vi.fn()} />
    );
    expect(screen.getByText(/no available slots/i)).toBeInTheDocument();
  });

  it("renders slot buttons for each available slot", () => {
    renderWithProviders(
      <TimeSlotPicker slots={mockSlots} selectedSlot={null} onSelect={vi.fn()} />
    );
    expect(screen.getByText("09:00")).toBeInTheDocument();
    expect(screen.getByText("09:30")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
  });

  it("calls onSelect when a slot button is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(
      <TimeSlotPicker slots={mockSlots} selectedSlot={null} onSelect={onSelect} />
    );
    await user.click(screen.getByText("09:00"));
    expect(onSelect).toHaveBeenCalledWith(mockSlots[0]);
  });

  it("highlights the selected slot with default variant", () => {
    const { container } = renderWithProviders(
      <TimeSlotPicker
        slots={mockSlots}
        selectedSlot={mockSlots[1]}
        onSelect={vi.fn()}
      />
    );
    const buttons = container.querySelectorAll("button");
    const selectedButton = Array.from(buttons).find(
      (btn) => btn.textContent?.includes("09:30")
    );
    const unselectedButton = Array.from(buttons).find(
      (btn) => btn.textContent?.includes("09:00")
    );
    expect(selectedButton?.className).not.toBe(unselectedButton?.className);
  });
});
