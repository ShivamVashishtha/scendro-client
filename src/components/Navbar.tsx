import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="navbar fixed top-0 left-0 w-full z-30 bg-transparent shadow-md backdrop-blur-md">
      <div className="container mx-auto flex justify-between items-center py-4 px-8">
        <Link to="/" className="text-white text-3xl font-semibold hover:text-pink-400 transition-all">
          Scendro
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
