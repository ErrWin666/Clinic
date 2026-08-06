import { useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeftRight, PackageCheck, Boxes, ClipboardCheck, BookOpenIcon } from "lucide-react";

const ProductsTab = lazy(() => import("@/components/inventory/ProductsTab").then((m) => ({ default: m.ProductsTab })));
const StockMovementsTab = lazy(() => import("@/components/inventory/StockMovementsTab").then((m) => ({ default: m.StockMovementsTab })));
const ExamConsumableRulesTab = lazy(() => import("@/components/inventory/ExamConsumableRulesTab").then((m) => ({ default: m.ExamConsumableRulesTab })));
const ProductBundlesTab = lazy(() => import("@/components/inventory/ProductBundlesTab").then((m) => ({ default: m.ProductBundlesTab })));
const StocktakingTab = lazy(() => import("@/components/inventory/StocktakingTab").then((m) => ({ default: m.StocktakingTab })));

function TabSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function InventoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("products");

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={Package}
        title={t("inventory.title")}
        actions={
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/inventory/guide")}>
            <BookOpenIcon className="size-4" />
            <span className="hidden sm:inline">{t("navigation.inventoryGuide")}</span>
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-3xl">
          <TabsTrigger value="products" className="gap-2">
            <Package className="size-4" />
            <span className="hidden sm:inline">{t("inventory.products")}</span>
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-2">
            <ArrowLeftRight className="size-4" />
            <span className="hidden sm:inline">{t("inventory.stockMovements")}</span>
          </TabsTrigger>
          <TabsTrigger value="consumables" className="gap-2">
            <PackageCheck className="size-4" />
            <span className="hidden sm:inline">{t("inventory.examConsumables")}</span>
          </TabsTrigger>
          <TabsTrigger value="bundles" className="gap-2">
            <Boxes className="size-4" />
            <span className="hidden sm:inline">{t("inventory.productBundles")}</span>
          </TabsTrigger>
          <TabsTrigger value="stocktaking" className="gap-2">
            <ClipboardCheck className="size-4" />
            <span className="hidden sm:inline">{t("inventory.stocktaking.title")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          <Suspense fallback={<TabSkeleton />}>
            <ProductsTab />
          </Suspense>
        </TabsContent>
        <TabsContent value="movements" className="mt-4">
          <Suspense fallback={<TabSkeleton />}>
            <StockMovementsTab />
          </Suspense>
        </TabsContent>
        <TabsContent value="consumables" className="mt-4">
          <Suspense fallback={<TabSkeleton />}>
            <ExamConsumableRulesTab />
          </Suspense>
        </TabsContent>
        <TabsContent value="bundles" className="mt-4">
          <Suspense fallback={<TabSkeleton />}>
            <ProductBundlesTab />
          </Suspense>
        </TabsContent>
        <TabsContent value="stocktaking" className="mt-4">
          <Suspense fallback={<TabSkeleton />}>
            <StocktakingTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
