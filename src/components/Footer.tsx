import React from 'react';
import { Link } from 'react-router-dom';
import { FaInstagram, FaXTwitter } from 'react-icons/fa6';

export default function Footer() {
  return (
    <footer className="w-full flex justify-center px-4 pb-10 pt-16 relative z-50">
      <div className="w-full max-w-7xl rounded-2xl border border-[#1d1d1d] bg-black/60 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.6)] px-8 py-10 text-gray-300 hover:shadow-[0_8px_50px_rgba(0,0,0,0.7)] transition-shadow duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-2 mb-3">
    <img src="/favicon.svg" alt="Logo" className="w-6 h-6" />
    <h2 className="text-xl font-semibold text-white">Scendro</h2>
    </div>

            </div>
            <p className="text-sm text-gray-400 max-w-sm">
              Scendro is your undetectable AI-powered assistant for trading, forecasting, and real-time portfolio intelligence.
            </p>
            <div className="flex items-center gap-4 mt-4 text-lg">
              <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors"><FaXTwitter /></a>
              <a href="https://www.instagram.com/scendro.ai/" target="_blank" rel="noreferrer" className="text-lg hover:text-pink-500 transition-colors"><FaInstagram /></a>
            </div>
            <div className="mt-3 flex items-center text-xs text-white gap-1">
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
  </span>
  <span className="text-green-400">All systems online</span>
</div>

            <p className="text-[10px] mt-1 text-gray-600">© {new Date().getFullYear()} StockScope. All rights reserved.</p>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-2">Legal</h3>
            <ul className="space-y-1 text-sm">
              <li><Link to="/refund" className="hover:text-white transition-colors">Refund Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/cancel" className="hover:text-white transition-colors">Cancellation Policy</Link></li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-2">Links</h3>
            <ul className="space-y-1 text-sm">
              <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Get Started</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Log in to Scendro</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
