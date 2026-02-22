'use client'
import React, { useState } from "react"
import { useRouter } from "next/navigation"

const Recommend = () => {
  const [amount, setAmount] = useState('')
  const [intent, setIntent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  // Intent options based on spending categories and card types
  const intents = [
  { value: '', label: 'Select Your Primary Need' },

  { value: 'daily-expenses', label: 'Manage Daily Expenses' },
  { value: 'online-shopping', label: 'Online Shopping & E-commerce' },
  { value: 'travel-bookings', label: 'Travel & Flight Bookings' },
  { value: 'fuel-savings', label: 'Fuel & Commute Expenses' },
  { value: 'dining-lifestyle', label: 'Dining & Lifestyle Benefits' },
  { value: 'grocery-bills', label: 'Groceries & Supermarkets' },
  { value: 'build-credit', label: 'Build or Improve Credit Score' },
  { value: 'high-rewards', label: 'Maximize Rewards & Offers' },
  { value: 'business-expenses', label: 'Business or Professional Expenses' },
  { value: 'low-interest', label: 'Low Interest / EMI Needs' }
];

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
                  className="text-5xl font-extrabold tracking-tight"
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

              {/* Intent Selection */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Intent / Card Type *
                </label>
                <select
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  required
                  className="w-full bg-gray-950/50 border border-gray-800/50 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:border-gray-700/50"
                >
                  {intents.map((intentOption) => (
                    <option key={intentOption.value} value={intentOption.value} className="bg-gray-900">
                      {intentOption.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  disabled={!amount || !intent || loading}
                  className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none disabled:cursor-not-allowed"
                  style={{
                    background: (!amount || !intent || loading)
                      ? "linear-gradient(90deg, #b5a5a5, #9b8b8b, #918888)"
                      : "linear-gradient(90deg, #a7aaab, #8f8c8c, #838e90)",
                    color: (!amount || !intent || loading) ? "#292626" : "#000",
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

