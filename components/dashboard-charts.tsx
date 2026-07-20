"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/primitives";
import type { DashboardSummary } from "@/types";

const GREEN = "#16a34a";
const AMBER = "#c98a2c";
const GRID = "#e4e7ec";
const AXIS_TEXT = "#667085";

// Lebar sumbu Y disamakan di semua chart supaya area plot mulai dari titik
// horizontal yang sama (chart jadi terlihat sejajar satu sama lain).
const Y_AXIS_WIDTH = 40;
const CHART_MARGIN = { top: 8, right: 8, left: 0, bottom: 0 };

const compactNumber = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  compactDisplay: "short",
});

const tickStyle = { fontSize: 11, fill: AXIS_TEXT };

export function DashboardCharts({ data }: { data: DashboardSummary }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-4">
        <p className="text-sm font-medium mb-3">Pengumpulan per bulan (kg)</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.pengumpulanPerBulan} margin={CHART_MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis
                dataKey="bulan"
                tick={tickStyle}
                tickLine={false}
                axisLine={{ stroke: GRID }}
              />
              <YAxis
                width={Y_AXIS_WIDTH}
                tick={tickStyle}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                domain={[0, (max: number) => Math.max(4, Math.ceil(max * 1.2))]}
              />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${GRID}` }} />
              <Bar dataKey="kg" fill={GREEN} radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <p className="text-sm font-medium mb-3">Penjualan &amp; laba per bulan</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.penjualanPerBulan} margin={CHART_MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis
                dataKey="bulan"
                tick={tickStyle}
                tickLine={false}
                axisLine={{ stroke: GRID }}
              />
              <YAxis
                width={Y_AXIS_WIDTH}
                tick={tickStyle}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tickFormatter={(v: number) => compactNumber.format(v)}
                domain={[0, (max: number) => Math.max(4, Math.ceil(max * 1.2))]}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${GRID}` }}
                formatter={(value) => compactNumber.format(Number(value))}
              />
              <Line
                type="monotone"
                dataKey="pendapatan"
                stroke={GREEN}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="laba"
                stroke={AMBER}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 md:col-span-2">
        <p className="text-sm font-medium mb-3">Jenis sampah terbanyak (kg terkumpul)</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.jenisTerbanyak}
              layout="vertical"
              margin={{ ...CHART_MARGIN, left: 8 }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
              <XAxis
                type="number"
                tick={tickStyle}
                tickLine={false}
                axisLine={{ stroke: GRID }}
                allowDecimals={false}
              />
              <YAxis
                dataKey="nama"
                type="category"
                tick={tickStyle}
                tickLine={false}
                axisLine={false}
                width={110}
              />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${GRID}` }} />
              <Bar dataKey="kg" fill={GREEN} radius={[0, 4, 4, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
