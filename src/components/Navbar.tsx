import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion"; // ✨ Added motion

const Navbar = () => {
  return (
    <nav className="navbar fixed top-0 left-0 w-full z-30 bg-white shadow-md">
      <div className="container mx-auto flex justify-between items-center py-6 px-10">
        <Link to="/" className="text-blue-600 text-3xl font-semibold hover:text-blue-500 transition-all">
          Scendro
        </Link>
        <motion.div className="flex space-x-6" whileHover={{ scale: 1.05 }}>
          <Link to="/portfolio" className="text-gray-700 text-lg hover:text-blue-600 transition-all">Portfolio</Link>
          <Link to="/scenario" className="text-gray-700 text-lg hover:text-blue-600 transition-all">Scenario Sim</Link>
          <Link to="/ai-advisor" className="text-gray-700 text-lg hover:text-blue-600 transition-all">AI Advisor</Link>
          <Link to="/paper-trading" className="text-gray-700 text-lg hover:text-blue-600 transition-all">Paper Trading</Link>
          <Link to="/options" className="text-gray-700 text-lg hover:text-blue-600 transition-all">Options</Link>
        </motion.div>
      </div>
    </nav>
  );
};

export default Navbar;
