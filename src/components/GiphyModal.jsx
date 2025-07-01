// src/components/GiphyModal.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function GiphyModal({ onSelect, onClose }) {
  const [query, setQuery] = useState("funny");
  const [results, setResults] = useState([]);

  const fetchGifs = async (search) => {
    const { data } = await axios.get(
      `https://api.giphy.com/v1/gifs/search?q=${search}&limit=15&api_key=${import.meta.env.VITE_GIPHY_API_KEY}`
    );
    setResults(data.data);
  };

  useEffect(() => {
    fetchGifs(query);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
      <div className="bg-white p-4 rounded-lg w-[90%] max-w-md relative">
        <button onClick={onClose} className="absolute top-2 right-4 text-lg">✖️</button>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchGifs(query)}
          placeholder="Search GIFs..."
          className="w-full border px-3 py-2 rounded mb-4"
        />
        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-scroll">
          {results.map((gif) => (
            <img
              key={gif.id}
              src={gif.images.fixed_height_small.url}
              alt="gif"
              className="cursor-pointer rounded"
              onClick={() => {
                onSelect(gif.images.original.url);
                onClose();
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
