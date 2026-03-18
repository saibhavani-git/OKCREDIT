"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const RUPEE = "\u20B9";
const fmt = (n) =>
  `${RUPEE}${(Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function TransactionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [userCards, setUserCards] = useState([]);
  const [filterCardId, setFilterCardId] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [txRes, summaryRes] = await Promise.all([
          fetch(
            `/api/transactions?${filterCardId ? `cardId=${filterCardId}&` : ""}limit=200`,
            { credentials: "include" }
          ),
          fetch("/api/transactions/summary", { credentials: "include" }),
        ]);
        const txData = await txRes.json();
        const summaryData = await summaryRes.json();
        if (!txRes.ok) throw new Error(txData.message || "Failed to load transactions");
        setTransactions(Array.isArray(txData.transactions) ? txData.transactions : []);
        setUserCards(Array.isArray(summaryData.userCards) ? summaryData.userCards : []);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filterCardId]);

  return (
    <div className="min-h-screen bg-black">
      <div className="bg-black/95 backdrop-blur-xl border-b border-gray-900/50 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                Transactions
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                All your recorded card payments and rewards
              </p>
            </div>
            {userCards.length > 0 && (
              <select
                value={filterCardId}
                onChange={(e) => setFilterCardId(e.target.value)}
                className="bg-gray-900/80 border border-gray-700/60 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gray-600"
              >
                <option value="">All cards</option>
                {userCards.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.cardName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 text-sm text-red-300 mb-6">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-2 border-gray-600/50 border-t-gray-300 rounded-full animate-spin" />
          </div>
        )}

        {!loading && !error && transactions.length === 0 && (
          <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-10 text-center">
            <p className="text-gray-400">No transactions yet.</p>
            <p className="text-gray-500 text-sm mt-1">
              Use Get Recommendation and &quot;Pay with this card&quot; to record transactions.
            </p>
          </div>
        )}

        {!loading && !error && transactions.length > 0 && (
          <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-800/60">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Card</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Benefit</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr
                      key={String(t._id)}
                      className="border-b border-gray-800/40 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {t.createdAt
                          ? new Date(t.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-200">{t.cardName || "Card"}</td>
                      <td className="px-4 py-3 text-sm text-gray-400 capitalize">
                        {t.resolvedCategory || t.intent || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-100 text-right">
                        {fmt(t.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-emerald-400/90 text-right">
                        {fmt(t.totalBenefit ?? (t.cashback + (t.rewardsValue || 0) + (t.perksValue || 0)))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
