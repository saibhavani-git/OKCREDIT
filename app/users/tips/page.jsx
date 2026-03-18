"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const CATEGORY_LABELS = {
  groceries: "Groceries",
  dining: "Dining",
  shopping: "Shopping",
  travel: "Travel",
  fuel: "Fuel",
  others: "Others",
};

export default function TipsPage() {
  const router = useRouter();
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [ragLogs, setRagLogs] = useState([]);
  const autoRefreshDone = useRef(false);

  const loadTips = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/youtube/tips", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load tips");
      setTips(Array.isArray(data.tips) ? data.tips : []);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setTips([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshFromYouTube = async () => {
    setRefreshing(true);
    setError(null);
    setRagLogs([]);
    try {
      const res = await fetch("/api/youtube/rag", { cache: "no-store" });
      const data = await res.json();
      setRagLogs(Array.isArray(data.logs) ? data.logs : []);
      if (!res.ok) throw new Error(data.message || "Failed to refresh from YouTube");
      setTips(Array.isArray(data.tips) ? data.tips : []);
      if (data.logs?.length && Array.isArray(data.tips) && data.tips.length === 0) {
        setError(data.message || "No tips extracted. Some videos may have no captions.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTips();
  }, []);

  useEffect(() => {
    if (loading || refreshing || autoRefreshDone.current || tips.length > 0) return;
    autoRefreshDone.current = true;
    refreshFromYouTube();
  }, [loading, tips.length]);

  const byCategory = tips.reduce((acc, t) => {
    const cat = t.category || "others";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});
  const order = ["shopping", "travel", "fuel", "dining", "groceries", "others"];

  return (
    <div className="min-h-screen bg-black">
      <div className="bg-black/95 backdrop-blur-xl border-b border-gray-900/50 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => router.push("/users/userCards")}
              className="flex items-center gap-2 px-3 py-2 bg-gray-900/60 hover:bg-gray-800/60 rounded-xl border border-gray-800/50 text-gray-300 hover:text-white text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <div className="flex-1">
              <h1
                className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                style={{
                  background: "linear-gradient(90deg, #888, #fff, #888)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Credit Card Tips
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Tips extracted from YouTube — maximize rewards
              </p>
            </div>
            <button
              type="button"
              onClick={refreshFromYouTube}
              disabled={refreshing}
              className="px-4 py-2 rounded-xl border border-gray-600 bg-gray-900/80 text-gray-300 hover:bg-gray-800 hover:text-white text-sm font-medium disabled:opacity-50"
            >
              {refreshing ? "Refreshing from YouTube…" : "Refresh from YouTube"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-800/50 rounded-xl p-4 text-sm text-red-300">
            <p>{error}</p>
            {ragLogs.length > 0 && (
              <div className="mt-3 pt-3 border-t border-red-800/40">
                <p className="text-red-400/80 text-xs font-medium uppercase tracking-wider mb-1">Logs</p>
                <ul className="text-red-400/70 text-xs font-mono space-y-0.5 max-h-32 overflow-y-auto">
                  {ragLogs.map((line, i) => (
                    <li key={i}>{String(line)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {loading && !refreshing && (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-2 border-gray-600/50 border-t-gray-300 rounded-full animate-spin" />
          </div>
        )}

        {!loading && !refreshing && tips.length === 0 && (
          <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-10">
            <p className="text-gray-400 text-center">No tips yet.</p>
            <p className="text-gray-500 text-sm mt-1 text-center">
              Click &quot;Refresh from YouTube&quot; to try again. Requires YOUTUBE_API_KEY and GEMINI_API_KEY (or OPENAI_API_KEY) in .env.
            </p>
            {ragLogs.length > 0 && !error && (
              <div className="mt-6 pt-6 border-t border-gray-800/60">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">What happened (logs)</p>
                <ul className="text-gray-500 text-xs font-mono space-y-1 max-h-48 overflow-y-auto">
                  {ragLogs.map((line, i) => (
                    <li key={i}>{String(line)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {refreshing && (
          <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-10 text-center">
            <div className="w-10 h-10 border-2 border-gray-600/50 border-t-gray-300 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-300 font-medium">Extracting tips from YouTube…</p>
            <p className="text-gray-500 text-sm mt-1">Searching videos, fetching transcripts, and extracting tips. This may take up to a minute.</p>
          </div>
        )}

        {!loading && tips.length > 0 && (
          <div className="space-y-8">
            {order.map((cat) => {
              const list = byCategory[cat];
              if (!list?.length) return null;
              return (
                <section key={cat}>
                  <h2 className="text-lg font-semibold text-white mb-3 capitalize">
                    {CATEGORY_LABELS[cat] || cat}
                  </h2>
                  <ul className="space-y-2">
                    {list.map((t, i) => (
                      <li
                        key={`${cat}-${i}`}
                        className="bg-gray-900/60 border border-gray-800/60 rounded-xl px-4 py-3 text-gray-200 text-sm"
                      >
                        {t.tip}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
