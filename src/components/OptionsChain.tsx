import React, { useState, useEffect } from 'react';
import OptionsTable from './OptionsTable';
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
  symbol: string;
  onSelect: (option: OptionWithMeta) => void;
  setCurrentPrice?: React.Dispatch<React.SetStateAction<number | undefined>>;
};

export default function OptionsChain({ symbol, onSelect, setCurrentPrice }: Props) {
  const [expirations, setExpirations] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [calls, setCalls] = useState<OptionData[]>([]);
  const [puts, setPuts] = useState<OptionData[]>([]);
  const [selectedStrike, setSelectedStrike] = useState<number | null>(null);
  const [localPrice, setLocalPrice] = useState<number | null>(null);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (!symbol) return;

    fetch(`http://localhost:5000/api/options/dates?symbol=${symbol}`)
      .then(res => res.json())
      .then(data => setExpirations(data.expirations || []))
      .catch(err => {
        console.error("Error fetching expiration dates:", err);
        alert("⚠️ Could not load expiration dates.");
      });

    fetchPriceAndOptions(); // Initial
  }, [symbol]);

  useEffect(() => {
    if (!selectedDate) return;
    fetchOptionsChain();
  }, [selectedDate]);

  const fetchPrice = () => {
    fetch(`http://localhost:5000/api/price?symbol=${symbol}`)
      .then(async (res) => {
        const json = await res.json();
        if (!json || typeof json.price !== 'number') {
          throw new Error("Invalid price data");
        }

        setPreviousPrice(localPrice);
        setLocalPrice(json.price);

        // ✅ Forward to parent
        if (typeof setCurrentPrice === 'function') {
          setCurrentPrice(json.price);
        }

        if (localPrice !== null) {
          if (json.price > localPrice) setPriceFlash('up');
          else if (json.price < localPrice) setPriceFlash('down');
          else setPriceFlash(null);

          setTimeout(() => setPriceFlash(null), 600);
        }
      })
      .catch((err) => {
        console.error("Error fetching current price:", err);
      });
  };

  const fetchOptionsChain = () => {
    if (!selectedDate) return;

    fetch(`http://localhost:5000/api/options/chain?symbol=${symbol}&expiry=${selectedDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data || !Array.isArray(data.calls) || !Array.isArray(data.puts)) {
          throw new Error("Empty or malformed data");
        }
        setCalls(data.calls);
        setPuts(data.puts);
      })
      .catch((err) => {
        console.error("Error loading options chain:", err);
      });
  };

  const fetchPriceAndOptions = () => {
    fetchPrice();
    fetchOptionsChain();
  };

  useEffect(() => {
    if (!selectedDate) return;
    const interval = setInterval(() => {
      fetchPriceAndOptions();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center text-white mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">{symbol.toUpperCase()}</h2>
          {localPrice !== null && (
            <span
              className={classNames(
                'font-semibold transition duration-300',
                {
                  'text-green-400': priceFlash === 'up',
                  'text-red-400': priceFlash === 'down',
                  'text-white': !priceFlash,
                }
              )}
            >
              Current Price: ${localPrice}
            </span>
          )}
        </div>
        <button
          onClick={fetchPriceAndOptions}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
        >
          🔄 Refresh Now
        </button>
      </div>

      <div className="mb-4">
        <label className="block mb-1 text-white">Select Expiration Date</label>
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-gray-700 text-white p-2 rounded"
        >
          <option value="">Select Expiration</option>
          {expirations.map(date => (
            <option key={date} value={date}>{date}</option>
          ))}
        </select>
      </div>

      {selectedDate && localPrice !== null && (
        <div className="flex flex-col md:flex-row gap-6">
          <OptionsTable
            data={calls}
            type="call"
            currentPrice={localPrice}
            selectedDate={selectedDate}
            selectedStrike={selectedStrike}
            onSelect={onSelect}
          />
          <OptionsTable
            data={puts}
            type="put"
            currentPrice={localPrice}
            selectedDate={selectedDate}
            selectedStrike={selectedStrike}
            onSelect={onSelect}
          />
        </div>
      )}
    </div>
  );
}








