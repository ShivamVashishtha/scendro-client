import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

type Props = {
  strike: number;
  premium: number;
  contracts: number;
  type: 'CALL' | 'PUT';
  action: 'BUY' | 'SELL';
  currentPrice?: number;
};

export default function OptionsProfitChart({
  strike,
  premium,
  contracts,
  type,
  action,
  currentPrice
}: Props) {
  const [zoomRange, setZoomRange] = useState(40);
  if (!strike || !premium || !contracts) return null;

  const quantity = contracts * 100;
  const step = 1;
  const minPrice = Math.max(0, strike - zoomRange);
  const maxPrice = strike + zoomRange;

  const x: number[] = [];
  const y: number[] = [];

  for (let price = minPrice; price <= maxPrice; price += step) {
    let profit = 0;

    if (type === 'CALL') {
      profit =
        action === 'BUY'
          ? Math.max(price - strike, 0) * quantity - premium * quantity
          : premium * quantity - Math.max(price - strike, 0) * quantity;
    } else {
      profit =
        action === 'BUY'
          ? Math.max(strike - price, 0) * quantity - premium * quantity
          : premium * quantity - Math.max(strike - price, 0) * quantity;
    }

    x.push(price);
    y.push(profit);
  }

  const breakeven = type === 'CALL' ? strike + premium : strike - premium;

  // 🧠 Correct theoretical max gain/loss (ignores zoom range)
  let theoreticalMaxGain = 0;
  let theoreticalMaxLoss = 0;

  if (action === 'BUY') {
    if (type === 'CALL') {
      theoreticalMaxGain = Infinity;
      theoreticalMaxLoss = premium * quantity;
    } else {
      theoreticalMaxGain = strike * quantity - premium * quantity;
      theoreticalMaxLoss = premium * quantity;
    }
  } else {
    if (type === 'CALL') {
      theoreticalMaxGain = premium * quantity;
      theoreticalMaxLoss = Infinity;
    } else {
      theoreticalMaxGain = premium * quantity;
      theoreticalMaxLoss = (strike * quantity) - premium * quantity;
    }
  }

  const displayMaxGain =
    theoreticalMaxGain === Infinity ? 'Unlimited' : `$${theoreticalMaxGain.toFixed(2)}`;
  const displayMaxLoss =
    theoreticalMaxLoss === Infinity ? 'Unlimited' : `$${theoreticalMaxLoss.toFixed(2)}`;

  const chartMax = Math.max(...y);
  const chartMin = Math.min(...y);
  const clampedMax = Math.ceil((chartMax + 100) / 100) * 100;
  const clampedMin = Math.floor((chartMin - 100) / 100) * 100;

  const data = {
    labels: x,
    datasets: [
      {
        label: 'Profit / Loss',
        data: y,
        fill: {
          target: { value: 0 },
          above: 'rgba(34,197,94,0.3)',
          below: 'rgba(239,68,68,0.3)',
        },
        borderColor: 'rgba(255,255,255,0.8)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { bottom: 30 } },
    interaction: { mode: 'index' as const, intersect: false },
    scales: {
      x: {
        min: minPrice,
        max: maxPrice,
        title: { display: true, text: 'Stock Price at Expiration', color: '#fff' },
        ticks: { color: '#ccc' },
        grid: { color: '#444' }
      },
      y: {
        min: clampedMin,
        max: clampedMax,
        title: { display: true, text: 'Profit / Loss ($)', color: '#fff' },
        ticks: { color: '#ccc' },
        grid: { color: '#444' }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (ctx: any) =>
            typeof ctx.raw === 'number' ? `P/L: $${ctx.raw.toFixed(2)}` : ''
        }
      },
      annotation: {
        annotations: {
          breakevenLine: {
            type: 'line',
            xMin: breakeven,
            xMax: breakeven,
            borderColor: 'orange',
            borderWidth: 2,
            label: {
              display: true,
              content: 'Breakeven',
              position: 'start',
              backgroundColor: 'rgba(255,165,0,0.2)',
              color: '#fff'
            }
          },
          ...(currentPrice
            ? {
                currentPriceLine: {
                  type: 'line',
                  xMin: currentPrice,
                  xMax: currentPrice,
                  borderColor: '#38bdf8',
                  borderWidth: 2,
                  borderDash: [6, 6],
                  label: {
                    display: true,
                    content: 'Current Price',
                    position: 'end',
                    backgroundColor: 'rgba(56,189,248,0.2)',
                    color: '#fff'
                  }
                }
              }
            : {})
        }
      }
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded mt-4 shadow mb-6 flex flex-col justify-between" style={{ height: '380px' }}>
      <h2 className="text-lg font-semibold text-white mb-2">📉 Profit/Loss Chart</h2>

      <label className="text-white text-sm mb-1">Zoom Range: ±{zoomRange}</label>
      <input
        type="range"
        min={10}
        max={100}
        step={5}
        value={zoomRange}
        onChange={(e) => setZoomRange(Number(e.target.value))}
        className="w-full mb-4"
      />

      <div className="flex-grow">
        <Line
          key={`${strike}-${premium}-${contracts}-${zoomRange}`}
          data={data}
          options={options as any}
        />
      </div>

      <p className="text-sm text-gray-300 mt-4 text-center">
        <span className="text-green-400">Max Gain:</span> {displayMaxGain} &nbsp;|&nbsp;
        <span className="text-red-400">Max Loss:</span> {displayMaxLoss} &nbsp;|&nbsp;
        <span className="text-yellow-300">Breakeven:</span> ${breakeven.toFixed(2)}
      </p>
    </div>
  );
}
