import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { config } from "@/lib/config";
import { useSettings } from "@/hooks/useSettings";
import type { InvoiceFormValues } from "@/types/invoice";

interface InvoicePreviewProps {
  values: InvoiceFormValues;
  displayId?: string;
  patientName?: string;
  patientAddress?: string | null;
  patientPhone?: string | null;
  linkToPatient: boolean;
}

export function InvoicePreview({
  values,
  displayId,
  patientName,
  patientAddress,
  patientPhone,
  linkToPatient,
}: InvoicePreviewProps) {
  const { t } = useTranslation();
  const { data: settingsData } = useSettings();
  const clinicName = (settingsData?.data?.clinic?.name as string) || config.appName;

  const items = values.items ?? [];
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const tax = Number(values.taxAmount) || 0;
  const discount = Number(values.discountAmount) || 0;
  const total = subtotal + tax - discount;

  const invoiceDate = values.invoiceDate
    ? dayjs(values.invoiceDate).format("MMM DD, YYYY")
    : dayjs().format("MMM DD, YYYY");
  const dueDate = values.dueDate
    ? dayjs(values.dueDate).format("MMM DD, YYYY")
    : "—";

  const billToName = linkToPatient
    ? patientName || "—"
    : values.customerName || "—";
  const billToLines = linkToPatient
    ? [patientAddress, patientPhone].filter(Boolean)
    : [values.customerPhone].filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-[780px] rounded-xl bg-white text-neutral-900 shadow-xl ring-1 ring-black/5 dark:bg-neutral-50 dark:text-neutral-800">
      {/* Paper */}
      <div className="flex flex-col gap-8 p-8 sm:p-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            {values.logo ? (
              <img
                src={values.logo}
                alt="logo"
                className="h-16 w-16 rounded-lg object-contain"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-neutral-200 dark:bg-neutral-300">
                <svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold tracking-tight">{clinicName}</h2>
              {values.noteContactLine && (
                <p className="text-xs text-neutral-500">{values.noteContactLine}</p>
              )}
              {values.notePhone && (
                <p className="text-xs text-neutral-500">{values.notePhone}</p>
              )}
              {values.noteEmail && (
                <p className="text-xs text-neutral-500">{values.noteEmail}</p>
              )}
            </div>
          </div>
          <div className="text-end">
            <h1 className="text-3xl font-black tracking-wider text-neutral-800 dark:text-neutral-900">
              {t("invoices.invoiceLabel")}
            </h1>
            <p className="mt-1 font-mono text-sm text-neutral-500">
              {displayId || "—"}
            </p>
          </div>
        </div>

        {/* Bill To + Dates */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {t("invoices.billTo")}
            </p>
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-900">
              {billToName}
            </p>
            {billToLines.map((line, i) => (
              <p key={i} className="text-xs text-neutral-500">{line}</p>
            ))}
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">{t("invoices.fields.invoiceDate")}</span>
              <span className="font-medium">{invoiceDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">{t("invoices.fields.dueDate")}</span>
              <span className="font-medium">{dueDate}</span>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-300">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-100 dark:bg-neutral-200">
                <th className="px-4 py-2.5 text-start font-semibold text-neutral-600">
                  {t("invoices.fields.description")}
                </th>
                <th className="w-16 px-3 py-2.5 text-center font-semibold text-neutral-600">
                  {t("invoices.fields.quantity")}
                </th>
                <th className="w-28 px-3 py-2.5 text-end font-semibold text-neutral-600">
                  {t("invoices.fields.unitPrice")}
                </th>
                <th className="w-28 px-4 py-2.5 text-end font-semibold text-neutral-600">
                  {t("invoices.amount")}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-neutral-400">
                    {t("invoices.noItems")}
                  </td>
                </tr>
              ) : (
                items.map((item, i) => (
                  <tr
                    key={i}
                    className="border-t border-neutral-100 dark:border-neutral-200"
                  >
                    <td className="px-4 py-2.5 text-neutral-700 dark:text-neutral-800">
                      {item.description || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-neutral-600">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2.5 text-end font-mono text-neutral-600">
                      {(Number(item.unitPrice) || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-end font-mono font-medium text-neutral-800 dark:text-neutral-900">
                      {((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">{t("invoices.subtotalCalc")}</span>
              <span className="font-mono font-medium">{subtotal.toFixed(2)} {config.defaultCurrency}</span>
            </div>
            {tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">{t("invoices.fields.taxAmount")}</span>
                <span className="font-mono">+{tax.toFixed(2)} {config.defaultCurrency}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">{t("invoices.fields.discountAmount")}</span>
                <span className="font-mono text-red-600">-{discount.toFixed(2)} {config.defaultCurrency}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-neutral-200 pt-2 dark:border-neutral-300">
              <span className="text-base font-bold">{t("invoices.balanceDue")}</span>
              <span className="font-mono text-base font-bold">
                {total.toFixed(2)} {config.defaultCurrency}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {values.noteMessage && (
          <div className="border-t border-neutral-200 pt-4 dark:border-neutral-300">
            <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {t("invoices.fields.notes")}
            </p>
            <p className="text-sm whitespace-pre-wrap text-neutral-600">
              {values.noteMessage}
            </p>
          </div>
        )}

        {/* Thank you */}
        <div className="border-t border-neutral-200 pt-4 text-center dark:border-neutral-300">
          <p className="text-sm font-medium text-neutral-500">
            {t("invoices.thankYou")}
          </p>
        </div>
      </div>
    </div>
  );
}
