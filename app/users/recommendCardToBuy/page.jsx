"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const RUPEE = "\u20B9";
const CATEGORY_COLORS = {
  travel: "#4ade80",
  fuel: "#f97316",
  dining: "#22d3ee",
  groceries: "#a855f7",
  shopping: "#eab308",
};

const fmt = (n) =>
  `${RUPEE}${(Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function CardTile({ card, rank, compact = false }) {
  const isTop = rank === 0;
  return (
    <div
      className={`rounded-2xl border bg-gray-900/80 overflow-hidden ${
        isTop ? "border-gray-600/60 ring-1 ring-gray-500/20" : "border-gray-800/60"
      } ${compact ? "p-4" : "p-6"}`}
    >
      {isTop && (
        <div className="bg-gray-800/80 text-gray-200 text-xs font-semibold uppercase tracking-wider px-6 py-2 border-b border-gray-700/50">
          Our top pick
        </div>
      )}
      <div className={compact ? "space-y-2" : "space-y-4"}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">{card.bank}</p>
            <h3 className={`font-bold text-white ${compact ? "text-base" : "text-xl"}`}>
              {card.cardName}
            </h3>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] bg-gray-800/80 text-gray-300 border border-gray-700/50">
              {card.cardType || card.rewardType}
            </span>
          </div>
          {!compact && (
            <div className="text-right">
              <p className="text-[11px] text-gray-500">Est. yearly value</p>
              <p className="text-lg font-bold text-gray-200">{fmt(card.netValue)}</p>
            </div>
          )}
        </div>
        <div className={`grid grid-cols-2 gap-2 text-sm ${compact ? "text-xs" : ""}`}>
          <div>
            <span className="text-gray-500">Rewards (yr) </span>
            <span className="text-gray-200 font-medium">{fmt(card.yearlyRewardInr)}</span>
          </div>
          <div>
            <span className="text-gray-500">Annual fee </span>
            <span className="text-gray-200 font-medium">{fmt(card.annualFee)}</span>
          </div>
          {compact && (
            <div className="col-span-2">
              <span className="text-gray-500">Net value </span>
              <span className="text-emerald-400 font-semibold">{fmt(card.netValue)}</span>
            </div>
          )}
        </div>
        {!compact && card.rewardRateText && (
          <div className="pt-2 border-t border-gray-800/60">
            <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-1">Why we recommend it</p>
            <p className="text-gray-400 text-sm">{card.rewardRateText}</p>
          </div>
        )}
        {!compact && Array.isArray(card.perks) && card.perks.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {card.perks.slice(0, 4).map((p, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded bg-gray-800/60 text-[11px] text-gray-400 border border-gray-700/50"
              >
                {String(p).replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecommendCardToBuyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recommendedCard, setRecommendedCard] = useState(null);
  const [topCards, setTopCards] = useState([]);
  const [numMonths, setNumMonths] = useState(1);

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recommend-card-to-buy", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load recommendation");
      setChartData(Array.isArray(data.chartData) ? data.chartData : []);
      setRecommendedCard(data.recommendedCard || null);
      setTopCards(Array.isArray(data.topCards) ? data.topCards : []);
      setNumMonths(data.numMonths || 1);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const totalMonthly = chartData.reduce((s, d) => s + (d.spend || 0), 0) || 1;
  const pieStyle =
    chartData.length > 0
      ? {
          background: `conic-gradient(${chartData
            .map((d, i) => {
              const share = (d.spend || 0) / totalMonthly;
              const start =
                chartData
                  .slice(0, i)
                  .reduce((a, x) => a + (x.spend || 0) / totalMonthly, 0) * 360;
              const color = CATEGORY_COLORS[d.category] || "#94a3b8";
              return `${color} ${start}deg ${start + share * 360}deg`;
            })
            .join(", ")})`,
        }
      : { background: "#374151" };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
        <div className="w-12 h-12 border-2 border-gray-600/50 border-t-gray-300 rounded-full animate-spin mb-6" />
        <p className="text-white font-medium mb-1">Analyzing your spending and comparing cards...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="bg-black/95 backdrop-blur-xl border-b border-gray-900/50 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => router.push("/users/userCards")}
              className="flex items-center gap-2 px-3 py-2 bg-gray-900/60 hover:bg-gray-800/60 rounded-xl border border-gray-800/50 text-gray-300 hover:text-white text-sm font-medium transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <button
              type="button"
              onClick={() => loadRecommendations()}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-gray-900/60 hover:bg-gray-800/60 rounded-xl border border-gray-800/50 text-gray-300 hover:text-white text-sm font-medium disabled:opacity-50 transition-all"
            >
              <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <div>
              <h1
                className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                style={{
                  background: "linear-gradient(90deg, #888, #fff, #888)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Best credit cards for your spending
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                Based on your last {numMonths} month{numMonths !== 1 ? "s" : ""} of transactions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 text-sm text-red-300 mb-6">
            {error}
          </div>
        )}

        {!error && (
          <div className="space-y-10">
            <section>
              <h2 className="text-lg font-semibold text-white mb-1">Your spending breakdown</h2>
              <p className="text-sm text-gray-500 mb-4">
                We use this to estimate rewards for each card.
              </p>
              <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
                <div
                  className="w-36 h-36 sm:w-44 sm:h-44 rounded-full shrink-0 border-2 border-gray-700/50"
                  style={pieStyle}
                />
                <div className="flex-1 w-full space-y-2">
                  {chartData.length === 0 ? (
                    <p className="text-sm text-gray-500">No category data yet. Use your cards to see a breakdown.</p>
                  ) : (
                    chartData.map((d) => (
                      <div key={d.category} className="flex justify-between text-sm">
                        <span className="text-gray-400 capitalize">{d.label}</span>
                        <span className="text-gray-200">
                          {d.share.toFixed(1)}% · {fmt(d.spend)}/mo
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-1">Recommended for you</h2>
              <p className="text-sm text-gray-500 mb-6">
                Ranked by estimated net value (yearly rewards minus annual fee) for your spending.
              </p>

              {topCards.length === 0 ? (
                <p className="text-gray-500 text-sm">No card recommendation available right now.</p>
              ) : (
                <div className="space-y-4">
                  {topCards[0] && <CardTile card={topCards[0]} rank={0} />}
                  {topCards.length > 1 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                        Other cards to consider
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {topCards.slice(1, 3).map((card, i) => (
                          <CardTile key={card._id || i} card={card} rank={i + 1} compact />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
