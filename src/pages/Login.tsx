import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast"; // ✨ NEW

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      toast.error(error.message); // ✨ Show error toast
    } else {
      toast.success("Logged in successfully!"); // ✨ Show success
      setTimeout(() => navigate("/dashboard"), 1500); // slight delay to show toast
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <form
        onSubmit={handleLogin}
        className="bg-[#1f1f1f] p-10 rounded-xl shadow-lg flex flex-col space-y-6"
      >
        <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>
        <input
          className="p-3 rounded-lg bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="p-3 rounded-lg bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
        >
          Log In
        </button>
      </form>
    </div>
  );
}
