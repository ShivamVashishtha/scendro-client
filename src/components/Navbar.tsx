import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="navbar p-4 fixed w-full top-0 left-0 z-30">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-3xl font-bold">
          StockScope AI
        </Link>
        <div className="flex space-x-6">
          <Link to="/" className="text-white text-lg hover:text-pink-500 transition-all">Dashboard</Link>
          <Link to="/portfolio" className="text-white text-lg hover:text-pink-500 transition-all">Portfolio</Link>
          <Link to="/scenario" className="text-white text-lg hover:text-pink-500 transition-all">Scenario Sim</Link>
          <Link to="/ai-advisor" className="text-white text-lg hover:text-pink-500 transition-all">AI Advisor</Link>
          <Link to="/paper-trading" className="text-white text-lg hover:text-pink-500 transition-all">Paper Trading</Link>
          <Link to="/options" className="text-white text-lg hover:text-pink-500 transition-all">Options</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
