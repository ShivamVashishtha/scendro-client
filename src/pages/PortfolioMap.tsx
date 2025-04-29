import { useState, useEffect } from 'react';
import { FaSearch, FaPlus, FaChartLine, FaMoon, FaSun } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import { supabase } from "../supabaseClient"; // 🛠️ import Supabase client
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface Sentiment {
  price: string;
  change: string;
  changePercent: string;
  sentimentScore: number;
  headlines: string[];
  history: number[];
}

export default function PortfolioMap() {
  const [input, setInput] = useState('');
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [sentimentData, setSentimentData] = useState<{ [ticker: string]: Sentiment }>({});
  const [darkMode, setDarkMode] = useState(false);

  const alphaKey = process.env.REACT_APP_ALPHA_KEY!;
  const newsKey = process.env.REACT_APP_NEWS_KEY!;

  const handleAddTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    const symbol = input.trim().toUpperCase();
    if (!symbol || portfolio.includes(symbol)) return;
    setPortfolio([...portfolio, symbol]);
    setInput('');
    await fetchSentiment(symbol);

    const handleDeleteTicker = async (symbol: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
    
      // Remove locally
      setPortfolio((prev) => prev.filter((s) => s !== symbol));
      setSentimentData((prev) => {
        const updated = { ...prev };
        delete updated[symbol];
        return updated;
      });
    
      // Remove from Supabase
      await supabase
        .from('portfolio_holdings')
        .delete()
        .match({ user_id: user.id, symbol });
    };
    
    // 🔵 Save added ticker to Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('portfolio_holdings').insert({
        user_id: user.id,
        symbol,
        quantity: 0,
        avg_price: 0,
      });
    }
  };

  const summarizeHeadlines = (headlines: string[]): string => {
    if (!headlines.length) return 'No headlines available.';
    const positive = headlines.filter(h => h.match(/beat|soar|record|growth|surge/i)).length;
    const negative = headlines.filter(h => h.match(/cut|miss|fall|slump|downgrade/i)).length;
    const sentiment = positive > negative ? 'positive' : negative > positive ? 'negative' : 'neutral';
    return `Recent news sentiment appears ${sentiment}, based on ${headlines.length} headlines.`;
  };

  const fetchSentiment = async (symbol: string) => {
    try {
      const quoteRes = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaKey}`);
      const quoteData = await quoteRes.json();
      const q = quoteData['Global Quote'];
      if (!q || !q['05. price']) {
        console.warn(`No quote data for ${symbol}`, quoteData);
        return; // 💥 exit early if data missing
      }
      const historyRes = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${alphaKey}`);
      const historyJson = await historyRes.json();
      const historyObj = historyJson['Time Series (Daily)'];
      const history = historyObj ? Object.values(historyObj).slice(0, 10).map((entry: any) => parseFloat(entry['4. close'])).reverse() : [];

      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 3);
      const fromDate = lastWeek.toISOString().split('T')[0];

      const newsRes = await fetch(`https://newsapi.org/v2/everything?q=${symbol}&from=${fromDate}&sortBy=publishedAt&pageSize=5&language=en&apiKey=${newsKey}`);
      const newsData = await newsRes.json();
      const headlines: string[] = newsData.articles?.slice(0, 5).map((a: any) => a.title) || [];

      const positiveWords = ['beat', 'soar', 'surge', 'growth', 'upgrade', 'buy', 'best', 'record'];
      const negativeWords = ['fall', 'cut', 'miss', 'downgrade', 'slump', 'warning', 'hit hard', 'setback'];

      const sentimentScore = headlines.reduce((acc, title) => {
        const text = title.toLowerCase();
        let score = 0;
        positiveWords.forEach((word) => { if (text.includes(word)) score += 1; });
        negativeWords.forEach((word) => { if (text.includes(word)) score -= 1; });
        return acc + score;
      }, 0);

      setSentimentData(prev => ({
        ...prev,
        [symbol]: {
          price: q['05. price'],
          change: q['09. change'],
          changePercent: q['10. change percent'],
          sentimentScore,
          headlines,
          history
        }
      }));
    } catch (err) {
      console.error('Error fetching data for', symbol, err);
    }
  };

  const calculateConfidence = (changePercent: string, sentimentScore: number): string => {
    const change = parseFloat(changePercent);
    const score = sentimentScore;
    if (change > 2 && score > 2) return "95% Strong Buy";
    if (change > 1 && score > 1) return "85% Buy";
    if (change < -2 && score < -2) return "20% Sell";
    if (score <= 0 && change <= 0) return "40% Hold";
    return "60% Neutral";
  };

  const calculateRisk = (changePercent: string): string => {
    const change = Math.abs(parseFloat(changePercent));
    if (change < 0.5) return "Low";
    if (change < 1.5) return "Moderate";
    return "High";
  };

  const StockCard = ({ symbol, data }: { symbol: string, data: Sentiment }) => (
    <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} p-6 rounded-2xl border border-blue-200 shadow-md hover:shadow-lg transition-all duration-300 relative`}>
      <div className="absolute top-2 right-4 text-blue-100 text-3xl">
        <FaChartLine />
      </div>
      <h2 className="text-3xl font-semibold text-blue-600 mb-2">{symbol}</h2>
      <p className="text-lg">
        💰 <b className="text-green-500">${data.price}</b>
        <span className="ml-2 text-sm">
          ({data.change} / {data.changePercent})
        </span>
      </p>
      <div className={`mt-3 inline-block px-4 py-1 rounded-full text-sm font-bold shadow-sm ${
        data.sentimentScore > 0 ? 'bg-green-100 text-green-800' :
        data.sentimentScore < 0 ? 'bg-red-100 text-red-800' :
        'bg-gray-100 text-gray-700'}`}>
        Sentiment Score: {data.sentimentScore}
      </div>
      <ul className="mt-4 text-sm space-y-1 list-disc list-inside">
        {data.headlines.map((h, i) => (
          <li key={i}>{h}</li>
        ))}
      </ul>
      <div className="mt-4 text-xs italic text-gray-500">
        {summarizeHeadlines(data.headlines)}
      </div>
      <div className="mt-6 cursor-pointer group">
        <div className="overflow-hidden rounded-xl group-hover:shadow-xl group-hover:ring-2 group-hover:ring-blue-400 transition-all">
          <Line
            data={{
              labels: data.history.map((_, i) => `Day ${i + 1}`),
              datasets: [{
                label: `${symbol} Price History`,
                data: data.history,
                fill: false,
                borderColor: "#3b82f6",
                tension: 0.3
              }]
            }}
            options={{ plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }}
          />
        </div>
      </div>
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl shadow-inner space-y-2 transition-transform duration-500 transform hover:scale-[1.03]">
        <h3 className="text-blue-800 text-sm font-semibold tracking-wide">🧠 AI Insight</h3>
        <p className="text-sm">
          Confidence: <span className="font-bold text-green-600">{calculateConfidence(data.changePercent, data.sentimentScore)}</span><br />
          Risk: <span className={`font-medium ${
            calculateRisk(data.changePercent) === 'High' ? 'text-red-600' :
            calculateRisk(data.changePercent) === 'Moderate' ? 'text-orange-500' : 'text-green-500'}`}>{calculateRisk(data.changePercent)}</span>
        </p>
        <button className="text-xs text-blue-600 font-semibold hover:underline">
          View Report →
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    async function loadSavedPortfolio() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('portfolio_holdings')
          .select('symbol')
          .eq('user_id', user.id);
        if (data) {
          const symbols = data.map((entry: any) => entry.symbol);
          setPortfolio(symbols);
          symbols.forEach(fetchSentiment);
        }
      }
    }
    loadSavedPortfolio();
  }, []);

  return (
    <div className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-[#e3f2fd] via-[#f9fbff] to-[#f1faff] text-[#1b1f3b]'} min-h-screen p-10 font-['Inter']`}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600">
          🚀 Portfolio Sentiment Map
        </h1>
        <button onClick={() => setDarkMode(!darkMode)} className="text-xl p-2 border rounded-full shadow">
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
      </div>

      {portfolio.length > 0 && (
        <div className="overflow-hidden whitespace-nowrap border-y border-gray-300 py-2 mb-8 bg-white shadow-sm rounded">
          <div className="inline-block animate-marquee space-x-10 text-sm text-gray-600 font-medium">
            {portfolio.map((sym) => {
              const percent = sentimentData[sym]?.changePercent || "0%";
              const trend = parseFloat(percent) >= 0 ? "⬆" : "⬇";
              return <span key={sym} className="inline-block px-4">{sym} {trend} {percent}</span>
            })}
          </div>
        </div>
      )}

      <form onSubmit={handleAddTicker} className="flex justify-center items-center gap-4 mb-16">
        <div className="relative w-full max-w-md">
          <FaSearch className="absolute left-3 top-3 text-blue-600" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter ticker (e.g., TSLA)"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-blue-300 bg-white text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-cyan-400 outline-none transition"
          />
        </div>
        <button
          type="submit"
          className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition flex items-center gap-2"
        >
          <FaPlus /> Add
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
        {portfolio.map(symbol => (
          sentimentData[symbol] && (
            <StockCard key={symbol} symbol={symbol} data={sentimentData[symbol]} />
          )
        ))}
      </div>

      <footer className="mt-20 text-center text-gray-500 text-sm tracking-widest">
        ⌁ Powered by AlphaVantage + NewsAPI • StockScope AI {new Date().getFullYear()}
      </footer>
    </div>
  );
}