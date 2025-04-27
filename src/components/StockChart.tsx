// src/components/StockChart.tsx

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

// ✅ You must define the props here
export type StockChartProps = {
  symbol: string;
  apiKey: string;
};

export default function StockChart({ symbol, apiKey }: StockChartProps) {
  const [prices, setPrices] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [range, setRange] = useState<'1D' | '5D' | '1M' | '3M' | 'YTD' | '5Y' | 'Max'>('1D');

  const timeRanges = {
    '1D': 1,
    '5D': 5,
    '1M': 22,
    '3M': 66,
    'YTD': 120,
    '5Y': 1260,
    'Max': 1825
  };

  const fetchPrices = async () => {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&outputsize=full&apikey=${apiKey}`
    );
    const data = await res.json();
    const series = data['Time Series (5min)'];
    if (!series) return;

    const points = Object.entries(series)
      .slice(0, timeRanges[range])
      .map(([time, value]: any) => ({
        time,
        price: parseFloat(value['4. close'])
      }))
      .reverse();

    setPrices(points.map((p) => p.price));
    setLabels(points.map((p) => new Date(p.time).toLocaleTimeString()));
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [symbol, range]);

  return (
    <div>
      <div className="flex gap-3 mb-2">
        {Object.keys(timeRanges).map((key) => (
          <button
            key={key}
            onClick={() => setRange(key as any)}
            className={`px-3 py-1 rounded text-sm ${
              range === key ? 'bg-yellow-400 text-black font-semibold' : 'bg-gray-700 text-white'
            }`}
          >
            {key}
          </button>
        ))}
      </div>
      <Line
        data={{
          labels,
          datasets: [
            {
              label: `${symbol} Price`,
              data: prices,
              borderColor: '#facc15',
              tension: 0.3
            }
          ]
        }}
        options={{
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: {
              ticks: {
                callback: (val) => `$${val}`
              }
            }
          }
        }}
        height={120}
      />
    </div>
  );
}





