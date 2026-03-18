'use client'
import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

// Icons for each category (inline SVG for consistency)
const CategoryIcons = {
  shopping: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  travel: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  fuel: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2h-2m-4-1V9" />
    </svg>
  ),
  dining: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 114 0v5m0 0v13m4-13v13M4 8v13m0-6a2 2 0 114 0M4 8a2 2 0 114 0" />
    </svg>
  ),
  groceries: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
};

const Recommend = () => {
  const [amount, setAmount] = useState('')
  const [intent, setIntent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [intentDropdownOpen, setIntentDropdownOpen] = useState(false)
  const intentDropdownRef = useRef(null)
  const router = useRouter()

  // Intent = category only (limited options) with icons
  const intents = [
    { value: '', label: 'Select category', icon: null },
    { value: 'shopping', label: 'Shopping', icon: CategoryIcons.shopping },
    { value: 'travel', label: 'Travel', icon: CategoryIcons.travel },
    { value: 'fuel', label: 'Fuel', icon: CategoryIcons.fuel },
    { value: 'dining', label: 'Dining', icon: CategoryIcons.dining },
    { value: 'groceries', label: 'Groceries', icon: CategoryIcons.groceries },
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (intentDropdownRef.current && !intentDropdownRef.current.contains(e.target)) {
        setIntentDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || !intent) {
      setError('Please provide amount and select an intent');
      return;
    }

    setLoading(true);
    setError(null);

    // Build query params
    const params = new URLSearchParams();
    params.append('prompt', ''); // Empty prompt since we're not using description
    if (amount) params.append('amount', amount);
    if (intent) params.append('intent', intent);

    // Small delay to show loading state before navigation
    setTimeout(() => {
      router.push(`/users/recommendCards?${params.toString()}`);
    }, 300);
  }
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black/95 backdrop-blur-xl border-b border-gray-900/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/users/userCards')}
                className="flex items-center gap-2 px-3 py-2 bg-gray-900/60 hover:bg-gray-800/60 rounded-xl border border-gray-800/50 text-gray-300 hover:text-white text-sm font-medium transition-all duration-200 hover:scale-105 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>My Cards</span>
              </button>
              <div>
                <h1 
                  className="text-3xl font-extrabold tracking-tight"
                  style={{
                    background: "linear-gradient(90deg, #888, #fff, #888)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Card Recommendations
                </h1>
                <p className="text-gray-500 mt-2 text-sm">Enter transaction amount and select intent to get personalized card recommendations</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Input Form */}
        <div className="mb-12">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="bg-gray-900/60 border border-gray-800/50 rounded-2xl p-6 focus-within:border-gray-700/50 focus-within:ring-1 focus-within:ring-gray-700/20 transition-all space-y-4">
              {/* Amount Input */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Transaction Amount (₹) *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g., 5000"
                  min="0"
                  step="100"
                  required
                  className="w-full bg-gray-950/50 border border-gray-800/50 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gray-700/50"
                />
              </div>

              {/* Intent Selection (with icons) */}
              <div ref={intentDropdownRef} className="relative">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Category *
                </label>
                <button
                  type="button"
                  onClick={() => setIntentDropdownOpen((o) => !o)}
                  className="w-full flex items-center gap-3 bg-gray-950/50 border border-gray-800/50 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:border-gray-700/50 text-left"
                >
                  {intent ? (
                    <>
                      <span className="text-gray-400">
                        {intents.find((i) => i.value === intent)?.icon ?? null}
                      </span>
                      <span>{intents.find((i) => i.value === intent)?.label ?? intent}</span>
                    </>
                  ) : (
                    <span className="text-gray-500">Select category</span>
                  )}
                  <svg
                    className={`w-5 h-5 text-gray-500 ml-auto shrink-0 transition-transform ${intentDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {intentDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-800/50 bg-gray-950 shadow-xl overflow-hidden">
                    {intents.map((opt) => {
                      if (opt.value === '') return null
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setIntent(opt.value)
                            setIntentDropdownOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            intent === opt.value
                              ? 'bg-gray-800/80 text-white'
                              : 'text-gray-300 hover:bg-gray-800/50'
                          }`}
                        >
                          <span className="text-gray-400">{opt.icon}</span>
                          <span>{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  disabled={!amount || !intent || loading}
                  className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(90deg, #888, #fff, #888)",
                    color: "#000",
                  }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Finding Cards...
                    </span>
                  ) : (
                    'Get Recommendations'
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="max-w-3xl mx-auto mt-4 bg-red-900/20 border border-red-800/50 rounded-xl p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

       </div>
       </div>
     
  )
}

export default Recommend

