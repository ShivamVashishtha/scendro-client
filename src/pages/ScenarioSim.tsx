import { useState, useRef, useMemo, useEffect } from 'react';
import { FaChartPie, FaSyncAlt, FaDownload, FaPlus, FaTrashAlt, FaInfoCircle, FaMoon, FaBolt, FaRedoAlt, FaSun } from 'react-icons/fa';
import { Line, Pie } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'chartjs-plugin-annotation';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement);

// Utility functions for Phase 2 features
const getCorrelations = (stocks: StockResult[]) => {
  try {
    const correlations: { source: string, target: string, value: number }[] = [];
    for (let i = 0; i < stocks.length; i++) {
      for (let j = i + 1; j < stocks.length; j++) {
        const stockA = stocks[i];
        const stockB = stocks[j];
        const meanA = stockA.history.reduce((a: number, b: number) => a + b, 0) / stockA.history.length;
        const meanB = stockB.history.reduce((a: number, b: number) => a + b, 0) / stockB.history.length;
        let numerator = 0, denomA = 0, denomB = 0;
        for (let k = 0; k < stockA.history.length; k++) {
          const diffA = stockA.history[k] - meanA;
          const diffB = stockB.history[k] - meanB;
          numerator += diffA * diffB;
          denomA += diffA ** 2;
          denomB += diffB ** 2;
        }
        const corr = numerator / Math.sqrt(denomA * denomB);
        correlations.push({ source: stockA.symbol, target: stockB.symbol, value: corr });
      }
    }
    return correlations;
  } catch (error) {
    console.error("Error computing correlations:", error);
    return [];
  }
};




function simulateWhatIf(stock: StockResult, selectedDateIndex: number) {
  const actual = stock.history.map((price, idx) => ({ x: idx, y: price * stock.quantity }));
  const initialPrice = stock.history[selectedDateIndex];
  const whatIf = stock.history.map((price, idx) => ({
    x: idx,
    y: idx >= selectedDateIndex
      ? initialPrice !== 0
        ? initialPrice * stock.quantity * (price / initialPrice)
        : 0
      : null
  }));
  return { actual, whatIf };
}


const computeTimeWeightedROI = (stock: StockResult, daysHeld = 90): string => {
  if (daysHeld <= 0 || !stock.history.length) return '0.00';
  const startValue = stock.history[0] * stock.quantity;
  const endValue = stock.lastPrice * stock.quantity;
  const annualizedReturn = ((endValue / startValue) ** (365 / daysHeld)) - 1;
  return (annualizedReturn * 100).toFixed(2);
};

// 🧠 Smart Entry Optimizer Utility
const calculateSmartEntry = (history: number[], entryIndex: number) => {

  if (!history.length || entryIndex >= history.length) return {
    bestIndex: 0,
    bestGain: 0,
    actualGain: 0,
    delta: 0,
    beatPercent: 0
  };

  let bestIndex = 0;
  let bestGain = -Infinity;
  const finalPrice = history[history.length - 1];
  const actualEntryPrice = history[entryIndex];

  for (let i = 0; i < history.length - 1; i++) {
    const gain = ((finalPrice - history[i]) / history[i]) * 100;
    if (gain > bestGain) {
      bestGain = gain;
      bestIndex = i;
    }
  }

  const actualGain = ((finalPrice - actualEntryPrice) / actualEntryPrice) * 100;
  const delta = bestGain - actualGain;
  const beatPercent = (history.filter((_, i) => i !== entryIndex && i < history.length - 1).filter(i => ((finalPrice - history[i]) / history[i]) * 100 < actualGain).length / (history.length - 2)) * 100;

  return {
    bestIndex,
    bestGain,
    actualGain,
    delta,
    beatPercent
  };
};

interface Stock {
  symbol: string;
  totalValue: number;
  sector: string;
}

interface Suggestion {
  symbol: string;
  current: number;
  suggested: number;
  adjustment: number;
  advisory: string;
}


