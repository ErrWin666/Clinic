import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UsersIcon } from "lucide-react";

interface DemographicsChartProps {
  data: { label: string; count: number }[];
  titleKey: string;
}

const COLORS = ["var(--primary)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

export function DemographicsChart({ data, titleKey }: DemographicsChartProps) {
  const { t } = useTranslation();

  const chartConfig: ChartConfig = {
    count: { label: t("dashboard.totalPatients") },
  };

  const chartData = data.map((item) => ({
    name: t(`patients.genders.${item.label}`) || t(`patients.types.${item.label}`) || item.label,
    value: item.count,
  }));

  if (!chartData.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/8 text-primary ring-1 ring-primary/10">
            <UsersIcon className="size-4" />
          </span>
          {t(titleKey)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          {chartData.map((entry, index) => (
            <div key={`legend-${index}`} className="flex items-center gap-1.5 text-xs">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
