"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/card";

export function EvolutionChart({
  nombre,
  datos,
}: {
  nombre: string;
  datos: { fecha: string; peso: number }[];
}) {
  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-chalk">{nombre}</h3>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datos}>
            <CartesianGrid stroke="#26272b" vertical={false} />
            <XAxis
              dataKey="fecha"
              stroke="#67686c"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#67686c"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={40}
              unit="kg"
            />
            <Tooltip
              contentStyle={{
                background: "#16171a",
                border: "1px solid #26272b",
                borderRadius: 8,
                fontSize: 12,
                color: "#f2f1ed",
              }}
            />
            <Line
              type="monotone"
              dataKey="peso"
              stroke="#e5484d"
              strokeWidth={2}
              dot={{ fill: "#e5484d", r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
