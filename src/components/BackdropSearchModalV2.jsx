import React, { useState, useEffect } from "react";
import axios from "axios";
import ReactDOM from "react-dom";

export default function BackdropSearchModalV2({ onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const backend = import.meta.env.VITE_BACKEND;

  useEffect(() => {
    const delay = setTimeout(() => {
      if (query.trim()) {
        searchMovies(query);
      } else {
        setResults([]);
      }
    }, 400); // debounce

    return () => clearTimeout(delay);
  }, [query]);

  const searchMovies = async (searchTerm) => {
    try {
      const { data } = await axios.get(`${backend}/api/movies/search?q=${searchTerm}`);
      setResults(data.results || []);
    } catch (err) {
      console.error("Backdrop search error:", err);
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-80 flex items-center justify-center p-4">
      <div className="bg-[#111] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 border border-gray-800 shadow-2xl transition-all duration-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-lg font-bold">Search For a Movie</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Inception"
          className="w-full bg-[#222] text-white p-2 rounded-md mb-4 focus:outline-none"
        />

        {results.length === 0 && query.trim() && (
          <p className="text-center text-gray-500 text-sm">No results found.</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {results.map((movie) => (
            <div
              key={movie.id}
              onClick={() => onSelect(movie)}
              className="cursor-pointer hover:opacity-90"
            >
              <img
                src={movie.poster || "/fallback-poster.jpg"}
                alt={movie.title}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/fallback-poster.jpg";
                }}
                className="rounded-lg w-full object-cover aspect-[2/3]"
              />
              <p className="text-white text-sm mt-2 text-center">
                {movie.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}
