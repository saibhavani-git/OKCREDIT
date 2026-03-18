"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const RUPEE = "\u20B9";
const fmt = (n) =>
  `${RUPEE}${(Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const CATEGORY_COLORS = {
  travel: "#4ade80",
  fuel: "#f97316",
  dining: "#22d3ee",
  groceries: "#a855f7",
  shopping: "#eab308",
};

export default function SavingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [months, setMonths] = useState([]);
  const [lifetime, setLifetime] = useState(null);
  const [userCards, setUserCards] = useState([]);
  const [perCardCategory, setPerCardCategory] = useState([]);
  const [perCardTotals, setPerCardTotals] = useState({});
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [cardTransactions, setCardTransactions] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, txRes] = await Promise.all([
          fetch("/api/transactions/summary", { method: "GET", credentials: "include" }),
          fetch("/api/transactions?limit=10", { method: "GET", credentials: "include" }),
        ]);
        const data = await summaryRes.json();
        const txData = await txRes.json();
        if (!summaryRes.ok) throw new Error(data.message || "Failed to load analysis");
        setMonths(Array.isArray(data.months) ? data.months : []);
        setLifetime(data.lifetime || null);
        setUserCards(Array.isArray(data.userCards) ? data.userCards : []);
        setPerCardCategory(Array.isArray(data.perCardCategory) ? data.perCardCategory : []);
        setPerCardTotals(
          typeof data.perCardTotals === "object" && data.perCardTotals !== null
            ? data.perCardTotals
            : {}
        );
        setRecentTxns(Array.isArray(txData.transactions) ? txData.transactions : []);
        if (data.userCards?.length && !selectedCardId) {
          setSelectedCardId(String(data.userCards[0]._id));
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedCardId) {
      setCardTransactions([]);
      return;
    }
    const loadTxns = async () => {
      try {
        const res = await fetch(`/api/transactions/card/${selectedCardId}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          setCardTransactions([]);
          return;
        }
        setCardTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      } catch {
        setCardTransactions([]);
      }
    };
    loadTxns();
  }, [selectedCardId]);

  const totalByCategory = perCardCategory.reduce((acc, row) => {
    const cat = row.category || "shopping";
    acc[cat] = (acc[cat] || 0) + (row.totalSpend || 0);
    return acc;
  }, {});
  const categoryEntries = Object.entries(totalByCategory).sort(
    (a, b) => (b[1] || 0) - (a[1] || 0)
  );
  const totalForPie = categoryEntries.reduce((s, [, v]) => s + (v || 0), 0) || 1;
  const maxMonthSpend = Math.max(...months.map((m) => m.totalSpend || 0), 1);

  return (
    <div className="min-h-screen bg-black">
      <div className="bg-black/95 backdrop-blur-xl border-b border-gray-900/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/users/userCards")}
              className="flex items-center gap-2 px-3 py-2 bg-gray-900/60 hover:bg-gray-800/60 rounded-xl border border-gray-800/50 text-gray-300 hover:text-white text-sm font-medium transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <div>
              <h1
                className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                style={{
                  background: "linear-gradient(90deg,#888,#fff,#888)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Monthly Analysis & Analytics
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Overview, spending by category, trends and per-card breakdown
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-2 border-gray-600/50 border-t-gray-300 rounded-full animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 text-sm text-red-300 mb-6">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-8">
            {/* Overview */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-900/60 border border-gray-800/60 rounded-xl p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total spend</p>
                  <p className="text-2xl font-bold text-white">{fmt(lifetime?.totalSpend)}</p>
                  <p className="text-xs text-gray-500 mt-1">Lifetime</p>
                </div>
                <div className="bg-gray-900/60 border border-gray-800/60 rounded-xl p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total savings</p>
                  <p className="text-2xl font-bold text-emerald-400">{fmt(lifetime?.totalSavings)}</p>
                  <p className="text-xs text-gray-500 mt-1">Rewards & cashback</p>
                </div>
                <div className="bg-gray-900/60 border border-gray-800/60 rounded-xl p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Savings rate</p>
                  <p className="text-2xl font-bold text-gray-200">
                    {lifetime?.totalSpend > 0
                      ? ((lifetime.totalSavings / lifetime.totalSpend) * 100).toFixed(1)
                      : "0"}%
                  </p>
                </div>
                <div className="bg-gray-900/60 border border-gray-800/60 rounded-xl p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Credit score (est.)</p>
                  <p className="text-2xl font-bold text-indigo-300">
                    {lifetime?.creditScoreEstimate ?? "—"}
                  </p>
                </div>
              </div>
            </section>

            {/* Spending by category (all cards) */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Spending by category (all cards)</h2>
              <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
                {categoryEntries.length > 0 ? (
                  <div
                    className="w-36 h-36 sm:w-44 sm:h-44 rounded-full shrink-0 border-2 border-gray-700/50"
                    style={{
                      background: `conic-gradient(${categoryEntries
                        .map(([cat, spend], i) => {
                          const share = (spend || 0) / totalForPie;
                          const start =
                            categoryEntries
                              .slice(0, i)
                              .reduce((a, [, v]) => a + (v || 0) / totalForPie, 0) * 360;
                          const color = CATEGORY_COLORS[cat] || "#94a3b8";
                          return `${color} ${start}deg ${start + share * 360}deg`;
                        })
                        .join(", ")})`,
                    }}
                  />
                ) : (
                  <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full shrink-0 bg-gray-800/60 border-2 border-gray-700/50" />
                )}
                <div className="flex-1 w-full space-y-2">
                  {categoryEntries.length === 0 ? (
                    <p className="text-sm text-gray-500">No category data yet.</p>
                  ) : (
                    categoryEntries.map(([cat, spend]) => (
                      <div key={cat} className="flex justify-between text-sm">
                        <span className="capitalize text-gray-400" style={{ color: CATEGORY_COLORS[cat] || "#94a3b8" }}>
                          {cat}
                        </span>
                        <span className="text-gray-200">
                          {(((spend || 0) / totalForPie) * 100).toFixed(1)}% · {fmt(spend)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* Monthly trend
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Monthly trend</h2>
              <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6">
                {months.length === 0 ? (
                  <p className="text-gray-500 text-sm">No monthly data yet.</p>
                ) : (
                  <div className="flex items-end gap-2 h-32">
                    {months.slice(0, 12).map((m) => (
                      <div
                        key={`${m.year}-${m.month}`}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <div
                          className="w-full min-h-[4px] rounded-t transition-all"
                          style={{
                            height: `${Math.max(8, ((m.totalSpend || 0) / maxMonthSpend) * 100)}%`,
                            background: "linear-gradient(180deg, #6b7280 0%, #4b5563 100%)",
                          }}
                          title={`${m.label}: ${fmt(m.totalSpend)} spend, ${fmt(m.totalSavings)} saved`}
                        />
                        <span className="text-[10px] text-gray-500 truncate max-w-full">{m.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section> */}

            {/* Per card: selector + detail */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Your cards</h2>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-64 shrink-0">
                  {userCards.length === 0 ? (
                    <p className="text-gray-500 text-sm">No cards yet. Add cards in My Cards.</p>
                  ) : (
                    <div className="space-y-1">
                      {userCards.map((c) => {
                        const isSelected = String(c._id) === String(selectedCardId);
                        const tot = perCardTotals[String(c._id)] || {};
                        return (
                          <button
                            key={c._id}
                            type="button"
                            onClick={() => setSelectedCardId(String(c._id))}
                            className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                              isSelected
                                ? "bg-gray-800/80 border-gray-600 text-white"
                                : "bg-gray-900/50 border-gray-800/60 text-gray-400 hover:border-gray-700 hover:text-gray-200"
                            }`}
                          >
                            <p className="text-sm font-medium truncate">{c.cardName}</p>
                            <p className="text-[11px] text-gray-500 truncate">{c.bank}</p>
                            <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                              <span>Spend {fmt(tot.totalSpend)}</span>
                              <span className="text-emerald-400/80">{fmt(tot.totalSavings)} saved</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {selectedCardId && userCards.find((c) => String(c._id) === String(selectedCardId)) ? (
                    (() => {
                      const card = userCards.find((c) => String(c._id) === String(selectedCardId));
                      const categoriesForCard = perCardCategory.filter(
                        (r) => String(r.cardId) === String(selectedCardId)
                      );
                      const totalSpendFromTxns = cardTransactions.reduce(
                        (s, t) => s + (Number(t.amount) || 0),
                        0
                      );
                      const totalsForCard = perCardTotals[selectedCardId];
                      const totalSpendFromSummary =
                        totalsForCard?.totalSpend ??
                        categoriesForCard.reduce((s, x) => s + (x.totalSpend || 0), 0);
                      const totalSpend = totalSpendFromTxns > 0 ? totalSpendFromTxns : totalSpendFromSummary;
                      const savingsFromTxns = cardTransactions.reduce((s, t) => {
                        const fromTotal = t.totalBenefit;
                        if (typeof fromTotal === "number" && !Number.isNaN(fromTotal)) return s + fromTotal;
                        return (
                          s +
                          (Number(t.cashback) || 0) +
                          (Number(t.rewardsValue) || 0) +
                          (Number(t.perksValue) || 0)
                        );
                      }, 0);
                      const cardTotalSavings =
                        savingsFromTxns > 0 ? savingsFromTxns : totalsForCard?.totalSavings ?? 0;
                      const cardSavingsRate = totalSpend > 0 ? cardTotalSavings / totalSpend : 0;
                      const limit = card?.limitMax ?? 0;
                      const utilisation = limit > 0 ? totalSpend / limit : 0;
                      const creditScore =
                        limit > 0 ? Math.round(300 + (1 - Math.min(utilisation, 1)) * 600) : 300;
                      const sumForPie = totalSpend || 1;
                      return (
                        <div className="bg-gray-900/60 border border-gray-800/60 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-100 mb-1">{card?.cardName ?? "Card"}</h3>
                          <p className="text-sm text-gray-500 mb-4">{card?.bank ?? ""}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                            <div className="bg-gray-950/60 border border-gray-800/60 rounded-xl p-3">
                              <p className="text-[11px] text-gray-500 mb-1">Card Spend</p>
                              <p className="text-base font-bold text-gray-100">{fmt(totalSpend)}</p>
                            </div>
                            <div className="bg-gray-950/60 border border-gray-800/60 rounded-xl p-3">
                              <p className="text-[11px] text-gray-500 mb-1">Card Savings</p>
                              <p className="text-base font-bold text-emerald-300">{fmt(cardTotalSavings)}</p>
                              <p className="text-[10px] text-gray-500 mt-1">
                                Rate: {(cardSavingsRate * 100).toFixed(1)}%
                              </p>
                            </div>
                            <div className="bg-gray-950/60 border border-gray-800/60 rounded-xl p-3">
                              <p className="text-[11px] text-gray-500 mb-1">Card Credit Score</p>
                              <p className="text-lg font-bold text-indigo-300">{creditScore}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 flex-wrap">
                            <div
                              className="w-24 h-24 rounded-full bg-gray-800 overflow-hidden shrink-0"
                              style={{
                                backgroundImage:
                                  categoriesForCard.length > 0
                                    ? `conic-gradient(${categoriesForCard
                                        .map((row, i) => {
                                          const share = (row.totalSpend || 0) / sumForPie;
                                          const start =
                                            categoriesForCard
                                              .slice(0, i)
                                              .reduce((a, r) => a + (r.totalSpend || 0) / sumForPie, 0) * 360;
                                          const color = CATEGORY_COLORS[row.category] || "#94a3b8";
                                          return `${color} ${start}deg ${start + share * 360}deg`;
                                        })
                                        .join(", ")})`
                                    : "linear-gradient(#374151, #374151)",
                              }}
                            />
                            <div className="flex-1 min-w-0 space-y-2">
                              {categoriesForCard.length === 0 ? (
                                <p className="text-sm text-gray-500">No transactions on this card yet.</p>
                              ) : (
                                categoriesForCard.map((row) => (
                                  <div key={row.category} className="flex justify-between text-sm">
                                    <span className="text-gray-400 capitalize">{row.category}</span>
                                    <span className="text-gray-200">
                                      {(((row.totalSpend || 0) / sumForPie) * 100).toFixed(1)}% ·{" "}
                                      {fmt(row.totalSpend)}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                          <div className="mt-4 border-t border-gray-800/60 pt-3">
                            <p className="text-xs font-semibold text-gray-400 mb-2">
                              Recent transactions on this card
                            </p>
                            {cardTransactions.length === 0 ? (
                              <p className="text-xs text-gray-600">No transactions recorded for this card yet.</p>
                            ) : (
                              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {cardTransactions.map((t) => (
                                  <div
                                    key={String(t._id)}
                                    className="flex justify-between text-xs text-gray-300 border-b border-gray-800/40 pb-1 last:border-b-0"
                                  >
                                    <div>
                                      <p className="font-medium">{fmt(t.amount)}</p>
                                      <p className="text-[11px] text-gray-500">
                                        {t.intent} · {t.resolvedCategory}
                                      </p>
                                    </div>
                                    <div className="text-right text-[11px] text-gray-500">
                                      {t.createdAt
                                        ? new Date(t.createdAt).toLocaleDateString("en-IN", {
                                            day: "2-digit",
                                            month: "short",
                                          })
                                        : ""}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="bg-gray-900/60 border border-gray-800/60 rounded-xl p-8 text-center text-gray-500">
                      Select a card to view credit score and category breakdown
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Recent transactions (all) */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Recent transactions</h2>
                <button
                  onClick={() => router.push("/users/transactions")}
                  className="text-sm text-gray-400 hover:text-white font-medium"
                >
                  View all →
                </button>
              </div>
              <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl overflow-hidden">
                {recentTxns.length === 0 ? (
                  <p className="p-6 text-gray-500 text-sm">No transactions yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-800/60">
                    {recentTxns.map((t) => (
                      <li
                        key={String(t._id)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-800/30"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-200">{t.cardName}</p>
                          <p className="text-xs text-gray-500 capitalize">
                            {t.resolvedCategory || t.intent} ·{" "}
                            {t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN") : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">{fmt(t.amount)}</p>
                          <p className="text-xs text-emerald-400">
                            +
                            {fmt(
                              t.totalBenefit ??
                                (t.cashback + (t.rewardsValue || 0) + (t.perksValue || 0))
                            )}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        )}

        {!loading && !error && userCards.length === 0 && (
          <p className="text-gray-500 text-sm">
            No transactions recorded yet. Use the recommendation flow and tap “Pay with this card” to start
            tracking savings.
          </p>
        )}
      </div>
    </div>
  );
}
