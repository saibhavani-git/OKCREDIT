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
  const [reloadTick, setReloadTick] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");
  const [form, setForm] = useState({
    cardId: "",
    category: "shopping",
    intent: "manual-entry",
    transactionDate: new Date().toISOString().slice(0, 10),
    amount: "",
    cashback: "",
    rewardsValue: "",
    perksValue: "",
  });

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
        if (!form.cardId && Array.isArray(summaryData.userCards) && summaryData.userCards.length > 0) {
          setForm((prev) => ({ ...prev, cardId: String(summaryData.userCards[0]._id) }));
        }
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filterCardId, reloadTick]);

  const onChangeForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitTransaction = async (e) => {
    e.preventDefault();
    setSubmitMsg("");
    setError(null);
    if (!form.cardId) {
      setError("Please select a card");
      return;
    }
    const amountNum = Number(form.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setSubmitting(true);
    try {
      const card = userCards.find((c) => String(c._id) === String(form.cardId));
      const cashbackNum = Number(form.cashback) || 0;
      const rewardsValueNum = Number(form.rewardsValue) || 0;
      const perksValueNum = Number(form.perksValue) || 0;
      const totalBenefit = cashbackNum + rewardsValueNum + perksValueNum;

      const res = await fetch("/api/transactions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: form.cardId,
          cardName: card?.cardName || "",
          amount: amountNum,
          intent: form.intent || "manual-entry",
          transactionDate: form.transactionDate || undefined,
          resolvedCategory: form.category,
          cashback: cashbackNum,
          rewards: 0,
          rewardsValue: rewardsValueNum,
          perksValue: perksValueNum,
          totalBenefit,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to record transaction");

      setSubmitMsg("Transaction added successfully.");
      setForm((prev) => ({
        ...prev,
        amount: "",
        cashback: "",
        rewardsValue: "",
        perksValue: "",
      }));
      setReloadTick((x) => x + 1);
    } catch (err) {
      setError(err.message || "Failed to add transaction");
    } finally {
      setSubmitting(false);
    }
  };

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
        <form
          onSubmit={submitTransaction}
          className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-4 sm:p-5 mb-6"
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
              Add transaction
            </h2>
            {submitMsg ? <p className="text-xs text-emerald-400">{submitMsg}</p> : null}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              value={form.cardId}
              onChange={(e) => onChangeForm("cardId", e.target.value)}
              className="bg-gray-950/70 border border-gray-700/60 rounded-xl px-3 py-2 text-sm text-gray-200"
              required
            >
              <option value="">Select card</option>
              {userCards.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.cardName}
                </option>
              ))}
            </select>

            <select
              value={form.category}
              onChange={(e) => onChangeForm("category", e.target.value)}
              className="bg-gray-950/70 border border-gray-700/60 rounded-xl px-3 py-2 text-sm text-gray-200"
            >
              <option value="shopping">Shopping</option>
              <option value="travel">Travel</option>
              <option value="dining">Dining</option>
              <option value="fuel">Fuel</option>
              <option value="groceries">Groceries</option>
            </select>

            <input
              type="number"
              min="1"
              step="0.01"
              value={form.amount}
              onChange={(e) => onChangeForm("amount", e.target.value)}
              placeholder="Amount (₹)"
              className="bg-gray-950/70 border border-gray-700/60 rounded-xl px-3 py-2 text-sm text-gray-200"
              required
            />

            <input
              type="date"
              value={form.transactionDate}
              onChange={(e) => onChangeForm("transactionDate", e.target.value)}
              className="bg-gray-950/70 border border-gray-700/60 rounded-xl px-3 py-2 text-sm text-gray-200"
            />

            <input
              type="text"
              value={form.intent}
              onChange={(e) => onChangeForm("intent", e.target.value)}
              placeholder="Intent (e.g. grocery-bills)"
              className="bg-gray-950/70 border border-gray-700/60 rounded-xl px-3 py-2 text-sm text-gray-200"
            />

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.cashback}
              onChange={(e) => onChangeForm("cashback", e.target.value)}
              placeholder="Cashback ₹ (optional)"
              className="bg-gray-950/70 border border-gray-700/60 rounded-xl px-3 py-2 text-sm text-gray-200"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.rewardsValue}
              onChange={(e) => onChangeForm("rewardsValue", e.target.value)}
              placeholder="Rewards value ₹ (optional)"
              className="bg-gray-950/70 border border-gray-700/60 rounded-xl px-3 py-2 text-sm text-gray-200"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.perksValue}
              onChange={(e) => onChangeForm("perksValue", e.target.value)}
              placeholder="Perks value ₹ (optional)"
              className="bg-gray-950/70 border border-gray-700/60 rounded-xl px-3 py-2 text-sm text-gray-200"
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl px-4 py-2 text-sm font-semibold bg-emerald-500/90 hover:bg-emerald-400 text-black disabled:opacity-60"
            >
              {submitting ? "Adding..." : "Add Transaction"}
            </button>
          </div>
        </form>

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
