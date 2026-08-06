import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PrinterIcon, BarcodeIcon } from "lucide-react";
import JsBarcode from "jsbarcode";

export interface BarcodeItem {
  name: string;
  shortName: string;
  barcode: string;
  sellPrice?: number | null;
}

interface BarcodePrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: BarcodeItem[];
  clinicName?: string;
}

type ColumnsPerRow = 1 | 2 | 3 | 4;

export function BarcodePrintDialog({
  open,
  onOpenChange,
  items,
  clinicName,
}: BarcodePrintDialogProps) {
  const { t } = useTranslation();
  const [columns, setColumns] = useState<ColumnsPerRow>(3);
  const canvasRefs = useRef<Map<string, HTMLCanvasElement | null>>(new Map());

  // Render barcodes on canvases whenever items or open state changes
  useEffect(() => {
    if (!open) return;
    // Small delay to ensure canvases are mounted
    const timer = setTimeout(() => {
      for (const item of items) {
        if (!item.barcode) continue;
        const canvas = canvasRefs.current.get(item.barcode);
        if (!canvas) continue;
        try {
          JsBarcode(canvas, item.barcode, {
            format: "CODE128",
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 12,
            margin: 4,
          });
        } catch {
          // Invalid barcode characters — skip
        }
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [open, items]);

  const handlePrint = () => {
    window.print();
  };

  const validItems = items.filter((item) => item.barcode);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarcodeIcon className="size-5" />
            {t("inventory.barcode.printTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("inventory.barcode.printDescription")}
          </DialogDescription>
        </DialogHeader>

        {/* Controls (hidden when printing) */}
        <div className="no-print flex items-center gap-3 border-b pb-3">
          <span className="text-sm text-muted-foreground">
            {t("inventory.barcode.columnsPerRow")}
          </span>
          <Select
            value={String(columns)}
            onValueChange={(v) => setColumns(Number(v) as ColumnsPerRow)}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Button onClick={handlePrint} disabled={validItems.length === 0}>
            <PrinterIcon className="size-4" />
            {t("inventory.barcode.print")}
          </Button>
        </div>

        {/* Barcode preview / print area */}
        {validItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("inventory.barcode.noBarcodes")}
          </p>
        ) : (
          <div
            className="barcode-print-area grid gap-3"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {validItems.map((item) => (
              <div
                key={item.barcode}
                className="barcode-label flex flex-col items-center justify-center rounded-lg border border-border/60 p-2"
              >
                {clinicName && (
                  <span className="text-[10px] font-semibold text-foreground truncate w-full text-center">
                    {clinicName}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                  {item.name} ({item.shortName})
                </span>
                <canvas
                  ref={(el) => {
                    if (el) canvasRefs.current.set(item.barcode!, el);
                  }}
                />
                {item.sellPrice != null && (
                  <span className="text-xs font-bold text-primary">
                    {item.sellPrice}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
