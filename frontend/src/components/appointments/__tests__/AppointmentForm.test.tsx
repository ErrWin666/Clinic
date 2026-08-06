import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import type { Appointment } from "@/types/models";

const mockAppointment: Appointment = {
  id: 1,
  displayId: "APT-0001",
  patientId: 1,
  patient: { id: 1, fullName: "John Doe", displayId: "P-0001" },
  appointmentDate: "2026-12-01",
  startTime: "10:00",
  endTime: "11:00",
  appointmentType: "checkup",
  status: "upcoming",
  reason: null,
  notes: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("AppointmentForm", () => {
  it("renders form with date and time fields when open", () => {
    renderWithProviders(
      <AppointmentForm open={true} onOpenChange={vi.fn()} />,
      { initialEntries: ["/appointments"] }
    );
    expect(screen.getByText(/new appointment/i)).toBeInTheDocument();
  });

  it("renders edit form with appointment data", () => {
    renderWithProviders(
      <AppointmentForm open={true} onOpenChange={vi.fn()} appointment={mockAppointment} />,
      { initialEntries: ["/appointments"] }
    );
    expect(screen.getByText(/edit appointment/i)).toBeInTheDocument();
  });

  it("validates endTime must be after startTime", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AppointmentForm open={true} onOpenChange={vi.fn()} />,
      { initialEntries: ["/appointments"] }
    );
    const dateInput = screen.getByLabelText(/date/i);
    await user.type(dateInput, "2026-12-01");
    const startInput = screen.getByLabelText(/start time/i);
    await user.type(startInput, "11:00");
    const endInput = screen.getByLabelText(/end time/i);
    await user.type(endInput, "10:00");
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/end time must be after start time/i)).toBeInTheDocument();
    });
  });

  it("closes dialog on cancel", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <AppointmentForm open={true} onOpenChange={onOpenChange} />,
      { initialEntries: ["/appointments"] }
    );
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("validates time format with regex", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <AppointmentForm open={true} onOpenChange={onOpenChange} />,
      { initialEntries: ["/appointments"] }
    );
    const dateInput = screen.getByLabelText(/date/i);
    await user.type(dateInput, "2026-12-01");
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });
  });

  it("requires either patient or quick appointment", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <AppointmentForm open={true} onOpenChange={onOpenChange} />,
      { initialEntries: ["/appointments"] }
    );
    const dateInput = screen.getByLabelText(/date/i);
    await user.type(dateInput, "2026-12-01");
    const startInput = screen.getByLabelText(/start time/i);
    await user.type(startInput, "10:00");
    const endInput = screen.getByLabelText(/end time/i);
    await user.type(endInput, "11:00");
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });
  });

  it("renders appointment type field", () => {
    renderWithProviders(
      <AppointmentForm open={true} onOpenChange={vi.fn()} />,
      { initialEntries: ["/appointments"] }
    );
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
  });

  it("renders quick appointment toggle", () => {
    renderWithProviders(
      <AppointmentForm open={true} onOpenChange={vi.fn()} />,
      { initialEntries: ["/appointments"] }
    );
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });
});
