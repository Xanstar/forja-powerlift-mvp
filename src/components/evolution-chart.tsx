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
  metricLabel = "Carga",
}: {
  nombre: string;
  datos: { fecha: string; peso: number }[];
  metricLabel?: string;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-chalk">{nombre}</h3>
        <span className="text-xs text-chalk-muted">{metricLabel} · kg</span>
      </div>
      <div className="h-56 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datos} accessibilityLayer={false}>
            <CartesianGrid stroke="#26272b" vertical={false} />
            <XAxis
              dataKey="fecha"
              stroke="#4f5b68"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#4f5b68"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={40}
              unit="kg"
            />
            <Tooltip
              contentStyle={{
                background: "#fbfaf6",
                border: "1px solid #10233d",
                borderRadius: 0,
                fontSize: 12,
                color: "#10233d",
              }}
            />
            <Line
              type="monotone"
              dataKey="peso"
              name={metricLabel}
              unit=" kg"
              stroke="#1f4e79"
              strokeWidth={2}
              dot={{ fill: "#1f4e79", r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{nombre}: {metricLabel} en kilogramos</caption>
        <thead>
          <tr><th>Fecha</th><th>{metricLabel}</th></tr>
        </thead>
        <tbody>
          {datos.map((dato, index) => (
            <tr key={`${dato.fecha}-${index}`}>
              <td>{dato.fecha}</td><td>{dato.peso} kg</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
