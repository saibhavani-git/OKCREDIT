"use client";

import React from "react";

const RUPEE = "\u20B9";

export function fmtRupee(n) {
  return `${RUPEE}${(Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function QuizTopPickHero({ card, quizSummary, onApply }) {
  if (!card) return null;
  const match = Number(card.smartMatchPercent) || 92;
  const boost = Number(card.aiBoostInr) || 0;
  const matchesText = String(
    card.matchesLine || card.rewardRateText || "Strong earn rates for your spend mix"
  ).replace(/\s+/g, " ");
  const why = String(card.whyRankOne || "Top match from your quiz").replace(/\s+/g, " ");
  const sparkles = card.sparkleLine || "Competitive rewards";
  const boostSegment = boost > 0 ? `  [+${fmtRupee(boost)} AI boost]` : "";

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-950/35 via-gray-900/90 to-gray-950 overflow-hidden shadow-xl shadow-amber-950/10">
      <div className="px-5 sm:px-8 pt-7 pb-6 space-y-5">
        <p className="text-amber-100 text-lg sm:text-xl font-bold tracking-tight leading-snug">
          <span className="mr-1" aria-hidden>
            🏆
          </span>
          TOP PICK FOR YOUR QUIZ: <span className="text-white">{card.cardName}</span>
        </p>

        <div className="text-sm sm:text-[15px] leading-relaxed text-gray-200">
          <p>
            <span aria-hidden>💰 </span>
            <span className="text-gray-400">Expected Rewards: </span>
            <span className="font-semibold text-emerald-300">{fmtRupee(card.yearlyRewardInr)}/year</span>
          </p>
          <p className="mt-1 font-mono text-[13px] sm:text-sm text-gray-300 whitespace-pre">
            {`   🎯 ${match}% Smart Match${boostSegment}`}
          </p>
        </div>

        <pre className="text-[13px] sm:text-sm text-gray-300 font-mono whitespace-pre-wrap leading-[1.65] bg-black/40 border border-gray-800/70 rounded-xl px-4 py-4">
          {`   ┌ Your Quiz: "${quizSummary || "Your answers"}"  \n   ├ Matches: ${matchesText}  \n   └ Why #1: ${why}`}
        </pre>

        <p className="text-gray-300 text-sm sm:text-[15px]">
          <span className="mr-1" aria-hidden>
            ✨
          </span>
          {sparkles}
        </p>

        <button
          type="button"
          onClick={onApply}
          className="w-full sm:w-auto px-10 py-3 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black shadow-lg shadow-amber-900/30 transition-all"
        >
          APPLY NOW
        </button>
      </div>
    </div>
  );
}

export function formatRunnerUpLine(rank, cardName, yearlyStr, match) {
  const left = `#${rank} ${cardName}`;
  const padLen = Math.max(4, 34 - left.length);
  return `${left}${" ".repeat(padLen)}💰 ${yearlyStr}  🎯${match}% Match`;
}

export function QuizRunnerUpBlock({ cards, fmt = fmtRupee }) {
  if (!cards?.length) return null;
  const lines = cards.map((card, i) => {
    const rank = i + 2;
    const m = Number(card.smartMatchPercent) || 85;
    return formatRunnerUpLine(rank, card.cardName, fmt(card.yearlyRewardInr), m);
  });
  return (
    <pre className="mt-8 text-[13px] sm:text-sm text-gray-300 font-mono whitespace-pre leading-7">{lines.join("\n")}</pre>
  );
}
