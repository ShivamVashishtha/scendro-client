import React, { useState, useEffect } from 'react';
import StockChart from '../components/StockChart';
import { useNavigate } from 'react-router-dom';
import { useTrading } from '../context/TradingContext';
import type { QueuedOptionTrade, OptionTrade } from '../context/TradingContext';


type Holding = {
  symbol: string;
  quantity: number;
  avgPrice: number;
};

type Trade = {
  type: 'BUY' | 'SELL';
  symbol: string;
  quantity: number;
  price: number;
  realizedPL: number;
};

type QueuedTrade = {
  type: 'BUY' | 'SELL';
  symbol: string;
  quantity: number;
  price: number;
};

export default function PaperTrading() {
  const { isSetupComplete, setIsSetupComplete } = useTrading();
const [startingBalance, setStartingBalance] = useState(10000);
const [symbol, setSymbol] = useState('');
const [quantity, setQuantity] = useState(0);
const [limitPrice, setLimitPrice] = useState(0);
const [orderType, setOrderType] = useState('MARKET_BUY');
const [marketPrice, setMarketPrice] = useState(0);

const [openPLShares, setOpenPLShares] = useState(0);
const [openPLOptions, setOpenPLOptions] = useState(0);
const [realizedPLShares, setRealizedPLShares] = useState(0);
const [realizedPLOptions, setRealizedPLOptions] = useState(0);
const [displayedPLType, setDisplayedPLType] = useState<'total' | 'shares' | 'options'>('total');
const [pricesBySymbol, setPricesBySymbol] = useState<{ [key: string]: number }>({});


const { queuedOrders, setQueuedOrders } = useTrading();


  const navigate = useNavigate();

  // ✅ GLOBAL STATE from TradingContext
  const {
    balance,
    setBalance,
    holdings,
    setHoldings,
    trades,
    setTrades,
    optionTrades,
    setOptionTrades,
    queuedOptionTrades,
    setQueuedOptionTrades,
  } = useTrading();

  const alphaKey = process.env.REACT_APP_ALPHA_KEY!;

  const isMarketOpen = () => {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return (
      day >= 1 &&
      day <= 5 &&
      (hours > 9 || (hours === 9 && minutes >= 30)) &&
      (hours < 16 || (hours === 16 && minutes === 0))
    );
  };

  useEffect(() => {
    const fetchPrices = async () => {
      const prices: { [key: string]: number } = {};
      for (const h of holdings) {
        try {
          const res = await fetch(`http://localhost:5000/api/price?symbol=${h.symbol}`);
          const data = await res.json();
          prices[h.symbol] = data.price;
        } catch (err) {
          console.error(`Failed to fetch price for ${h.symbol}`);
        }
      }
      setPricesBySymbol(prices);
    };
  
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [holdings]);
  

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/price?symbol=${symbol}`);
        const data = await res.json();
        if (data.price) setMarketPrice(data.price);
      } catch (err) {
        console.error("Error fetching price:", err);
      }
    };
  
    fetchPrice(); // initial
    const interval = setInterval(fetchPrice, 15000); // every 15s
  
    return () => clearInterval(interval);
  }, [symbol]);
  

  useEffect(() => {
    let sharePL = 0;
    holdings.forEach((h) => {
      sharePL += (marketPrice - h.avgPrice) * h.quantity;
    });
  
    let optionPL = 0;
    optionTrades.forEach((t) => {
      const notionalNow = marketPrice * 100 * t.contracts;
      const cost = t.price * 100 * t.contracts;
  
      if (t.type.startsWith('BUY')) {
        optionPL += notionalNow - cost;  // Profit if price went up
      } else {
        optionPL += cost - notionalNow;  // Profit if price went down
      }
    });
  
    setOpenPLShares(sharePL);
    setOpenPLOptions(optionPL);
  }, [marketPrice, holdings, optionTrades]);
  

  useEffect(() => {
    if (!isMarketOpen() || queuedOrders.length === 0) return;
    queuedOrders.forEach((order) => {
      if (order.type === 'BUY') handleBuy(order.symbol, order.quantity, true, order.price);
      else handleSell(order.symbol, order.quantity, true, order.price);
    });
    setQueuedOrders([]);
  }, [marketPrice]);

  const handleBuy = (
    customSymbol: string = symbol,
    customQty: number = quantity,
    fromQueue = false,
    customPrice: number = marketPrice
  ) => {
    const price = customPrice;
    if (!customSymbol || customQty <= 0 || price <= 0) return;
    const cost = customQty * price;
    if (cost > balance) {
      alert('Not enough balance!');
      return;
    }

    const existing = holdings.find((h) => h.symbol === customSymbol);
    let updatedHoldings;

    if (existing) {
      const totalQty = existing.quantity + customQty;
      const newAvg =
        (existing.avgPrice * existing.quantity + price * customQty) / totalQty;
      updatedHoldings = holdings.map((h) =>
        h.symbol === customSymbol ? { ...h, quantity: totalQty, avgPrice: newAvg } : h
      );
    } else {
      updatedHoldings = [...holdings, { symbol: customSymbol, quantity: customQty, avgPrice: price }];
    }

    setHoldings(updatedHoldings);
    setBalance((b) => b - cost);
    setTrades((t) => [...t, { type: 'BUY', symbol: customSymbol, quantity: customQty, price, realizedPL: 0 }]);
    if (!fromQueue) setQuantity(0);
  };

  const handleSell = (
    customSymbol: string = symbol,
    customQty: number = quantity,
    fromQueue = false,
    customPrice: number = marketPrice
  ) => {
    const price = customPrice;
    if (!customSymbol || customQty <= 0 || price <= 0) return;
    const existing = holdings.find((h) => h.symbol === customSymbol);
    if (!existing || existing.quantity < customQty) {
      alert('Not enough shares!');
      return;
    }

    const proceeds = customQty * price;
    const pl = (price - existing.avgPrice) * customQty;

    const updatedHoldings =
      existing.quantity === customQty
        ? holdings.filter((h) => h.symbol !== customSymbol)
        : holdings.map((h) =>
            h.symbol === customSymbol ? { ...h, quantity: h.quantity - customQty } : h
          );

    setHoldings(updatedHoldings);
    setBalance((b) => b + proceeds);
    setRealizedPLShares((p) => p + pl);

    setTrades((t) => [...t, { type: 'SELL', symbol: customSymbol, quantity: customQty, price, realizedPL: pl }]);
    if (!fromQueue) setQuantity(0);
  };

  const handleSubmit = () => {
    const upperType = orderType.toUpperCase();
    const isLimit = upperType.includes('LIMIT');
    const isBuy = upperType.includes('BUY');
    const price = isLimit ? limitPrice : marketPrice;
  
    if (price <= 0 || quantity <= 0) {
      alert('Invalid price or quantity.');
      return;
    }
  
    if (!symbol) {
      alert('Please enter a symbol.');
      return;
    }
  
    const existing = holdings.find((h) => h.symbol === symbol);
  
    if (!isBuy && (!existing || existing.quantity < quantity)) {
      alert('Not enough shares to sell!');
      return;
    }
  
    const orderCost = price * quantity;
  
    const totalQueuedBuyCost = queuedOrders
      .filter((o) => o.type === 'BUY')
      .reduce((sum, o) => sum + o.price * o.quantity, 0);
  
    const availableBalance = balance - totalQueuedBuyCost;
  
    if (isBuy && isLimit && orderCost > availableBalance) {
      alert(`Not enough buying power to queue this order. You need $${orderCost.toFixed(2)}, but only have $${availableBalance.toFixed(2)} available.`);
      return;
    }
  
    if (isBuy && !isLimit && orderCost > availableBalance) {
      alert(`Not enough buying power to execute this order. You need $${orderCost.toFixed(2)}, but only have $${availableBalance.toFixed(2)} available.`);
      return;
    }
  
    if (isMarketOpen() && !isLimit) {
      isBuy ? handleBuy(symbol, quantity) : handleSell(symbol, quantity);
    } else {
      alert('Order has been queued.');
      setQueuedOrders((q) => [
        ...q,
        {
          type: isBuy ? 'BUY' : 'SELL',
          symbol,
          quantity,
          price,
        },
      ]);
      setQuantity(0);
    }
  };

  useEffect(() => {
    if (!isMarketOpen() || queuedOptionTrades.length === 0) return;
  
    const executed: OptionTrade[] = [];
  
    queuedOptionTrades.forEach((trade) => {
      const { type, symbol, contracts, price } = trade;
  
      if (type.startsWith('BUY')) {
        const cost = price * contracts * 100;
        if (balance >= cost) {
          setBalance((b) => b - cost);
          executed.push({ ...trade, realizedPL: 0 });
        }
      } else {
        // For sells, add the premium as credit
        const credit = price * contracts * 100;
        setBalance((b) => b + credit);
        executed.push({ ...trade, realizedPL: 0 });
      }
    });
  
    setOptionTrades((prev) => [...prev, ...executed]);
    setQueuedOptionTrades([]); // clear after execution
  }, [marketPrice]);
  
  
  

  // Setup screen for starting balance
  if (!isSetupComplete) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <h1 className="text-3xl font-bold mb-6">⚙️ Setup Your Simulation</h1>
        <div className="bg-gray-800 p-6 rounded shadow w-full max-w-md mx-auto">
          <label className="block mb-2 text-sm">Starting Balance ($):</label>
          <input
            type="number"
            value={startingBalance}
            onChange={(e) => setStartingBalance(parseFloat(e.target.value))}
            className="bg-gray-700 text-white px-3 py-2 rounded w-full mb-4"
          />
          <button
            onClick={() => {
              setBalance(startingBalance);
              setIsSetupComplete(true);
            }}
            className="bg-green-500 px-4 py-2 rounded text-black font-semibold hover:bg-green-600 w-full"
          >
            Start Simulation
          </button>
        </div>
      </div>
    );
  }

  const cancelQueuedOrder = (index: number) => {
    setQueuedOrders((prev) => prev.filter((_, i) => i !== index));
  };
  
  const cancelQueuedOptionTrade = (index: number) => {
    setQueuedOptionTrades((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">📊 Paper Trading Simulator</h1>

      {/* Balance Display */}
      <div className="bg-gray-800 p-4 rounded mb-6 shadow">
        <p className="text-lg">💰 Balance: ${balance.toFixed(2)}</p>
        <p className="text-sm text-gray-300">
          Open P/L:{' '}
          <span className={(openPLShares + openPLOptions) >= 0 ? 'text-green-400' : 'text-red-400'}>
          ${(openPLShares + openPLOptions).toFixed(2)}
          </span>
        </p>
        <div className="text-sm text-gray-300 relative">
  <span>
    Realized P/L:{' '}
    <span
      className={(() => {
        const val =
          displayedPLType === 'shares'
            ? realizedPLShares
            : displayedPLType === 'options'
            ? realizedPLOptions
            : realizedPLShares + realizedPLOptions;
        return val >= 0 ? 'text-green-400' : 'text-red-400';
      })()}
    >
      $
      {(
        displayedPLType === 'shares'
          ? realizedPLShares
          : displayedPLType === 'options'
          ? realizedPLOptions
          : realizedPLShares + realizedPLOptions
      ).toFixed(2)}
    </span>
    <button
      className="ml-2 px-2 py-0.5 bg-gray-700 text-white text-xs rounded"
      onClick={() =>
        setDisplayedPLType((prev) =>
          prev === 'total' ? 'shares' : prev === 'shares' ? 'options' : 'total'
        )
      }
    >
      ▼
    </button>
  </span>
  <div className="text-xs mt-1 text-gray-400">
    {displayedPLType === 'total'
      ? 'Showing Total Realized P/L'
      : displayedPLType === 'shares'
      ? 'Showing Realized P/L from Shares'
      : 'Showing Realized P/L from Options'}
  </div>
</div>

        <p className="text-sm text-gray-300">
          Buying Power (after queued orders):{' '}
          <span className="text-yellow-300">
            ${(
              balance -
              queuedOrders.reduce((sum, o) => sum + o.quantity * o.price * (o.type === 'SELL' ? 0 : 1), 0) -
    queuedOptionTrades.reduce((sum, t) =>
      t.type.startsWith('BUY') ? sum + t.contracts * t.price * 100 : sum, 0)
            ).toFixed(2)}
          </span>
        </p>
      </div>

      {/* Order Panel */}
      <div className="bg-gray-800 p-4 rounded mb-6 shadow">
        <h2 className="text-xl mb-4">🛒 Place Order</h2>
        <div className="flex gap-4 items-center mb-4 flex-wrap">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="Symbol"
            className="bg-gray-700 text-white px-3 py-1 rounded w-32"
          />
          <input
            type="number"
            placeholder="Qty"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            className="bg-gray-700 text-white px-3 py-1 rounded w-24"
          />
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            className="bg-gray-700 text-white px-3 py-1 rounded min-w-[140px]"
          >
            <option value="MARKET_BUY">Market Buy</option>
            <option value="MARKET_SELL">Market Sell</option>
            <option value="LIMIT_BUY">Limit Buy</option>
            <option value="LIMIT_SELL">Limit Sell</option>
          </select>
          {orderType.includes('LIMIT') && (
            <input
              type="number"
              placeholder="Limit Price"
              value={limitPrice}
              onChange={(e) => setLimitPrice(parseFloat(e.target.value))}
              className="bg-gray-700 text-white px-3 py-1 rounded w-28"
            />
          )}
          <button
            onClick={handleSubmit}
            className="bg-blue-500 px-4 py-1 rounded text-black font-semibold hover:bg-blue-600"
          >
            Submit
          </button>

          <button
            onClick={() => navigate('/options')}
            className="bg-purple-600 px-4 py-1 rounded text-white font-semibold hover:bg-purple-700"
          >
            📉 Trade Options
          </button>
        </div>
        {marketPrice > 0 && symbol && (
          <p className="text-sm text-gray-400">
            Current Price of {symbol}: ${marketPrice.toFixed(2)}
          </p>
        )}
      </div>

      {/* Chart */}
      <div className="bg-gray-800 p-4 rounded mb-6 shadow">
        {symbol && marketPrice > 0 && (
          <StockChart symbol={symbol} apiKey={alphaKey} />
        )}
      </div>

      {/* Holdings */}
      <div className="bg-gray-800 p-4 rounded mb-6 shadow">
        <h2 className="text-xl mb-4">📦 Holdings</h2>
        {holdings.length === 0 ? (
          <p className="text-gray-400">No holdings yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Qty</th>
                <th>Avg Price</th>
                <th>P/L</th>
              </tr>
            </thead>
            <tbody>
            {holdings.map((h, i) => {
  const current = pricesBySymbol[h.symbol] || 0;
  const pl = (current - h.avgPrice) * h.quantity;
  return (
    <tr key={i}>
      <td>{h.symbol}</td>
      <td>{h.quantity}</td>
      <td>${h.avgPrice.toFixed(2)}</td>
      <td>${current.toFixed(2)}</td>
      <td className={pl >= 0 ? 'text-green-400' : 'text-red-400'}>
        {pl >= 0 ? `+${pl.toFixed(2)}` : pl.toFixed(2)}
      </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Trade Log */}
      <div className="bg-gray-800 p-4 rounded shadow">
        <h2 className="text-xl mb-4">📜 Trade Log</h2>
        {trades.length === 0 ? (
          <p className="text-gray-400">No trades yet.</p>
        ) : (
          <ul className="text-sm list-disc pl-6">
            {trades.map((t, i) => (
              <li key={i}>
                {t.type} {t.quantity} {t.symbol} @ ${t.price.toFixed(2)}{' '}
                {t.type === 'SELL' && `(Realized P/L: ${t.realizedPL.toFixed(2)})`}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Queued Orders */}
<div className="bg-gray-800 p-4 rounded shadow mt-6">
  <h2 className="text-xl mb-4">🕒 Queued Orders</h2>
  {queuedOrders.length === 0 && queuedOptionTrades.length === 0 ? (
    <p className="text-gray-400">No queued orders.</p>
  ) : (
    <ul className="text-sm list-disc pl-6 space-y-2">
      {queuedOrders.map((order, i) => (
        <li key={`share-${i}`} className="flex justify-between items-center">
          <span>
            {order.type} {order.quantity} {order.symbol} @ ${order.price.toFixed(2)} (Queued Share)
          </span>
          <button
            onClick={() =>
              setQueuedOrders((q) => q.filter((_, idx) => idx !== i))
            }
            className="ml-4 px-2 py-0.5 bg-red-600 text-white text-xs rounded hover:bg-red-700"
          >
            Cancel
          </button>
        </li>
      ))}
      {queuedOptionTrades.map((order, i) => (
        <li key={`option-${i}`} className="flex justify-between items-center">
          <span>
            {order.type} {order.contracts} {order.symbol} @ ${order.price.toFixed(2)} (Queued Option)
          </span>
          <button
            onClick={() =>
              setQueuedOptionTrades((q) => q.filter((_, idx) => idx !== i))
            }
            className="ml-4 px-2 py-0.5 bg-red-600 text-white text-xs rounded hover:bg-red-700"
          >
            Cancel
          </button>
        </li>
      ))}
    </ul>
  )}
</div>

    </div>
  );
}







