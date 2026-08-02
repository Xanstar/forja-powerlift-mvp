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
            <CartesianGrid stroke="var(--border-strong)" vertical={false} />
            <XAxis
              dataKey="fecha"
              stroke="var(--chalk-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--chalk-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={40}
              unit="kg"
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border-strong)",
                borderRadius: 0,
                fontSize: 12,
                color: "var(--chalk)",
              }}
            />
            <Line
              type="monotone"
              dataKey="peso"
              name={metricLabel}
              unit=" kg"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={{ fill: "var(--accent)", r: 3 }}
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
