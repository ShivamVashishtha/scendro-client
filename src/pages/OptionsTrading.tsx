import React, { useState, useEffect } from 'react';
import TradeSummary from '../components/TradeSummary';
import OptionsChain from '../components/OptionsChain';
import OptionsProfitChart from '../components/OptionsProfitChart';
import { useTrading } from '../context/TradingContext';
import { useNavigate } from 'react-router-dom';
// 🔵 Supabase Imports
import { useAuth } from '../context/AuthContext';
import {
  saveOptionTrade,
  loadOptionTrades,
  deleteQueuedOptionTrade
} from '../supabaseDatabase';
import { supabase } from '../supabaseClient';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL!;

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
  const [optionInsight, setOptionInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [errorInsight, setErrorInsight] = useState<string | null>(null);

  const navigate = useNavigate();
  const { user } = useAuth();

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

  // 🔵 Load executed + queued option trades
  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      const { data } = await loadOptionTrades(user.id);
      if (data) {
        const executed = data.filter(t => t.status === 'executed');
        const queued = data.filter(t => t.status === 'queued');

        setOptionTrades(executed.map(d => ({
          type: d.option_symbol.includes('C') ? 'BUY_CALL' : 'BUY_PUT',
          symbol: d.option_symbol,
          contracts: d.quantity,
          price: d.price,
          realizedPL: 0,
        })));

        setQueuedOptionTrades(queued.map(d => ({
          type: d.option_symbol.includes('C') ? 'BUY_CALL' : 'BUY_PUT',
          symbol: d.option_symbol,
          contracts: d.quantity,
          price: d.price,
        })));
      }
    }

    fetchData();
  }, [user]);

  const handleSubmit = async () => {
    if (!symbol || !strike || !expiration || !premium || contracts <= 0) {
      alert('Incomplete trade details');
      return;
    }
  
    const price = actualPremium;
    const cost = price * contracts * 100;
  
    try {
      const res = await fetch(`${API_BASE_URL}/api/market-status`);
      const data = await res.json();
  
      if (!res.ok || typeof data.isMarketOpen !== 'boolean') {
        throw new Error('Invalid response from market status endpoint');
      }
  
      const isMarketOpen = data.isMarketOpen;
      const tradeType = `${isBuy ? 'BUY' : 'SELL'}_${optionType}` as 'BUY_CALL' | 'SELL_CALL' | 'BUY_PUT' | 'SELL_PUT';
      const trade = { type: tradeType, symbol, contracts, price, realizedPL: 0 };
  
      if (isMarketOpen && orderType.includes('MARKET')) {
        if (isBuy && cost > balance) {
          alert('Not enough balance to buy this option');
          return;
        }
        isBuy ? setBalance(b => b - cost) : setBalance(b => b + cost);
        setOptionTrades(prev => [...prev, trade]);
  
        // ✅ Save executed
        if (user) {
          await saveOptionTrade(user.id, symbol, strike, contracts, price, 'executed');
        }
  
        alert('✅ Trade executed!');
      } else {
        setQueuedOptionTrades(prev => [...prev, trade]);
  
        // ✅ Save queued
        if (user) {
          await saveOptionTrade(user.id, symbol, strike, contracts, price, 'queued');
        }
  
        alert('⏳ Market closed — trade queued.');
      }
    } catch (err) {
      console.error('Failed to check market status:', err);
      alert('⚠️ Could not determine if the market is open. Please try again.');
    }
  };
  
  const cancelOrder = async (index: number) => {
    const orderToDelete = queuedOptionTrades[index];
    setQueuedOptionTrades(prev => prev.filter((_, i) => i !== index));
  
    // ✅ Delete from Supabase
    if (user) {
      await deleteQueuedOptionTrade(user.id, orderToDelete.symbol, orderToDelete.contracts, orderToDelete.price);
    }
  };
  



  const generateOptionInsight = async () => {
    if (!symbol || strike <= 0 || !optionType || currentPrice === undefined) {
      setOptionInsight(null);
      return;
    }
  
    setLoadingInsight(true);
    setErrorInsight(null);
  
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai-option-insight?symbol=${symbol}&strike=${strike}&option_type=${optionType}&current_price=${currentPrice}`);
      if (!res.ok) throw new Error('Failed to fetch AI Insight');
      const data = await res.json();
      if (!data.error && data.ai_analysis) {
        setOptionInsight(data.ai_analysis);
      } else {
        setOptionInsight(null);
        setErrorInsight('No insight available for this option.');
      }
    } catch (err) {
      console.error('Error fetching option AI insight:', err);
      setOptionInsight(null);
      setErrorInsight('⚠️ Failed to generate AI Insight. Try again.');
    } finally {
      setLoadingInsight(false);
    }
  };
  

  useEffect(() => {
    if (!symbol.trim()) {
      setOptionInsight(null);
    }
  }, [symbol]);

  return (
    <div className="flex flex-col md:flex-row h-screen text-white bg-gray-900">
      {/* Left Panel */}
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
          onChange={(e) => {
            const newSymbol = e.target.value.toUpperCase();
            setSymbol(newSymbol);
            if (newSymbol.trim() === '') {
              setOptionInsight(null);
            }
          }}
          className="bg-gray-800 text-white p-2 rounded w-full mb-2"
          placeholder="Enter symbol (e.g. AAPL)"
        />

        {/* Order Type Buttons */}
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

      {/* Right Panel */}
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

        {/* 📊 AI Insight Button inside Side Panel */}
        {symbol && strike > 0 && (
          <div className="bg-gray-900 p-4 rounded mb-6 shadow mt-6">
  <h2 className="text-xl mb-4">🧠 AI Option Insight</h2>
  <button
    onClick={generateOptionInsight}
    disabled={loadingInsight}
    className="bg-blue-500 hover:bg-blue-600 text-black font-semibold px-4 py-2 rounded disabled:bg-gray-600 disabled:cursor-not-allowed"
  >
    {loadingInsight ? 'Generating...' : 'Generate AI Insight'}
  </button>

  {loadingInsight && (
    <div className="mt-4 text-gray-400">🔄 Fetching analysis...</div>
  )}

  {errorInsight && (
    <div className="mt-4 text-red-400">{errorInsight}</div>
  )}

  {optionInsight && (
    <div className="mt-4 p-4 bg-gray-700 rounded">
      <p className="text-gray-300 whitespace-pre-line">{optionInsight}</p>
    </div>
  )}
</div>

        )}

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

        {/* Queued Option Trades */}
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
