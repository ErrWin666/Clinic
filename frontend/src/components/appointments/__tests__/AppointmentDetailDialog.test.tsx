import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { AppointmentDetailDialog } from "@/components/appointments/AppointmentDetailDialog";
import type { Appointment } from "@/types/models";

const baseAppointment: Appointment = {
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

describe("AppointmentDetailDialog", () => {
  it("renders appointment displayId and status badge when open", () => {
    renderWithProviders(
      <AppointmentDetailDialog
        open={true}
        onOpenChange={vi.fn()}
        appointment={baseAppointment}
        onEdit={vi.fn()}
      />
    );
    expect(screen.getByText("APT-0001")).toBeInTheDocument();
    expect(screen.getAllByText(/upcoming/i).length).toBeGreaterThan(0);
  });

  it("shows Confirm and Mark No-show buttons for upcoming appointment", () => {
    renderWithProviders(
      <AppointmentDetailDialog
        open={true}
        onOpenChange={vi.fn()}
        appointment={baseAppointment}
        onEdit={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mark no-show/i })).toBeInTheDocument();
  });

  it("does not show Confirm button for non-upcoming appointment", () => {
    const completed = { ...baseAppointment, status: "completed" as const };
    renderWithProviders(
      <AppointmentDetailDialog
        open={true}
        onOpenChange={vi.fn()}
        appointment={completed}
        onEdit={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: /confirm/i })).not.toBeInTheDocument();
  });

  it("shows Create Examination button when patientId exists and no examination linked", () => {
    renderWithProviders(
      <AppointmentDetailDialog
        open={true}
        onOpenChange={vi.fn()}
        appointment={baseAppointment}
        onEdit={vi.fn()}
        onCreateExamination={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /create examination/i })).toBeInTheDocument();
  });

  it("shows Create Invoice button when patientId exists and no invoice linked", () => {
    renderWithProviders(
      <AppointmentDetailDialog
        open={true}
        onOpenChange={vi.fn()}
        appointment={baseAppointment}
        onEdit={vi.fn()}
        onCreateInvoice={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /create invoice/i })).toBeInTheDocument();
  });

  it("does not show Create Examination button when examination is already linked", () => {
    const withExam = {
      ...baseAppointment,
      examinationId: 5,
      examination: { id: 5, displayId: "EX-0001", examDate: "2026-12-01", examStatus: "completed" as const },
    };
    renderWithProviders(
      <AppointmentDetailDialog
        open={true}
        onOpenChange={vi.fn()}
        appointment={withExam}
        onEdit={vi.fn()}
        onCreateExamination={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: /create examination/i })).not.toBeInTheDocument();
    expect(screen.getByText("EX-0001")).toBeInTheDocument();
  });

  it("calls onEdit when Edit button is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <AppointmentDetailDialog
        open={true}
        onOpenChange={onOpenChange}
        appointment={baseAppointment}
        onEdit={onEdit}
      />
    );
    await user.click(screen.getByRole("button", { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(baseAppointment);
  });

  it("shows confirmed status badge for confirmed appointment", () => {
    const confirmed = { ...baseAppointment, status: "confirmed" as const };
    renderWithProviders(
      <AppointmentDetailDialog
        open={true}
        onOpenChange={vi.fn()}
        appointment={confirmed}
        onEdit={vi.fn()}
      />
    );
    expect(screen.getAllByText(/confirmed/i).length).toBeGreaterThan(0);
  });
});
