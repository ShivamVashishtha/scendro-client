import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';

type OptionData = {
  contractSymbol: string;
  strike: number;
  lastPrice: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
};

type OptionWithMeta = OptionData & {
  expirationDate: string;
  optionType: 'CALL' | 'PUT';
};

type Props = {
  data: OptionData[];
  type: 'call' | 'put';
  currentPrice: number;
  selectedDate: string;
  selectedStrike: number | null;
  onSelect: (option: OptionWithMeta) => void;
};

type PriceFlashMap = {
  [contractSymbol: string]: 'up' | 'down' | null;
};

export default function OptionsTable({
  data,
  type,
  currentPrice,
  selectedDate,
  selectedStrike,
  onSelect
}: Props) {
  const MAX = 100;
  const prevPricesRef = useRef<{ [contractSymbol: string]: number }>({});
  const [priceFlash, setPriceFlash] = useState<PriceFlashMap>({});

  useEffect(() => {
    const flashMap: PriceFlashMap = {};
    data.forEach(option => {
      const prev = prevPricesRef.current[option.contractSymbol];
      const curr = option.lastPrice;
      if (prev !== undefined) {
        if (curr > prev) flashMap[option.contractSymbol] = 'up';
        else if (curr < prev) flashMap[option.contractSymbol] = 'down';
        else flashMap[option.contractSymbol] = null;
      }
      prevPricesRef.current[option.contractSymbol] = curr;
    });

    setPriceFlash(flashMap);
    const timer = setTimeout(() => setPriceFlash({}), 600);
    return () => clearTimeout(timer);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full md:w-1/2 p-4 bg-gray-800 rounded-xl text-white">
        <h3 className="text-lg font-semibold capitalize">{type}s</h3>
        <p className="text-gray-400 mt-2">No option data available for this expiry.</p>
      </div>
    );
  }

  const closest = data.reduce((prev, curr) =>
    Math.abs(curr.strike - currentPrice) < Math.abs(prev.strike - currentPrice) ? curr : prev
  );

  const above = data
    .filter(opt => opt.strike > closest.strike)
    .sort((a, b) => a.strike - b.strike)
    .slice(0, MAX);

  const below = data
    .filter(opt => opt.strike < closest.strike)
    .sort((a, b) => a.strike - b.strike)
    .slice(-MAX);

  const combined: OptionData[] = [...below, closest, ...above];

  return (
    <div className="w-full md:w-1/2 overflow-auto">
      <div className="bg-gray-800 rounded-xl shadow p-4 h-[550px] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-2 capitalize">{type}s</h3>
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-800 z-10">
            <tr className="text-gray-300 border-b border-gray-600">
              <th>Strike</th>
              <th>Bid</th>
              <th>Ask</th>
              <th>Last</th>
              <th>IV</th>
              <th>Volume</th>
            </tr>
          </thead>
          <tbody>
            {combined.map((option) => {
              const isSelected = option.strike === selectedStrike;
              const flash = priceFlash[option.contractSymbol];

              return (
                <tr
                  key={option.contractSymbol}
                  className={`cursor-pointer hover:bg-gray-700 ${
                    isSelected ? 'bg-blue-800 text-white' : ''
                  }`}
                  onClick={() =>
                    onSelect({
                      ...option,
                      expirationDate: selectedDate,
                      optionType: type === 'call' ? 'CALL' : 'PUT'
                    })
                  }
                >
                  <td className="text-center">{option.strike}</td>
                  <td>{option.bid}</td>
                  <td>{option.ask}</td>
                  <td
                    className={classNames({
                      'text-green-400': flash === 'up',
                      'text-red-400': flash === 'down',
                      'transition duration-300': !!flash
                    })}
                  >
                    {option.lastPrice}
                  </td>
                  <td>{(option.impliedVolatility * 100).toFixed(2)}%</td>
                  <td>{option.volume}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}




