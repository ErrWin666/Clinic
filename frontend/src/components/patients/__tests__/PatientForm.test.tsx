import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { PatientForm } from "@/components/patients/PatientForm";
import type { Patient } from "@/types/models";

const mockPatient: Patient = {
  id: 1,
  displayId: "P-0001",
  fullName: "John Doe",
  birthDate: "1990-01-01",
  gender: "male",
  phoneNumber: "5551234567",
  email: "john@test.com",
  address: "123 Main St",
  patientType: "regular",
  notes: "Test notes",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("PatientForm", () => {
  it("renders create form with empty fields", () => {
    renderWithProviders(
      <PatientForm open={true} onOpenChange={vi.fn()} onSubmit={vi.fn()} isPending={false} />
    );
    expect(screen.getByText(/add patient/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toHaveValue("");
  });

  it("renders edit form with patient data", () => {
    renderWithProviders(
      <PatientForm open={true} onOpenChange={vi.fn()} patient={mockPatient} onSubmit={vi.fn()} isPending={false} />
    );
    expect(screen.getByText(/edit patient/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toHaveValue("John Doe");
    expect(screen.getByLabelText(/phone number/i)).toHaveValue("5551234567");
  });

  it("validates required fullName (min 2)", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(
      <PatientForm open={true} onOpenChange={vi.fn()} onSubmit={onSubmit} isPending={false} />
    );
    await user.type(screen.getByLabelText(/full name/i), "A");
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/>=2/i)).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("validates email format", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(
      <PatientForm open={true} onOpenChange={vi.fn()} onSubmit={onSubmit} isPending={false} />
    );
    await user.type(screen.getByLabelText(/full name/i), "Test Patient");
    await user.type(screen.getByLabelText(/date of birth/i), "1990-01-01");
    await user.type(screen.getByLabelText(/phone number/i), "5551234567");
    await user.type(screen.getByLabelText(/email/i), "invalid-email");
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it("submits create form with valid data", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    renderWithProviders(
      <PatientForm open={true} onOpenChange={onOpenChange} onSubmit={onSubmit} isPending={false} />
    );
    await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/date of birth/i), "1995-05-15");
    await user.type(screen.getByLabelText(/phone number/i), "5559876543");
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "Jane Doe",
          birthDate: "1995-05-15",
          phoneNumber: "5559876543",
        }),
        false
      );
    });
  });

  it("submits edit form with isEdit=true", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <PatientForm open={true} onOpenChange={vi.fn()} patient={mockPatient} onSubmit={onSubmit} isPending={false} />
    );
    await user.clear(screen.getByLabelText(/address/i));
    await user.type(screen.getByLabelText(/address/i), "456 New St");
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ address: "456 New St" }),
        true
      );
    });
  });

  it("closes dialog on cancel", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <PatientForm open={true} onOpenChange={onOpenChange} onSubmit={vi.fn()} isPending={false} />
    );
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows loading state when isPending", () => {
    renderWithProviders(
      <PatientForm open={true} onOpenChange={vi.fn()} onSubmit={vi.fn()} isPending={true} />
    );
    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });

  it("validates required birthDate", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(
      <PatientForm open={true} onOpenChange={vi.fn()} onSubmit={onSubmit} isPending={false} />
    );
    await user.type(screen.getByLabelText(/full name/i), "Test Patient");
    await user.type(screen.getByLabelText(/phone number/i), "5551234567");
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it("validates phoneNumber (min 3)", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(
      <PatientForm open={true} onOpenChange={vi.fn()} onSubmit={onSubmit} isPending={false} />
    );
    await user.type(screen.getByLabelText(/full name/i), "Test Patient");
    await user.type(screen.getByLabelText(/date of birth/i), "1990-01-01");
    await user.type(screen.getByLabelText(/phone number/i), "12");
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it("renders gender select with options", () => {
    renderWithProviders(
      <PatientForm open={true} onOpenChange={vi.fn()} onSubmit={vi.fn()} isPending={false} />
    );
    expect(screen.getByLabelText(/gender/i)).toBeInTheDocument();
  });
});
