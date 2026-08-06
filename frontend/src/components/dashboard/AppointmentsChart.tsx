import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { useTranslation } from "react-i18next";
import { CalendarDaysIcon } from "lucide-react";
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

interface AppointmentsChartProps {
  data: { month: string; count: number }[];
}

const chartConfig = {
  count: {
    label: "Appointments",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function AppointmentsChart({ data }: AppointmentsChartProps) {
  const { t } = useTranslation();

  return (
    <Card className="group shadow-card border-border/60 transition-all duration-300 hover:shadow-hover">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
            <CalendarDaysIcon className="size-4.5" />
          </div>
          <div>
            <CardTitle className="font-heading text-base font-semibold">
              {t("dashboard.appointmentsChart")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.appointmentsChartDescription")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <BarChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} className="transition-opacity duration-200 hover:opacity-80" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
