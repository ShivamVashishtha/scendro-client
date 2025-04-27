import React, { useState } from 'react';
import TradeSummary from '../components/TradeSummary';
import OptionsChain from '../components/OptionsChain';
import OptionsProfitChart from '../components/OptionsProfitChart';
import { useTrading } from '../context/TradingContext';
import { useNavigate } from 'react-router-dom';

export default function OptionsTrading() {
  const [symbol, setSymbol] = useState('');
  const [strike, setStrike] = useState(0);
  const [premium, setPremium] = useState(0);
  const [expiration, setExpiration] = useState('');
  const [contracts, setContracts] = useState(1);
  const [orderType, setOrderType] = useState<'MARKET_BUY' | 'MARKET_SELL' | 'LIMIT_BUY' | 'LIMIT_SELL'>('MARKET_BUY');
  const [limitPrice, setLimitPrice] = useState(0);
  const [optionType, setOptionType] = useState<'CALL' | 'PUT'>('CALL');
  const [currentPrice, setCurrentPrice] = useState<number | undefined>();

  const navigate = useNavigate();

  const {
    balance,
    setBalance,
    holdings,
    optionTrades,
    setOptionTrades,
    queuedOptionTrades,
    setQueuedOptionTrades,
  } = useTrading();

  const isBuy = orderType.includes('BUY');
  const actualPremium = orderType.includes('LIMIT') ? limitPrice : premium;
  const breakeven = optionType === 'CALL'
    ? strike + actualPremium
    : strike - actualPremium;

  const handleSubmit = async () => {
    if (!symbol || !strike || !expiration || !premium || contracts <= 0) {
      alert('Incomplete trade details');
      return;
    }

    const price = actualPremium;
    const cost = price * contracts * 100;

    try {
      const res = await fetch('http://localhost:5000/api/market-status');
      const data = await res.json();

      if (!res.ok || typeof data.isMarketOpen !== 'boolean') {
        throw new Error('Invalid response from market status endpoint');
      }

      const isMarketOpen = data.isMarketOpen;
      const action = isBuy ? 'BUY' : 'SELL';
      const type = optionType;

      if (action === 'SELL' && type === 'CALL') {
        const holding = holdings.find((h) => h.symbol === symbol);
        if (!holding || holding.quantity < contracts * 100) {
          alert('Not enough shares for a Covered Call');
          return;
        }
      }

      if (action === 'SELL' && type === 'PUT') {
        const requiredCash = strike * 100 * contracts;
        if (balance < requiredCash) {
          alert('Not enough buying power for Cash-Secured Put');
          return;
        }
      }

      const tradeType = `${action}_${type}` as 'BUY_CALL' | 'SELL_CALL' | 'BUY_PUT' | 'SELL_PUT';
      const trade = { type: tradeType, symbol, contracts, price, realizedPL: 0 };

      if (isMarketOpen && orderType.includes('MARKET')) {
        if (isBuy && cost > balance) {
          alert('Not enough balance to buy this option');
          return;
        }
        if (isBuy) setBalance((b) => b - cost);
        else setBalance((b) => b + cost);
        setOptionTrades([...optionTrades, trade]);
        alert('✅ Trade executed!');
      } else {
        setQueuedOptionTrades((q) => [...q, trade]);
        alert('⏳ Market closed — trade queued.');
      }
    } catch (err) {
      console.error('Failed to check market status:', err);
      alert('⚠️ Could not determine if the market is open. Please try again.');
    }
  };

  const cancelOrder = (index: number) => {
    setQueuedOptionTrades((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col md:flex-row h-screen text-white bg-gray-900">
      <div className="w-full md:w-2/3 p-6 overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">📈 Options Chain</h1>
          <button
            onClick={() => navigate('/paper-trading')}
            className="bg-gray-700 text-white px-4 py-1 rounded hover:bg-gray-600"
          >
            ← Back to Paper Trading
          </button>
        </div>

        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          className="bg-gray-800 text-white p-2 rounded w-full mb-2"
          placeholder="Enter symbol (e.g. AAPL)"
        />

        {/* Order Type Buttons moved here under search bar */}
        <div className="mb-4 flex flex-wrap gap-2 justify-start">
          {['MARKET_BUY', 'MARKET_SELL', 'LIMIT_BUY', 'LIMIT_SELL'].map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type as any)}
              className={`px-3 py-1 rounded text-sm font-semibold ${
                orderType === type ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>

        <OptionsChain
          symbol={symbol}
          onSelect={(option) => {
            setStrike(option.strike);
            setPremium(option.lastPrice);
            setExpiration(option.expirationDate);
            setOptionType(option.optionType);
          }}
          setCurrentPrice={setCurrentPrice}
        />
      </div>

      <div className="w-full md:w-1/3 p-6 bg-gray-800 border-l border-gray-700 overflow-auto">
        <TradeSummary
          symbol={symbol}
          action={isBuy ? 'BUY' : 'SELL'}
          type={optionType}
          contracts={contracts}
          premium={actualPremium}
          strike={strike}
          expiration={expiration}
          breakeven={breakeven}
        />

        <div className="mt-4">
          <label>Contracts:</label>
          <input
            type="number"
            value={contracts}
            min={1}
            onChange={(e) => setContracts(Number(e.target.value))}
            className="w-full p-2 rounded bg-gray-700 text-white mt-2"
          />
        </div>

        <OptionsProfitChart
          strike={strike}
          premium={actualPremium}
          contracts={contracts}
          type={optionType}
          action={isBuy ? 'BUY' : 'SELL'}
          currentPrice={currentPrice}
        />

        {orderType.includes('LIMIT') && (
          <div className="mt-4">
            <label>Limit Price:</label>
            <input
              type="number"
              value={limitPrice}
              min={0}
              onChange={(e) => setLimitPrice(parseFloat(e.target.value))}
              className="w-full p-2 rounded bg-gray-700 text-white mt-2"
              placeholder="Enter your limit price"
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded"
        >
          Submit Trade
        </button>

        {queuedOptionTrades.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold">Queued Orders</h3>
            <ul className="text-sm mt-2">
              {queuedOptionTrades.map((trade, i) => (
                <li key={i} className="flex justify-between items-center border-b border-gray-600 py-1">
                  <span>
                    {trade.type} {trade.contracts} {trade.symbol} @ ${trade.price.toFixed(2)}
                  </span>
                  <button
                    className="bg-red-500 text-white px-2 py-0.5 rounded text-xs"
                    onClick={() => cancelOrder(i)}
                  >
                    Cancel
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