const getAutoRebalanceSuggestion = (stocks: StockResult[], riskTolerance = 0.5): Suggestion[] => {
  const totalValue = stocks.reduce((sum, s) => sum + s.totalValue, 0);
  const sectorMap: Record<string, StockResult[]> = {};

  for (const stock of stocks) {
    if (!sectorMap[stock.sector]) sectorMap[stock.sector] = [];
    sectorMap[stock.sector].push(stock);
  }

  const suggestions: Suggestion[] = [];
  for (const sector in sectorMap) {
    const sectorStocks = sectorMap[sector];
    const sectorValue = sectorStocks.reduce((sum, s) => sum + s.totalValue, 0);
    const idealSectorPercent = 1 / Object.keys(sectorMap).length;
    const idealSectorValue = totalValue * idealSectorPercent;
    const adjustmentFactor = sectorValue - idealSectorValue;

    for (const stock of sectorStocks) {
      const riskModifier = stock.risk === 'High' ? 1.5 : stock.risk === 'Moderate' ? 1.0 : 0.8;
      const weight = stock.totalValue / sectorValue;
      const adjustment = -adjustmentFactor * weight * riskTolerance * riskModifier;
      const suggested = stock.totalValue + adjustment;
      let advisory = '';
      if (stock.risk === 'High') advisory = '⚠️ High-risk. Consider reducing exposure.';
      else if (stock.risk === 'Low') advisory = '🛡️ Low-risk. Consider increasing exposure.';
      suggestions.push({
        symbol: stock.symbol,
        current: stock.totalValue,
        suggested,
        adjustment,
        advisory
      });
    }
  }
  return suggestions;
};


const fetchSentiment = async (symbol: string): Promise<string[]> => {
  const gnewsKey = process.env.REACT_APP_GNEWS_KEY!;
  const fromDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const gnewsRes = await fetch(`https://gnews.io/api/v4/search?q=${symbol}&from=${fromDate}&lang=en&token=${process.env.REACT_APP_GNEWS_API}`);
  const gnewsData = await gnewsRes.json();
  const gnewsTitles = gnewsData.articles?.map((a: any) => a.title) || [];

  const newsapiRes = await fetch(`https://newsapi.org/v2/everything?q=${symbol}&from=${fromDate}&sortBy=publishedAt&pageSize=5&language=en&apiKey=${process.env.REACT_APP_NEWS_KEY}`);
  const newsapiData = await newsapiRes.json();
  const newsapiTitles = newsapiData.articles?.map((a: any) => a.title) || [];

  return [...gnewsTitles, ...newsapiTitles];
};


type StockResult = {
  symbol: string;
  quantity: number;
  history: number[];
  change30: number;
  change90: number;
  gain90: number;
  risk: string;
  sector: string;
  score: number;
  lastPrice: number;
  totalValue: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  name: string;
  extended: number;
  overview?: {
    DividendYield?: string;
    EPS?: string;
  };
};

type AnalysisResults = {
  results: StockResult[];
  totalGain: number;
  totalPortfolioValue: number;
  portfolioTrend: number[];
  sectorAllocations: Record<string, number>;
  rebalanceAdvice: string[];
  whatIfs: {
    symbol: string;
    rebalancedGain: string;
    singleHoldingGain: string;
    avoidedGain: string;
  }[];
};



