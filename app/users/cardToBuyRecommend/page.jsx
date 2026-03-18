"use client";

import React, { useEffect, useState, useCallback } from "react";
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
              <span className="text-gray-200 font-semibold">{fmt(card.netValue)}</span>
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

function QuizStep({ question, stepIndex, totalSteps, selectedValue, onSelect, onNext, onBack, isFirst, isLast }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6 sm:p-8">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
        Question {stepIndex + 1} of {totalSteps}
      </p>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{question?.label}</h2>
      {question?.description && (
        <p className="text-gray-400 text-sm mb-6">{question.description}</p>
      )}
      <div className="space-y-3">
        {(question?.options || []).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
              selectedValue === opt.value
                ? "border-gray-500/80 bg-gray-700/50 text-white"
                : "border-gray-700/60 bg-gray-800/40 text-gray-300 hover:border-gray-600 hover:bg-gray-800/60"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onBack}
          disabled={isFirst}
          className="px-4 py-2 rounded-xl border border-gray-700/60 text-gray-400 hover:text-white hover:bg-gray-800/60 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={selectedValue == null || selectedValue === ""}
          className="px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          style={{
            background: "linear-gradient(90deg, #888, #fff, #888)",
            color: "#000",
          }}
        >
          {isLast ? "Find my cards" : "Next"}
        </button>
      </div>
    </div>
  );
}

export default function CardToBuyRecommendPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);

  const loadQuestions = useCallback(async () => {
    setLoadingQuestions(true);
    setError(null);
    try {
      const res = await fetch("/api/card-to-buy-quiz", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load questions");
      setQuestions(Array.isArray(data.questions) ? data.questions : []);
      setStep(0);
      setAnswers({});
      setResults(null);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoadingQuestions(false);
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const currentQuestion = questions[step] || null;
  const selectedValue = currentQuestion ? answers[currentQuestion.id] : null;
  const isFirst = step === 0;
  const isLast = step === questions.length - 1;

  const handleSelect = (value) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (selectedValue == null || selectedValue === "") return;
    if (isLast) {
      fetchRecommendations();
      return;
    }
    setStep((s) => Math.min(s + 1, questions.length - 1));
  };

  const handleBack = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  const fetchRecommendations = async () => {
    setLoadingResults(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(answers).forEach(([k, v]) => {
        if (v != null && v !== "") params.set(k, v);
      });
      const res = await fetch(`/api/card-to-buy-quiz/recommend?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to get recommendations");
      setResults({
        chartData: Array.isArray(data.chartData) ? data.chartData : [],
        recommendedCard: data.recommendedCard || null,
        topCards: Array.isArray(data.topCards) ? data.topCards : [],
      });
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoadingResults(false);
    }
  };

  const startOver = () => {
    setStep(0);
    setAnswers({});
    setResults(null);
    setError(null);
  };

  if (loadingQuestions) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
        <div className="w-12 h-12 border-2 border-gray-600/50 border-t-gray-300 rounded-full animate-spin mb-6" />
        <p className="text-white font-medium">Loading quiz...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="bg-black/95 backdrop-blur-xl border-b border-gray-900/50 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => (results ? startOver() : router.push("/users/userCards"))}
              className="flex items-center gap-2 px-3 py-2 bg-gray-900/60 hover:bg-gray-800/60 rounded-xl border border-gray-800/50 text-gray-300 hover:text-white text-sm font-medium transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {results ? "Start over" : "Back"}
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Find a card to buy
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                {results
                  ? "Cards we recommend based on your answers"
                  : "Answer a few questions — we’ll suggest cards you don’t have"}
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

        {!error && results == null && questions.length > 0 && (
          <div className="mb-4 flex gap-2">
            {questions.map((q, i) => (
              <div
                key={q.id}
                className={`h-1.5 flex-1 rounded-full ${
                  i <= step ? "bg-gray-400" : "bg-gray-800/60"
                }`}
                title={q.label}
              />
            ))}
          </div>
        )}

        {!error && results == null && currentQuestion && (
          <QuizStep
            question={currentQuestion}
            stepIndex={step}
            totalSteps={questions.length}
            selectedValue={selectedValue}
            onSelect={handleSelect}
            onNext={handleNext}
            onBack={handleBack}
            isFirst={isFirst}
            isLast={isLast}
          />
        )}

        {!error && loadingResults && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-2 border-gray-600/50 border-t-gray-300 rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Finding cards that match your answers...</p>
          </div>
        )}

        {!error && !loadingResults && results && (
          <div className="space-y-10">
            <section>
              <h2 className="text-lg font-semibold text-white mb-1">Spending profile from your answers</h2>
              <p className="text-sm text-gray-500 mb-4">
                We used this to estimate rewards and fees for each card.
              </p>
              <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
                {results.chartData.length > 0 && (() => {
                  const totalMonthly = results.chartData.reduce((s, d) => s + (d.spend || 0), 0) || 1;
                  const pieStyle = {
                    background: `conic-gradient(${results.chartData
                      .map((d, i) => {
                        const share = (d.spend || 0) / totalMonthly;
                        const start = results.chartData
                          .slice(0, i)
                          .reduce((a, x) => a + (x.spend || 0) / totalMonthly, 0) * 360;
                        const color = CATEGORY_COLORS[d.category] || "#94a3b8";
                        return `${color} ${start}deg ${start + share * 360}deg`;
                      })
                      .join(", ")})`,
                  };
                  return (
                    <div
                      className="w-36 h-36 sm:w-44 sm:h-44 rounded-full shrink-0 border-2 border-gray-700/50"
                      style={pieStyle}
                    />
                  );
                })()}
                <div className="flex-1 w-full space-y-2">
                  {(results.chartData || []).map((d) => (
                    <div key={d.category} className="flex justify-between text-sm">
                      <span className="text-gray-400 capitalize">{d.label}</span>
                      <span className="text-gray-200">
                        {d.share?.toFixed(1)}% · {fmt(d.spend)}/mo
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-1">Recommended for you</h2>
              <p className="text-sm text-gray-500 mb-6">
                Only cards you don’t already have. Ranked by estimated net value.
              </p>

              {!results.topCards?.length ? (
                <p className="text-gray-500 text-sm">No matching cards right now. Try different answers.</p>
              ) : (
                <div className="space-y-4">
                  {results.topCards[0] && <CardTile card={results.topCards[0]} rank={0} />}
                  {results.topCards.length > 1 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                        Other cards to consider
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {results.topCards.slice(1, 5).map((card, i) => (
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

        {!error && !loadingResults && results == null && questions.length === 0 && !loadingQuestions && (
          <p className="text-gray-500 text-center py-8">No questions available. Try again later.</p>
        )}
      </div>
    </div>
  );
}
