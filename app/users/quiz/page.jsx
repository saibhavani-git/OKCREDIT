"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";
import QuizStep from "../../components/QuizStep";
import { QuizTopPickHero, QuizRunnerUpBlock } from "../../components/QuizRichResult";
import { buildRecommendationPayload } from "../../utils/quizToProfile";

const categoryOptions = [
  {
    value: "shopping",
    label: "Shopping",
    icon: <span aria-hidden>🛍️</span>,
  },
  {
    value: "travel",
    label: "Travel",
    icon: <span aria-hidden>✈️</span>,
  },
  {
    value: "dining",
    label: "Dining",
    icon: <span aria-hidden>🍽️</span>,
  },
  {
    value: "fuel",
    label: "Fuel",
    icon: <span aria-hidden>⛽</span>,
  },
  {
    value: "groceries",
    label: "Groceries",
    icon: <span aria-hidden>🛒</span>,
  },
];

const rewardOptions = [
  { value: "cashback", label: "Cashback", icon: <span aria-hidden>💸</span> },
  { value: "points", label: "Reward Points", icon: <span aria-hidden>🎁</span> },
  { value: "travel", label: "Travel Benefits", icon: <span aria-hidden>🌍</span> },
];

const feeOptions = [
  { value: "yes", label: "Yes", subtitle: "I can pay if value is high", icon: <span aria-hidden>✅</span> },
  { value: "no", label: "No", subtitle: "Prefer low or zero annual fee", icon: <span aria-hidden>🚫</span> },
];

const painPointOptions = [
  { value: "low cashback", label: "Low cashback", icon: <span aria-hidden>📉</span> },
  { value: "no travel benefits", label: "No travel benefits", icon: <span aria-hidden>🧳</span> },
  { value: "hidden charges", label: "Hidden charges", icon: <span aria-hidden>⚠️</span> },
];

const totalSteps = 5;
const RUPEE = "\u20B9";
const fmt = (n) =>
  `${RUPEE}${(Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({
    primaryCategory: "",
    secondaryCategories: [],
    rewardPreference: "",
    feePreference: "",
    painPoint: "",
  });

  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(answers.primaryCategory);
    if (step === 2) return true;
    if (step === 3) return Boolean(answers.rewardPreference);
    if (step === 4) return Boolean(answers.feePreference);
    if (step === 5) return Boolean(answers.painPoint);
    return false;
  }, [step, answers]);

  const updateSingle = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSecondary = (value) => {
    setAnswers((prev) => {
      const exists = prev.secondaryCategories.includes(value);
      return {
        ...prev,
        secondaryCategories: exists
          ? prev.secondaryCategories.filter((v) => v !== value)
          : [...prev.secondaryCategories, value],
      };
    });
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = buildRecommendationPayload(answers, 10000);
      const res = await fetch("/api/recommend", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to get recommendations");
      setResult({
        quizSummary: data.quizSummary || "",
        topCards: Array.isArray(data.topCards) ? data.topCards : [],
        feeFilterRelaxed: Boolean(data.feeFilterRelaxed),
      });
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black px-4 py-8 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/users/userCards")}
            className="px-3 py-2 rounded-xl border border-gray-800/60 text-gray-300 hover:text-white hover:bg-gray-900/60 text-sm"
          >
            Back
          </button>
          <h1
            className="text-xl sm:text-2xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(90deg, #888, #fff, #888)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Smart Card Assistant Quiz
          </h1>
        </div>

        {!result && (
          <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-5 sm:p-6 space-y-6 transition-all duration-300">
            <ProgressBar currentStep={step} totalSteps={totalSteps} />

            {step === 1 && (
              <QuizStep
                title="Which describes you best?"
                subtitle="Primary lifestyle category gets +40 weight."
                options={categoryOptions}
                selectedValue={answers.primaryCategory}
                onSelect={(value) => updateSingle("primaryCategory", value)}
              />
            )}
            {step === 2 && (
              <QuizStep
                title="What else do you spend on regularly?"
                subtitle="Optional — each selected gets +20 weight. Cards you already own are never recommended."
                options={categoryOptions}
                selectedValues={answers.secondaryCategories}
                onSelect={toggleSecondary}
                multi
              />
            )}
            {step === 3 && (
              <QuizStep
                title="What matters more to you?"
                options={rewardOptions}
                selectedValue={answers.rewardPreference}
                onSelect={(value) => updateSingle("rewardPreference", value)}
              />
            )}
            {step === 4 && (
              <QuizStep
                title="Are you okay paying an annual fee?"
                options={feeOptions}
                selectedValue={answers.feePreference}
                onSelect={(value) => updateSingle("feePreference", value)}
              />
            )}
            {step === 5 && (
              <QuizStep
                title="What frustrates you the most?"
                options={painPointOptions}
                selectedValue={answers.painPoint}
                onSelect={(value) => updateSingle("painPoint", value)}
              />
            )}

            {error ? <p className="text-red-400 text-sm">{error}</p> : null}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1 || submitting}
                className="px-4 py-2 rounded-xl border border-gray-800/60 text-gray-300 disabled:opacity-40"
              >
                Previous
              </button>
              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
                  disabled={!canContinue || submitting}
                  className="px-5 py-2 rounded-xl font-semibold disabled:opacity-50"
                  style={{ background: "linear-gradient(90deg,#888,#fff,#888)", color: "#000" }}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitQuiz}
                  disabled={!canContinue || submitting}
                  className="px-5 py-2 rounded-xl font-semibold disabled:opacity-50"
                  style={{ background: "linear-gradient(90deg,#888,#fff,#888)", color: "#000" }}
                >
                  {submitting ? "Generating..." : "Get Recommendation"}
                </button>
              )}
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {result.feeFilterRelaxed ? (
              <p className="text-amber-200/90 text-sm bg-amber-950/30 border border-amber-900/40 rounded-xl px-4 py-3">
                No annual-fee cards left in the “new to you” list; showing the next best options (may include paid
                cards).
              </p>
            ) : null}

            {result.topCards?.length ? (
              <div>
                <QuizTopPickHero
                  card={result.topCards[0]}
                  quizSummary={result.quizSummary}
                  onApply={() => router.push("/users/addCards")}
                />
                <QuizRunnerUpBlock cards={result.topCards.slice(1, 3)} />
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">No recommendations available.</p>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setStep(1);
                  setAnswers({
                    primaryCategory: "",
                    secondaryCategories: [],
                    rewardPreference: "",
                    feePreference: "",
                    painPoint: "",
                  });
                }}
                className="px-4 py-2 rounded-xl border border-gray-800/60 text-gray-300 hover:text-white hover:bg-gray-900/60 text-sm"
              >
                Retake quiz
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
