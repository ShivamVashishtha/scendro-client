import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    navigate("/login");
  };

  const confirmDeleteAccount = () => {
    setDropdownOpen(false);
    setConfirmDelete(true);
  };

  const handleDeleteAccount = async () => {
    const { error } = await supabase.rpc('delete_user', { user_id: user.id }); // safer way
    if (error) {
      toast.error("Failed to delete account");
    } else {
      toast.success("Account deleted");
      navigate("/signup");
    }
  };

  const firstNameLetter = user?.user_metadata?.first_name?.charAt(0)?.toUpperCase() || "U";

  return (
    <nav className="navbar fixed top-0 left-0 w-full z-30 bg-black bg-opacity-80 backdrop-blur-md">
      <div className="container mx-auto flex justify-between items-center py-5 px-8">
        
        {/* Logo */}
        <Link to="/" className="text-blue-400 text-2xl font-bold hover:text-blue-500 transition-all">
          Scendro
        </Link>

        {/* Middle Links */}
        <motion.div className="flex space-x-6" whileHover={{ scale: 1.02 }}>
          <Link to="/portfolio" className="text-white text-md hover:text-blue-400 transition-all">Portfolio</Link>
          <Link to="/scenario" className="text-white text-md hover:text-blue-400 transition-all">Scenario Sim</Link>
          <Link to="/ai-advisor" className="text-white text-md hover:text-blue-400 transition-all">AI Advisor</Link>
          <Link to="/paper-trading" className="text-white text-md hover:text-blue-400 transition-all">Paper Trading</Link>
          <Link to="/options" className="text-white text-md hover:text-blue-400 transition-all">Options</Link>
        </motion.div>

        {/* Right Side */}
        <div className="flex items-center space-x-4 relative">
          {!user ? (
            <>
              <Link to="/login">
                <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-transparent border border-blue-400 text-blue-400 hover:bg-blue-500 hover:text-white transition">
                  Login
                </button>
              </Link>
              <Link to="/signup">
                <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition">
                  Sign Up
                </button>
              </Link>
            </>
          ) : (
            <>
              {/* Avatar */}
              <div 
                className="bg-blue-400 text-black rounded-full w-9 h-9 flex items-center justify-center font-bold cursor-pointer"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {firstNameLetter}
              </div>

              {/* Dropdown */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-12 right-0 w-48 bg-white text-black rounded-lg shadow-lg py-2 z-50"
                  >
                    <div className="px-4 py-2 text-sm font-semibold border-b">
                      {user.user_metadata?.first_name || "User"}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-200 text-sm"
                    >
                      Logout
                    </button>
                    <button
                      onClick={confirmDeleteAccount}
                      className="w-full text-left px-4 py-2 hover:bg-red-100 text-sm text-red-500"
                    >
                      Delete Account
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Confirm Modal */}
              <AnimatePresence>
                {confirmDelete && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                  >
                    <div className="bg-white rounded-lg p-6 w-80 text-center space-y-4">
                      <h2 className="text-lg font-bold">Confirm Deletion</h2>
                      <p className="text-sm text-gray-600">Are you sure you want to delete your account?</p>
                      <div className="flex justify-center gap-4 mt-4">
                        <button 
                          onClick={() => setConfirmDelete(false)}
                          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleDeleteAccount}
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
