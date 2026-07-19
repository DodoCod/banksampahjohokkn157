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

export function DashboardCharts({ data }: { data: DashboardSummary }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-4">
        <p className="text-sm font-medium mb-3">Pengumpulan per bulan (kg)</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.pengumpulanPerBulan}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ec" vertical={false} />
              <XAxis dataKey="bulan" tick={{ fontSize: 11 }} stroke="#667085" />
              <YAxis tick={{ fontSize: 11 }} stroke="#667085" />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e7ec" }}
              />
              <Bar dataKey="kg" fill={GREEN} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <p className="text-sm font-medium mb-3">Penjualan &amp; laba per bulan</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.penjualanPerBulan}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ec" vertical={false} />
              <XAxis dataKey="bulan" tick={{ fontSize: 11 }} stroke="#667085" />
              <YAxis tick={{ fontSize: 11 }} stroke="#667085" />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e7ec" }}
              />
              <Line type="monotone" dataKey="pendapatan" stroke={GREEN} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="laba" stroke={AMBER} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 md:col-span-2">
        <p className="text-sm font-medium mb-3">Jenis sampah terbanyak (kg terkumpul)</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.jenisTerbanyak} layout="vertical" margin={{ left: -30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ec" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#667085" />
              <YAxis dataKey="nama" type="category" tick={{ fontSize: 11 }} stroke="#667085" width={100} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e7ec" }}
              />
              <Bar dataKey="kg" fill={GREEN} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
