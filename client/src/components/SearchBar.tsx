import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

interface SearchResult {
  _id: string;
  title: string;
  list: {
    _id: string;
    title: string;
    board: { _id: string; title: string } | null;
  } | null;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await api.get(`/cards/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    if (result.list?.board) {
      navigate(`/board/${result.list.board._id}`);
    }
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setOpen(true)}
          placeholder="Search cards..."
          className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-fuchsia-400 transition-colors"
        />
      </div>

      {open && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 max-h-72 overflow-y-auto z-50">
          {loading && (
            <p className="text-sm text-gray-400 text-center py-4">Searching...</p>
          )}
          {!loading && results.length === 0 && query.trim() && (
            <p className="text-sm text-gray-400 text-center py-4">No cards found</p>
          )}
          {!loading &&
            results.map((r) => (
              <button
                key={r._id}
                onClick={() => handleSelect(r)}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-none"
              >
                <p className="text-sm font-medium text-gray-800">{r.title}</p>
                <p className="text-xs text-gray-400">
                  {r.list?.board?.title || "Unknown board"} → {r.list?.title || "Unknown list"}
                </p>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}