export default function ScenarioSim() {
  const [holdingsTable, setHoldingsTable] = useState<{ ticker: string; quantity: number }[]>([{ ticker: 'TSLA', quantity: 10 }]);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [timeRange, setTimeRange] = useState<number>(90);
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [entryDay, setEntryDay] = useState(5);
  const [selectedEntrySymbol, setSelectedEntrySymbol] = useState<string>('');
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.style.setProperty('--bg-color', '#0f172a');
      root.style.setProperty('--text-color', '#f8fafc');
      root.style.setProperty('--input-bg', '#1e293b');
      root.style.setProperty('--input-text', '#f8fafc');
      root.style.setProperty('--card-bg', '#1e293b');
      root.style.setProperty('--card-border', '#334155');
      root.style.setProperty('--highlight-color', '#facc15');
      root.style.setProperty('--chart-bg', '#0f172a');
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--bg-color', '#fefce8');
      root.style.setProperty('--text-color', '#111827');
      root.style.setProperty('--input-bg', '#ffffff');
      root.style.setProperty('--input-text', '#111827');
      root.style.setProperty('--card-bg', '#ffffff');
      root.style.setProperty('--card-border', '#e5e7eb');
      root.style.setProperty('--highlight-color', '#3b82f6');
      root.style.setProperty('--chart-bg', '#ffffff');
    }
  }, [isDarkMode]);
  

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  

  const riskTolerance = 0.5;
  const rebalanceSuggestions = useMemo(() => {
    return results ? getAutoRebalanceSuggestion(results.results, riskTolerance) : [];
  }, [results, riskTolerance]);

  const alphaKey = process.env.REACT_APP_ALPHA_KEY!;
  const newsKey = process.env.REACT_APP_NEWS_KEY!;

  const handleExport = async () => {
    const canvas = await html2canvas(document.documentElement, {
      scale: 2,
      scrollY: -window.scrollY,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save('portfolio_report.pdf');
  };

  const handleAnalyze = async () => {
    const symbols = holdingsTable.map((h) => h.ticker.toUpperCase());
    const qtyArray = holdingsTable.map((h) => h.quantity);

    const fetchHistory = async (symbol: string): Promise<number[]> => {
      const res = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${process.env.REACT_APP_ALPHA_KEY}`);
      const data = await res.json();
      const series = data['Time Series (Daily)'];
      return series ? Object.values(series).slice(0, timeRange).map((e: any) => parseFloat(e['4. close'])).reverse() : [];
    };

    const fetchGlobalQuote = async (symbol: string) => {
      const res = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.REACT_APP_ALPHA_KEY}`);
      const data = await res.json();
      const quote = data['Global Quote'];
      return {
        price: parseFloat(quote['05. price'] || '0'),
        open: parseFloat(quote['02. open'] || '0'),
        high: parseFloat(quote['03. high'] || '0'),
        low: parseFloat(quote['04. low'] || '0'),
        prevClose: parseFloat(quote['08. previous close'] || '0'),
        name: quote['01. symbol'] || 'N/A'
      };
    };

    const fetchSentiment = async (symbol: string): Promise<string[]> => {
      const fromDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const res = await fetch(`https://newsapi.org/v2/everything?q=${symbol}&from=${fromDate}&sortBy=publishedAt&pageSize=5&language=en&apiKey=${process.env.REACT_APP_NEWS_KEY}`);
      const data = await res.json();
      return data.articles?.map((a: any) => a.title) || [];
    };

    const fetchCompanyOverview = async (symbol: string): Promise<{ sector: string; name: string }> => {
      const res = await fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${process.env.REACT_APP_ALPHA_KEY}`);
      const data = await res.json();
      return {
        sector: data?.Sector || 'Unknown',
        name: data?.Name || symbol,
      };
    };
    

    const stocks = await Promise.all(symbols.map(async (symbol, index) => {
      const history = await fetchHistory(symbol);
      const quote = await fetchGlobalQuote(symbol);
      const headlines = await fetchSentiment(symbol);
      const { sector, name } = await fetchCompanyOverview(symbol);
      const quantity = qtyArray[index];
      const lastPrice = quote.price;
      const change30 = ((lastPrice - history[history.length - 30]) / history[history.length - 30]) * 100;
      const change90 = ((lastPrice - history[0]) / history[0]) * 100;
      const volatility = Math.max(...history) - Math.min(...history);
      const risk = volatility > 10 ? 'High' : volatility > 5 ? 'Moderate' : 'Low';
      const positiveKeywords = ['soar', 'surge', 'gain', 'upgrade', 'beat', 'buy', 'rise', 'bullish', 'positive'];
const negativeKeywords = ['drop', 'cut', 'miss', 'downgrade', 'sell', 'bearish', 'slump', 'negative'];

const score = headlines.reduce((acc: number, title: string) => {
  const t = title.toLowerCase();
  const pos = positiveKeywords.some((k) => t.includes(k));
  const neg = negativeKeywords.some((k) => t.includes(k));
  return acc + (pos ? 1 : neg ? -1 : 0);
}, 0);
      const gain90 = quantity * (lastPrice - history[0]);
      return {
        symbol,
        quantity,
        history,
        change30,
        change90,
        gain90,
        risk,
        sector,
        score,
        lastPrice,
        totalValue: lastPrice * quantity,
        open: quote.open,
        high: quote.high,
        low: quote.low,
        prevClose: quote.prevClose,
        name: name,
        extended: quote.price
      };
    }));

    const totalGain = stocks.reduce((acc, r) => acc + r.gain90, 0);
    const totalPortfolioValue = stocks.reduce((acc, r) => acc + r.totalValue, 0);
    const portfolioTrend = Array(timeRange).fill(0).map((_, i) =>
      stocks.reduce((acc, r) => acc + (r.history[i] || 0) * r.quantity, 0)
    );
    const rebalanceAdvice = stocks.filter((r) => r.risk === 'High').map((r) => `${r.symbol} is high-risk. Consider reducing exposure.`);
    const whatIfs = stocks.map((r) => {
      const has30Days = r.history.length >= 30;
      const rebalancedGain = has30Days
        ? ((r.change90 / 100) * r.quantity * r.history[r.history.length - 30]).toFixed(2)
        : 'N/A';
      const singleHoldingGain = (r.change90 / 100 * 10000).toFixed(2);
      const avoidedGain = r.risk === 'High'
        ? 'Avoiding would reduce portfolio volatility'
        : 'Safe asset';
    
      return {
        symbol: r.symbol,
        rebalancedGain,
        singleHoldingGain,
        avoidedGain
      };
    });
    

    const sectorAllocations: Record<string, number> = {};
    stocks.forEach(r => {
      if (!sectorAllocations[r.sector]) sectorAllocations[r.sector] = 0;
      sectorAllocations[r.sector] += r.totalValue;
    });

    setResults({ results: stocks, totalGain, totalPortfolioValue, portfolioTrend, sectorAllocations, rebalanceAdvice, whatIfs });
    // Fix for snapshot table not appearing immediately on 1D
    if (timeRange === 1) {
      setShowSnapshot(false); // reset
      setTimeout(() => setShowSnapshot(true), 10); // trigger rerender
    } else {
      setShowSnapshot(false);
    }

  };

  const updateTable = (index: number, field: 'ticker' | 'quantity', value: string | number) => {
    const updated = [...holdingsTable];
    if (field === 'quantity') {
      updated[index].quantity = parseInt(value as string);
    } else {
      updated[index].ticker = value.toString();
    }
    setHoldingsTable(updated);
  };

  const addRow = () => setHoldingsTable([...holdingsTable, { ticker: '', quantity: 0 }]);

  const deleteRow = (index: number) => {
    const updated = holdingsTable.filter((_, i) => i !== index);
    setHoldingsTable(updated);
  };

  return (
    <div className="min-h-screen px-8 py-12 transition-colors duration-300" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      <style>{`
  input, select, textarea, .custom-card, .custom-chart {
    background-color: var(--input-bg);
    color: var(--input-text);
    border: 1px solid var(--card-border);
    padding: 0.5rem;
    border-radius: 0.375rem;
  }
  input::placeholder, select:disabled, input:disabled {
    color: var(--input-text);
    opacity: 0.6;
  }
  .custom-card {
    background-color: var(--card-bg);
    border: 1px solid var(--card-border);
  }
  .chart-container canvas {
    background-color: var(--card-bg) !important;
  }
  .highlight {
    color: var(--highlight-color);
  }
  .dark .custom-card,
  .dark .custom-chart,
  .dark input,
  .dark select {
    background-color: var(--input-bg);
    color: var(--input-text);
    border-color: var(--card-border);
  }
`}</style>

      <div className="fixed bottom-4 right-4 flex flex-col gap-3 z-50">
        <button
          onClick={toggleTheme}
          className="bg-white/70 dark:bg-slate-800 backdrop-blur border border-gray-300 dark:border-gray-700 shadow-md p-3 rounded-full hover:scale-105 transition"
          title="Toggle Theme"
        >
          {isDarkMode ? <FaSun /> : <FaMoon />}
        </button>
        <button className="bg-white/70 dark:bg-slate-800 backdrop-blur border border-gray-300 dark:border-gray-700 shadow-md p-3 rounded-full hover:scale-105 transition" title="Enable Real-Time Mode"><FaBolt /></button>
        <button className="bg-white/70 dark:bg-slate-800 backdrop-blur border border-gray-300 dark:border-gray-700 shadow-md p-3 rounded-full hover:scale-105 transition" title="Rebalance Now"><FaRedoAlt /></button>
        <button onClick={handleExport} className="bg-white/70 dark:bg-slate-800 backdrop-blur border border-gray-300 dark:border-gray-700 shadow-md p-3 rounded-full hover:scale-105 transition" title="Export PDF"><FaDownload /></button>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold flex items-center gap-2"><FaChartPie /> Scenario Simulator</h1>
        {results && (
          <div className="text-lg font-semibold bg-white border border-yellow-300 px-4 py-2 rounded shadow">
            Total Portfolio Value: ${results.totalPortfolioValue.toFixed(2)}
          </div>
        )}
      </div>

      <div className="mb-6">
        <label className="block font-medium mb-2">Select Start Date (for simulation):</label>
        <input type="date" className="px-4 py-2 border border-yellow-400 rounded shadow-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <select className="ml-4 px-6 py-1 border border-gray-300 rounded" value={timeRange} onChange={(e) => setTimeRange(parseInt(e.target.value))}>
          <option value={1}>1D</option>
          <option value={5}>5D</option>
          <option value={22}>1M</option>
          <option value={66}>3M</option>
          <option value={132}>6M</option>
          <option value={252}>1Y</option>
          <option value={1260}>5Y</option>
        </select>
        <button onClick={handleAnalyze} className="ml-4 bg-yellow-400 text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-yellow-500 transition">
          <FaSyncAlt /> Simulate
        </button>
        {results && (
          <button onClick={handleExport} className="ml-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition text-sm">
            <FaDownload className="inline mr-1" /> Export Report
          </button>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">🧾 Enter Holdings:</h2>
        <table className="w-full text-sm border border-yellow-300 mb-2 text-center">
          <thead>
            <tr><th className="border px-2">Ticker</th><th className="border px-2">Quantity</th><th className="border px-2">Last Price</th><th className="border px-2">Total Gain/Loss</th><th></th></tr>
          </thead>
          <tbody>
            {holdingsTable.map((row, idx) => (
              <tr key={idx}>
                <td className="border px-2"><input className="w-20 border px-1 text-center" value={row.ticker} onChange={(e) => updateTable(idx, 'ticker', e.target.value)} /></td>
                <td className="border px-2"><input type="number" className="w-20 border px-1 text-center" value={row.quantity} onChange={(e) => updateTable(idx, 'quantity', e.target.value)} /></td>
                <td className="border px-2">{results?.results[idx]?.lastPrice?.toFixed(2) || '-'}</td>
                <td className="border px-2">{results?.results[idx]?.gain90?.toFixed(2) || '-'}</td>
                <td className="border px-2"><button onClick={() => deleteRow(idx)} className="text-red-500 hover:text-red-700"><FaTrashAlt /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addRow} className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 transition flex items-center gap-1">
          <FaPlus /> Add Row
        </button>
      </div>

      {results && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-6" ref={reportRef}>
          <h2 className="text-xl font-bold mb-4">📊 Portfolio Simulation</h2>
          <p className="text-sm mb-4">Estimated Total Gain ({timeRange}d): <b>${results.totalGain.toFixed(2)}</b></p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-md font-semibold mb-2">💼 Portfolio Value Trend:</h3>
              <Line
                data={{
                  labels: results.portfolioTrend.map((_: any, i: number) => `Day ${i + 1}`),
                  datasets: [{
                    label: 'Portfolio Value',
                    data: results.portfolioTrend,
                    borderColor: '#eab308',
                    tension: 0.4,
                    fill: false
                  }]
                }}
                options={{ plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }}
              />
            </div>
            <div className="max-w-xs mx-auto">
              <h3 className="text-md font-semibold mb-2">📊 Sector Allocation:</h3>
              <Pie
                data={{
                  labels: Object.keys(results.sectorAllocations),
                  datasets: [{
                    label: 'Sectors',
                    data: Object.values(results.sectorAllocations),
                    backgroundColor: ['#facc15', '#60a5fa', '#f87171', '#34d399', '#c084fc']
                  }]
                }}
              />
            </div>
          </div>

          <h3 className="text-md font-semibold mb-2">🔍 What-If Scenarios:</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 mb-6">
            {results.whatIfs.map((w: any, idx: number) => (
              <li key={idx}><b>{w.symbol}:</b> Rebalanced 30d ago = +${w.rebalancedGain}, Held Only = +${w.singleHoldingGain}, Note: {w.avoidedGain}</li>
            ))}
          </ul>

            <div className="mt-8 bg-white border rounded p-4">
            <h3 className="text-md font-semibold mb-2">🌍 Risk Cluster Mapping</h3>
            <p className="text-sm mb-2 text-gray-600">(Beta) Visualizes stock correlations to identify clusters and overexposures. Full network graph coming soon.</p>
            <ul className="list-disc list-inside text-sm">
              {getCorrelations(results.results).slice(0, 5).map((link, idx) => (
            <li key={idx}>{link.source} ↔ {link.target} | Corr: {link.value.toFixed(2)}</li>
            ))}
          </ul>

        
 {/* 📈 Smart Entry Optimizer */}
 {results && (
        <div className="mt-8 bg-white border rounded p-4">
          <h3 className="text-md font-semibold mb-2">🚀 Smart Entry Optimizer</h3>
          <div className="mb-2">
            <label htmlFor="entrySymbol" className="text-sm text-gray-600 mr-2">Select Stock:</label>
            <select
              id="entrySymbol"
              value={selectedEntrySymbol || results.results[0].symbol}
              onChange={(e) => setSelectedEntrySymbol(e.target.value)}
              className="border px-2 py-1 rounded pr-8"
            >
              {results.results.map((stock) => (
                <option key={stock.symbol} value={stock.symbol}>{stock.symbol}</option>
              ))}
            </select>
          </div>
          <p className="text-sm mb-2 text-gray-600">Pick your actual buy date:</p>
          <input
            type="range"
            min={0}
            max={results.results[0].history.length - 2}
            value={entryDay}
            onChange={(e) => setEntryDay(Number(e.target.value))}
            className="mb-4 w-full"
          />

          {(() => {
            const selected = results.results.find(s => s.symbol === (selectedEntrySymbol || results.results[0].symbol));
            if (!selected || !selected.history.length || entryDay >= selected.history.length) return null;
            const entryData = calculateSmartEntry(selected.history, entryDay);
            const entryPrice = selected.history[entryDay];
            const bestPrice = selected.history[entryData.bestIndex];

            return (
              <>
                <div className="w-full max-w-4xl mx-auto">
                  <Line
                    data={{
                      labels: selected.history.map((_, i) => `Day ${i + 1}`),
                      datasets: [
                        {
                          label: 'Price History',
                          data: selected.history,
                          borderColor: '#3b82f6',
                          tension: 0.4,
                          pointRadius: 2
                        },
                        {
                          label: 'Your Buy',
                          data: selected.history.map((_, i) => i === entryDay ? entryPrice : null),
                          borderColor: '#10b981',
                          pointBackgroundColor: '#10b981',
                          pointRadius: 6,
                          fill: false
                        },
                        {
                          label: 'Optimal Buy',
                          data: selected.history.map((_, i) => i === entryData.bestIndex ? bestPrice : null),
                          borderColor: '#f97316',
                          pointBackgroundColor: '#f97316',
                          pointRadius: 6,
                          fill: false
                        },
                        {
                          label: 'Delta Animation',
                          data: selected.history.map((_, i) => i >= Math.min(entryDay, entryData.bestIndex) && i <= Math.max(entryDay, entryData.bestIndex) ? null : null),
                          borderColor: 'rgba(0,0,0,0)',
                          pointRadius: 0
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      plugins: { legend: { display: true } },
                      scales: { x: { display: false }, y: { display: true } },
                      animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                      }
                    }}
                    height={80}
                  />
                </div>

                <div className="mt-4 text-sm text-gray-700">
                  <p>You bought on Day {entryDay + 1} at ${entryPrice !== undefined ? entryPrice.toFixed(2) : 'N/A'}.</p>
                  <p>Best buy day would’ve been Day {entryData.bestIndex + 1} at ${bestPrice !== undefined ? bestPrice.toFixed(2) : 'N/A'}.</p>
                  <p className="text-green-600">You could’ve gained an extra {isFinite(entryData.delta) ? entryData.delta.toFixed(2) : '0.00'}%.</p>
                  <p className="text-blue-600">Your timing beat {isFinite(entryData.beatPercent) ? entryData.beatPercent.toFixed(0) : '0'}% of other possible entries.</p>
                </div>
              </>
            );
          })()}
        </div>
)}

{/* 🧩 Auto-Rebalance Assistant */}
{results && (
  <div className="mt-10">
    <h3 className="text-md font-semibold mb-2">🧩 Auto-Rebalance Assistant</h3>
    <p className="text-sm text-gray-600 mb-2">Suggestions based on Moderate Risk Tolerance (0.5):</p>
    <ul className="list-disc list-inside text-sm">
      {getAutoRebalanceSuggestion(results.results, 0.5).map((r, idx) => (
        <li key={idx}>
          <b>{r.symbol}:</b> {r.adjustment > 0 ? 'Increase' : 'Reduce'} by ${Math.abs(r.adjustment).toFixed(2)}
          {r.advisory && ` ${r.advisory}`}
        </li>
      ))}
    </ul>
  </div>
)}


            <h3 className="text-md font-semibold mt-6 mb-2">🧭 Time-Weighted ROI</h3>
            <ul className="list-disc list-inside text-sm text-gray-700">
            {results.results.map((stock, idx) => (
            <li key={idx}><b>{stock.symbol}:</b> {computeTimeWeightedROI(stock)}%</li>
            ))}
            </ul>
          </div>


          <div className="mt-12">
        <h3 className="text-lg font-semibold mb-4">🧠 AI Insights Dashboard</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">


          {/* Confidence Forecast */}
          <div className="bg-white/60 backdrop-blur border border-yellow-200 rounded-lg p-4 shadow-inner">
            <div className="flex items-center mb-2 text-sm text-gray-600">
              <FaInfoCircle className="mr-2 text-yellow-500" /> Confidence Forecast
            </div>
            {results.results.map((stock, i) => {
              const volatility = Math.abs(stock.high - stock.low);
              const sentimentTrend = stock.score >= 2 ? '🟢' : stock.score <= -2 ? '🔴' : '🟡';
              const confidence = Math.max(30, Math.min(95, 100 - volatility * 4 + stock.score * 5));
              const reason = stock.score >= 2 ? 'Positive sentiment (e.g. upgrade news)' : stock.score <= -2 ? 'Negative sentiment (e.g. downgrade/cuts)' : 'Neutral sentiment';
              return (
                <Tippy key={i} content={reason} placement="right">
                  <p className="text-sm cursor-help">{stock.symbol}: Confidence {confidence.toFixed(0)}% {sentimentTrend}</p>
                </Tippy>
              );
            })}
          </div>

          {/* Emotion Meter */}
          <div className="bg-white/60 backdrop-blur border border-red-200 rounded-lg p-4 shadow-inner">
            <div className="flex items-center mb-2 text-sm text-gray-600">
              <FaInfoCircle className="mr-2 text-red-400" /> Crowd Pulse
            </div>
            {results.results.map((stock, i) => {
              const label = stock.score > 2 ? '🔥 Hype' : stock.score < -2 ? '🧊 Cold' : '😐 Neutral';
              return <p key={i} className="text-sm">{stock.symbol}: {label}</p>;
            })}
          </div>

          {/* Portfolio Health Score */}
          <div className="bg-white/60 backdrop-blur border border-green-200 rounded-lg p-4 shadow-inner">
  <div className="flex items-center mb-2 text-sm text-gray-600">
    <FaInfoCircle className="mr-2 text-green-500" /> Portfolio Health
  </div>
  {(() => {
    const diversificationScore = Object.keys(results.sectorAllocations).length >= 4 ? 30 : 10;
    const riskScore = results.results.every(r => r.risk === 'Low') ? 30 : results.results.every(r => r.risk !== 'High') ? 20 : 10;
    const returnScore = results.totalGain > 0 ? 25 : 10;
    const roiScore = results.results.reduce((acc, r) => acc + parseFloat(computeTimeWeightedROI(r)), 0) / results.results.length;
    const normalizedRoiScore = Math.min(Math.max((roiScore / 10) * 10, 0), 20); // 0-20 range

    // Fetch actual dividend yields and EPS from stock.overview if available
    const dividendAndEpsScore = (() => {
      let totalYield = 0;
      let yieldCount = 0;
      let totalEPS = 0;
      let epsCount = 0;
      for (const stock of results.results) {
        const overview = stock.overview as { DividendYield?: string; EPS?: string };
        if (overview?.DividendYield) {
          const yieldValue = parseFloat(overview.DividendYield);
          if (!isNaN(yieldValue)) {
            totalYield += yieldValue * 100; // Convert to %
            yieldCount++;
          }
        }
        if (overview?.EPS) {
          const epsValue = parseFloat(overview.EPS);
          if (!isNaN(epsValue)) {
            totalEPS += epsValue;
            epsCount++;
          }
        }
      }
      const avgYield = yieldCount > 0 ? totalYield / yieldCount : 0;
      const avgEPS = epsCount > 0 ? totalEPS / epsCount : 0;
      const yieldScore = Math.min(Math.max((avgYield / 5) * 10, 0), 10); // up to 10
      const epsScore = Math.min(Math.max((avgEPS / 5) * 10, 0), 5); // up to 5
      return yieldScore + epsScore;
    })();

    const totalScore = diversificationScore + riskScore + returnScore + normalizedRoiScore + dividendAndEpsScore;
    return <p className="text-sm font-bold text-green-600">Health Score: {totalScore.toFixed(0)} / 100</p>;
  })()}
</div>

        </div>
      </div>
        </div>
      )}

      {results && showSnapshot && (
        <div className="mt-12" ref={reportRef}>
          <h2 className="text-xl font-bold mb-4">📋 1-Day Market Snapshot</h2>
          <div className="overflow-auto">
            <table className="w-full border text-sm text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Symbol</th>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Open</th>
                  <th className="p-2 border">High</th>
                  <th className="p-2 border">Low</th>
                  <th className="p-2 border">Prev Close</th>
                  <th className="p-2 border">Extended</th>
                </tr>
              </thead>
              <tbody>
                {results.results.map((stock: any, i: number) => (
                  <tr key={i} className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 border font-semibold">{stock.symbol}</td>
                    <td className="p-2 border">{stock.name}</td>
                    <td className="p-2 border">{stock.open.toFixed(2)}</td>
                    <td className="p-2 border">{stock.high.toFixed(2)}</td>
                    <td className="p-2 border">{stock.low.toFixed(2)}</td>
                    <td className="p-2 border">{stock.prevClose.toFixed(2)}</td>
                    <td className="p-2 border">{stock.extended.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
