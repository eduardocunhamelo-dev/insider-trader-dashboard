import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL, formatDate } from "@/lib/format";
import type { DashboardResponse } from "./types";

interface EquityChartProps {
  curve: DashboardResponse["equity_curve"];
  initial: number;
  floor: number;
  target: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-card border border-white/[0.06] rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold text-foreground">
        {formatBRL(item.value)}
      </p>
    </div>
  );
}

export default function EquityChart({ curve, initial, floor, target }: EquityChartProps) {
  if (!curve || curve.length === 0) return null;

  // Use index as X by default; switch to date if there are multiple distinct dates
  const distinctDates = new Set(curve.map((p) => p.date)).size;
  const useDate = distinctDates > 1;

  const data = curve.map((p) => ({
    x: useDate
      ? p.date
        ? formatDate(p.date)
        : `#${p.index}`
      : `#${p.index + 1}`,
    rawDate: p.date,
    balance: p.balance,
  }));

  // Calculate Y domain with some padding
  const allValues = curve.map((p) => p.balance);
  const minVal = Math.min(...allValues, floor);
  const maxVal = Math.max(...allValues, target);
  const padding = (maxVal - minVal) * 0.05;
  const yMin = Math.floor((minVal - padding) / 100) * 100;
  const yMax = Math.ceil((maxVal + padding) / 100) * 100;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Curva de Equity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="x"
                tick={{ fontSize: 11, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[yMin, yMax]}
                tickFormatter={(v) => formatBRL(v)}
                tick={{ fontSize: 10, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Initial balance — dashed gray */}
              <ReferenceLine
                y={initial}
                stroke="#9CA3AF"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{ value: "Inicial", position: "insideTopRight", fontSize: 10, fill: "#9CA3AF" }}
              />
              {/* Drawdown floor — dashed red */}
              <ReferenceLine
                y={floor}
                stroke="#EF4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{ value: "Piso", position: "insideBottomRight", fontSize: 10, fill: "#EF4444" }}
              />
              {/* Target — dashed emerald */}
              <ReferenceLine
                y={target}
                stroke="#10B981"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{ value: "Meta", position: "insideTopRight", fontSize: 10, fill: "#10B981" }}
              />
              {/* Equity line */}
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ r: 2, fill: "#10B981", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#10B981" }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
