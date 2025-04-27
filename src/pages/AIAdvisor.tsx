import { useState } from 'react';
import { FaRobot } from 'react-icons/fa';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export default function InvestmentAdvisor() {
  const [capital, setCapital] = useState('');
  const [duration, setDuration] = useState('');
  const [growth, setGrowth] = useState('');
  const [risk, setRisk] = useState('');
  const [tickers, setTickers] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');

  const [chatInput, setChatInput] = useState('');
  const [chatReasoning, setChatReasoning] = useState('');
  const [chatAction, setChatAction] = useState('');
  const [chatConfidence, setChatConfidence] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const handleAnalyze = async () => {
    setError('');
    setResults([]);

    if (!capital || parseFloat(capital) <= 0) return setError('Enter a valid capital amount.');
    if (!duration || parseInt(duration) <= 0) return setError('Enter a valid investment duration.');
    if (!growth || parseFloat(growth) <= 0) return setError('Enter a valid growth target.');
    if (!risk || parseFloat(risk) < 0 || parseFloat(risk) > 1) return setError('Risk tolerance must be between 0.0 and 1.0.');
    if (!tickers || tickers.split(',').filter(t => t.trim()).length === 0) return setError('Enter at least one valid ticker.');

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capital: parseFloat(capital),
          duration_days: parseInt(duration),
          growth_target: parseFloat(growth),
          risk_tolerance: parseFloat(risk),
          tickers: tickers.split(',').map(t => t.trim().toUpperCase()),
        })
      });
      const data = await res.json();
      if (!data.recommendations || data.recommendations.length === 0) {
        setError('⚠ No strong recommendations found. Try adjusting your inputs or tickers.');
      } else {
        const formatted = data.recommendations.map((r: any) => ({
          ...r,
          predicted_growth: parseFloat(Number(r.predicted_growth).toFixed(2)),
          suggested_investment: parseFloat(Number(r.suggested_investment).toFixed(2)),
          portfolio_pct: parseFloat(Number(r.portfolio_pct).toFixed(2))
        }));
        setResults(formatted);
      }
    } catch (err) {
      console.error(err);
      setError('❌ Failed to fetch recommendations. Please check your backend or try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    setChatReasoning('');
    setChatAction('');
    setChatConfidence('');
    setChatLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: chatInput })
      });

      const data = await res.json();

      if (data.reasoning) {
        setChatReasoning(data.reasoning);
        setChatAction(data.recommended_action || "Unknown");
        setChatConfidence(data.confidence_score || "?");
      } else if (data.error) {
        setChatReasoning(`❌ Error: ${data.error}`);
      } else {
        setChatReasoning('❌ No response received.');
      }
    } catch (err) {
      console.error('Fetch failed:', err);
      setChatReasoning('❌ Network or server error occurred.');
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 text-white px-6 py-10 font-sans">
      <div className="max-w-2xl mx-auto p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-6">
          <FaRobot className="text-pink-400" /> AI Investment Advisor
        </h1>

        {/* Investment Form */}
        <input type="number" placeholder="Capital ($)" className="input" value={capital} onChange={(e) => setCapital(e.target.value)} />
        <input type="number" placeholder="Investment Duration (days)" className="input" value={duration} onChange={(e) => setDuration(e.target.value)} />
        <input type="number" placeholder="Target Growth (%)" className="input" value={growth} onChange={(e) => setGrowth(e.target.value)} />
        <input type="number" placeholder="Risk Tolerance (0.0 to 1.0)" className="input" value={risk} onChange={(e) => setRisk(e.target.value)} />
        <input type="text" placeholder="Stock Tickers (comma-separated)" className="input" value={tickers} onChange={(e) => setTickers(e.target.value)} />

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="mt-4 w-full py-2 px-4 text-lg bg-yellow-400 hover:bg-yellow-500 transition rounded-xl shadow-lg font-semibold text-black"
        >
          {loading ? 'Analyzing...' : 'Get Investment Advice'}
        </button>

        {error && <p className="text-red-400 mt-4 font-medium">{error}</p>}

        {/* Investment Results */}
        {results.length > 0 && (
          <div className="mt-8 bg-slate-800 p-6 rounded-xl">
            <h2 className="text-2xl font-semibold text-yellow-300 flex items-center gap-2 mb-4">
              📊 Recommendations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((rec, idx) => (
                <div key={idx} className="bg-slate-700 p-4 rounded-lg shadow-md">
                  <h3 className="text-lg font-bold text-white">{rec.ticker}</h3>
                  <p className="text-green-400">📈 Predicted Growth: <b>{rec.predicted_growth}%</b></p>
                  <p className="text-yellow-300">💰 Suggested Investment: <b>${rec.suggested_investment}</b></p>
                  <p className="text-blue-300">📊 Portfolio Share: <b>{rec.portfolio_pct}%</b></p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chatbot Section */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">🤖 Ask AI Anything About Your Strategy</h2>
          <textarea
            className="input"
            rows={3}
            placeholder="e.g., Should I buy TSLA this week?"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <button
            onClick={handleChat}
            disabled={chatLoading}
            className="mt-2 py-2 px-4 text-md bg-green-500 hover:bg-green-600 transition rounded-xl font-semibold text-white"
          >
            {chatLoading ? 'Thinking...' : 'Ask AI'}
          </button>

          {chatReasoning && (
            <div className="mt-6">
              {(() => {
                const parsedMarkdown = marked(chatReasoning) as string;
                return (
                  <>
                    <div
                      className="bg-slate-800 p-6 rounded-xl prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(parsedMarkdown) }}
                    />
                    <div className="mt-4 text-xl font-bold text-yellow-300">
                      🚀 Recommended Action: {chatAction || 'Unknown'}
                    </div>
                    <div className="mt-2 text-md font-semibold text-green-300">
                      🎯 Confidence Score: {chatConfidence || '?'}%
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.6rem 1rem;
          margin-bottom: 0.75rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.05);
          color: white;
        }
        .input::placeholder {
          color: rgba(255,255,255,0.6);
        }
      `}</style>
    </div>
  );
}
