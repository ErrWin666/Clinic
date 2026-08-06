import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { useTranslation } from "react-i18next";
import { DollarSignIcon } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { config } from "@/lib/config";

interface RevenueChartProps {
  data: { month: string; amount: number }[];
}

const chartConfig = {
  amount: {
    label: "Revenue",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function RevenueChart({ data }: RevenueChartProps) {
  const { t } = useTranslation();
  const currency = config.defaultCurrency;

  return (
    <Card className="group shadow-card border-border/60 transition-all duration-300 hover:shadow-hover">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/15 dark:text-emerald-400">
            <DollarSignIcon className="size-4.5" />
          </div>
          <div>
            <CardTitle className="font-heading text-base font-semibold">
              {t("dashboard.revenueChart")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.revenueChartDescription")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <AreaChart data={data} accessibilityLayer>
            <defs>
              <linearGradient id="fillAmount" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-amount)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-amount)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `${currency} ${Number(value).toFixed(2)}`}
                />
              }
            />
            <Area
              dataKey="amount"
              type="monotone"
              stroke="var(--color-amount)"
              fill="url(#fillAmount)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
