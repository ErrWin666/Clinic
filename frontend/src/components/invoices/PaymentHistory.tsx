import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePayments, useCreatePayment, useDeletePayment } from "@/hooks/usePayments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, Trash2Icon, CreditCardIcon } from "lucide-react";
import { toast } from "sonner";
import { useApiError } from "@/hooks/useApiError";
import { config } from "@/lib/config";

interface PaymentHistoryProps {
  invoiceId: number;
  totalAmount: number;
  paidAmount: number;
}

export function PaymentHistory({ invoiceId, totalAmount, paidAmount }: PaymentHistoryProps) {
  const { t } = useTranslation();
  const { handleApiError } = useApiError();
  const [addOpen, setAddOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [note, setNote] = useState("");

  const { data: response, isLoading } = usePayments(invoiceId);
  const createMutation = useCreatePayment(invoiceId);
  const deleteMutation = useDeletePayment(invoiceId);

  const payments = response?.data || [];
  const remaining = Number(totalAmount) - Number(paidAmount);

  const handleAdd = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error(t("payments.invalidAmount"));
      return;
    }
    if (amt > remaining) {
      toast.error(t("payments.exceedsRemaining"));
      return;
    }
    try {
      await createMutation.mutateAsync({
        amount: amt,
        paymentDate,
        paymentMethod,
        note: note || undefined,
      });
      toast.success(t("payments.recorded"));
      setAddOpen(false);
      setAmount("");
      setNote("");
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleDelete = async (paymentId: number) => {
    try {
      await deleteMutation.mutateAsync(paymentId);
      toast.success(t("payments.deleted"));
    } catch (error) {
      handleApiError(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <CreditCardIcon className="size-4" />
            {t("payments.title")}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)} disabled={remaining <= 0}>
            <PlusIcon className="size-4" />
            {t("payments.addPayment")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-lg font-bold">{config.defaultCurrency} {Number(totalAmount).toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">{t("payments.total")}</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-lg font-bold text-green-600">{config.defaultCurrency} {Number(paidAmount).toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">{t("payments.paid")}</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-lg font-bold text-orange-600">{config.defaultCurrency} {remaining.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">{t("payments.remaining")}</div>
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground py-4">{t("common.loading")}</p>
        ) : payments.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">{t("payments.noPayments")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("payments.date")}</TableHead>
                <TableHead>{t("payments.amount")}</TableHead>
                <TableHead>{t("payments.method")}</TableHead>
                <TableHead>{t("payments.note")}</TableHead>
                <TableHead className="text-end">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">
                    {config.defaultCurrency} {Number(payment.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {t(`payments.methods.${payment.paymentMethod}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{payment.note || "—"}</TableCell>
                  <TableCell className="text-end">
                    <Button variant="ghost" size="sm" aria-label={t("common.delete")} onClick={() => handleDelete(payment.id)}>
                      <Trash2Icon className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("payments.addPayment")}</DialogTitle>
              <DialogDescription>{t("payments.addDescription")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payment-amount">{t("payments.amount")}</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={remaining.toFixed(2)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-date">{t("payments.date")}</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("payments.method")}</Label>
                <Select value={paymentMethod} onValueChange={(v) => { if (v) setPaymentMethod(v); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t("payments.methods.cash")}</SelectItem>
                    <SelectItem value="card">{t("payments.methods.card")}</SelectItem>
                    <SelectItem value="transfer">{t("payments.methods.transfer")}</SelectItem>
                    <SelectItem value="cheque">{t("payments.methods.cheque")}</SelectItem>
                    <SelectItem value="other">{t("payments.methods.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-note">{t("payments.note")}</Label>
                <Input
                  id="payment-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("payments.notePlaceholder")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>{t("common.cancel")}</Button>
              <Button onClick={handleAdd} disabled={createMutation.isPending}>
                {t("payments.record")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
