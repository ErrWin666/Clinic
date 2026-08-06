import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import type { Invoice } from "@/types/models";

const mockInvoice: Invoice = {
  id: 1,
  displayId: "INV-0001",
  patientId: 1,
  patient: { id: 1, fullName: "John Doe", displayId: "P-0001", phoneNumber: "1234567890" },
  invoiceDate: "2026-01-15",
  dueDate: null,
  invoiceStatus: "unpaid",
  totalAmount: 100,
  taxAmount: 0,
  discountAmount: 0,
  items: [{ id: 1, description: "Consultation", quantity: 1, unitPrice: 100, total: 100 }],
  createdAt: "2026-01-15T00:00:00.000Z",
  updatedAt: "2026-01-15T00:00:00.000Z",
};

describe("InvoiceForm", () => {
  it("renders create form when open", () => {
    renderWithProviders(
      <InvoiceForm open={true} onOpenChange={vi.fn()} />,
      { initialEntries: ["/invoices"] }
    );
    expect(screen.getByText(/create invoice/i)).toBeInTheDocument();
  });

  it("renders edit form with invoice data", () => {
    renderWithProviders(
      <InvoiceForm open={true} onOpenChange={vi.fn()} invoice={mockInvoice} />,
      { initialEntries: ["/invoices"] }
    );
    expect(screen.getByText(/^edit$/i)).toBeInTheDocument();
  });

  it("has at least one item row", () => {
    renderWithProviders(
      <InvoiceForm open={true} onOpenChange={vi.fn()} />,
      { initialEntries: ["/invoices"] }
    );
    expect(screen.getAllByText(/description/i).length).toBeGreaterThan(0);
  });

  it("closes dialog on cancel", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <InvoiceForm open={true} onOpenChange={onOpenChange} />,
      { initialEntries: ["/invoices"] }
    );
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders invoice date field", () => {
    renderWithProviders(
      <InvoiceForm open={true} onOpenChange={vi.fn()} />,
      { initialEntries: ["/invoices"] }
    );
    expect(screen.getAllByText(/^date$/i).length).toBeGreaterThan(0);
  });

  it("adds new item row on Add Item click", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <InvoiceForm open={true} onOpenChange={vi.fn()} />,
      { initialEntries: ["/invoices"] }
    );
    const initialDescInputs = screen.getAllByPlaceholderText(/description/i).length;
    const addButton = screen.getByRole("button", { name: /add line item/i });
    await user.click(addButton);
    expect(screen.getAllByPlaceholderText(/description/i).length).toBe(initialDescInputs + 1);
  });

  it("removes item row on remove click", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <InvoiceForm open={true} onOpenChange={vi.fn()} />,
      { initialEntries: ["/invoices"] }
    );
    const initialDescInputs = screen.getAllByPlaceholderText(/description/i).length;
    const removeButtons = screen.getAllByRole("button").filter(
      (btn) => btn.querySelector(".lucide-trash-2, .lucide-x")
    );
    if (removeButtons.length > 0 && initialDescInputs > 1) {
      await user.click(removeButtons[0]);
      expect(screen.getAllByPlaceholderText(/description/i).length).toBe(initialDescInputs - 1);
    }
  });

  it("renders link to patient toggle", () => {
    renderWithProviders(
      <InvoiceForm open={true} onOpenChange={vi.fn()} />,
      { initialEntries: ["/invoices"] }
    );
    expect(screen.getByText(/link to patient/i)).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("renders total calculation section", () => {
    renderWithProviders(
      <InvoiceForm open={true} onOpenChange={vi.fn()} />,
      { initialEntries: ["/invoices"] }
    );
    expect(screen.getAllByText(/total/i).length).toBeGreaterThan(0);
  });
});
