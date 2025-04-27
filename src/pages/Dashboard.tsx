export default function Dashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6 bg-gray-900 text-white">
      <h1 className="text-4xl md:text-6xl font-bold mb-6 text-blue-400">
        Welcome to Scendro
      </h1>
      <p className="text-lg md:text-2xl text-gray-400 mb-8">
        Smarter investing, powered by AI-driven simulations and real-time analytics.
      </p>
      <a href="/portfolio" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-lg transition">
        Explore Portfolio Map
      </a>
    </div>
  );
}
