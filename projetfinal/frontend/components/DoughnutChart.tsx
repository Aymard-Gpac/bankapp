"use client";

import type { DoughnutChartProps } from "@/types";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const DoughnutChart = ({ accounts }: DoughnutChartProps) => {
  // ✅ labels + data compatibles SQLite
  const labels = accounts.map((a) => a.type ?? `Account ${a.id}`);

  const balances = accounts.map((a) => {
    // SQLite -> balance
    const v = typeof a.balance === "number" ? a.balance : 0;
    return v;
  });

  // ✅ si tout est à 0, Chart.js peut paraître "vide"
  const hasNonZero = balances.some((b) => b > 0);

  const data = {
    labels,
    datasets: [
      {
        label: "Accounts",
        data: hasNonZero ? balances : balances.map(() => 1), // fallback visuel
        backgroundColor: ["#0747b6", "#2265d8", "#2f91fa"],
      },
    ],
  };

  return (
    <Doughnut
      data={data}
      options={{
        cutout: "60%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const real = balances[ctx.dataIndex] ?? 0;
                return `${real.toFixed(2)} CAD`;
              },
            },
          },
        },
      }}
    />
  );
};

export default DoughnutChart;
