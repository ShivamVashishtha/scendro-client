// Dashboard.tsx
export default function Dashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6 bg-gradient-x text-white overflow-hidden relative">
      {/* Background Gradient Animation */}
      <div className="absolute inset-0 z-0 bg-gradient-x opacity-60"></div>

      {/* Title with Hover Effect */}
      <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600 mb-8 transform transition duration-500 ease-in-out hover:scale-110 hover:rotate-3">
        Welcome to Scendro
      </h1>

      {/* Subheading with animated floating effect */}
      <p className="text-xl md:text-2xl text-gray-300 mb-10 transform transition duration-500 ease-in-out hover:scale-105 hover:translate-y-2 opacity-90">
        Smarter investing, powered by AI-driven simulations and real-time analytics.
      </p>

      {/* Glowing Button with Hover Effects */}
      <a 
        href="/portfolio" 
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full text-lg transition transform hover:scale-110 hover:shadow-neon hover:rotate-1 duration-300 ease-in-out"
      >
        Explore Portfolio Map
      </a>

      {/* Pulsing Animated Background Element */}
      <div className="absolute inset-0 z-[-1] bg-pink-500 rounded-full opacity-10 animate-ping"></div>

      {/* Floating Particles */}
      <div className="absolute inset-0 z-[-2] pointer-events-none">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
      </div>

      {/* Animated Outline Effect */}
      <div className="absolute inset-0 border-4 border-white rounded-xl opacity-40 animate-pulse"></div>
    </div>
  );
}
