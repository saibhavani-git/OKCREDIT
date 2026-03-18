// 'use client'
// import React, { Suspense, useEffect, useState } from "react"
// import { useRouter, useSearchParams } from "next/navigation"

// const RUPEE = "\u20B9"
// const DOT = "\u2022"

// const RecommendCardsContent = () => {
//   const [loading, setLoading] = useState(true)
//   const [recommendedCards, setRecommendedCards] = useState([])
//   const [error, setError] = useState(null)
//   const [selectedCard, setSelectedCard] = useState(null)
//   const [recommendationMessage, setRecommendationMessage] = useState(null)

//   const router = useRouter()
//   const searchParams = useSearchParams()
//   const amount = searchParams.get("amount")
//   const intent = searchParams.get("intent")

//   useEffect(() => {
//     if (!amount || !intent) {
//       setLoading(false)
//       setError("Amount and intent are required")
//       return
//     }

//     const fetchRecommendations = async () => {
//       setLoading(true)
//       setError(null)
//       setRecommendedCards([])

//       try {
//         const res = await fetch("/api/getrecommendation", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ amount, intent }),
//         })

//         const data = await res.json()
//         if (!res.ok) throw new Error(data.message || "Failed to get recommendation")

//         const cards = Array.isArray(data.cards) ? data.cards.slice(0, 3) : []
//         setRecommendedCards(cards)
//         if (data.message) setRecommendationMessage(data.message)
//       } catch (err) {
//         console.error(err)
//         setError(err.message || "Something went wrong")
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchRecommendations()
//   }, [amount, intent])

//   const rewardLabel = (rewardType) =>
//     rewardType === "points" ? "Reward Points" : rewardType === "miles" ? "Miles" : "Rewards"

//   const rewardUnit = (rewardType) =>
//     rewardType === "points" ? "pts" : rewardType === "miles" ? "miles" : ""

//   return (
//     <div className="min-h-screen bg-black">
//       <div className="bg-black/95 backdrop-blur-xl border-b border-gray-900/50 sticky top-0 z-40">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <div className="flex items-center gap-4">
//             <button
//               onClick={() => router.push("/users/recommend")}
//               className="flex items-center gap-2 px-3 py-2 bg-gray-900/60 hover:bg-gray-800/60 rounded-xl border border-gray-800/50 text-gray-300 hover:text-white text-sm font-medium transition-all duration-200"
//             >
//               <span>Back</span>
//             </button>
//             <div>
//               <h1
//                 className="text-3xl font-extrabold tracking-tight"
//                 style={{
//                   background: "linear-gradient(90deg, #888, #fff, #888)",
//                   WebkitBackgroundClip: "text",
//                   WebkitTextFillColor: "transparent",
//                 }}
//               >
//                 Top 3 Recommended Cards
//               </h1>
//               <p className="text-gray-500 mt-2 text-sm">Based on your amount and intent</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {loading && (
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-gray-400">
//           Finding Perfect Cards for You...
//         </div>
//       )}

//       {error && !loading && (
//         <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//           <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-6">
//             <h3 className="text-lg font-semibold text-red-400 mb-2">Error Loading Recommendations</h3>
//             <p className="text-red-300 text-sm">{error}</p>
//           </div>
//         </div>
//       )}

//       {!loading && recommendedCards.length > 0 && (
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//           {recommendationMessage && (
//             <div className="max-w-3xl mx-auto mb-8 bg-blue-900/20 border border-blue-800/50 rounded-xl p-4">
//               <p className="text-blue-300 text-sm text-center">{recommendationMessage}</p>
//             </div>
//           )}

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {recommendedCards.map((card, index) => (
//               <div
//                 key={card._id || index}
//                 onClick={() => setSelectedCard(card)}
//                 className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all cursor-pointer"
//               >
//                 <div className="mb-4">
//                   <h3 className="text-xl font-bold text-gray-200 mb-2">{card.cardName}</h3>
//                   <div className="flex items-center gap-2 text-sm text-gray-400">
//                     <span>{card.bank}</span>
//                     <span>{DOT}</span>
//                     <span>{card.cardType}</span>
//                     <span>{DOT}</span>
//                     <span>{card.network}</span>
//                   </div>
//                 </div>

//                 <div className="mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
//                   <p className="text-xs text-gray-400 mb-1">Total Benefit</p>
//                   <p className="text-2xl font-bold text-gray-100">
//                     {RUPEE}{(card.totalBenefit || 0).toFixed(2)}
//                   </p>
//                 </div>

//                 <div className="space-y-2 mb-4">
//                   <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
//                     <span className="text-sm text-gray-400">Cashback</span>
//                     <span className="text-sm font-semibold text-gray-200">{RUPEE}{(card.cashback || 0).toFixed(2)}</span>
//                   </div>
//                   <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
//                     <span className="text-sm text-gray-400">{rewardLabel(card.rewardType)}</span>
//                     <span className="text-sm font-semibold text-gray-200">
//                       {(card.rewards || 0).toFixed(2)} {rewardUnit(card.rewardType)}
//                     </span>
//                   </div>
//                   <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
//                     <span className="text-sm text-gray-400">Rewards Value</span>
//                     <span className="text-sm font-semibold text-gray-200">{RUPEE}{(card.rewardsValue || 0).toFixed(2)}</span>
//                   </div>
//                 </div>

//                 {Array.isArray(card.perks) && card.perks.length > 0 && (
//                   <div className="mb-4">
//                     <p className="text-xs text-gray-500 mb-2">Perks:</p>
//                     <div className="flex flex-wrap gap-2">
//                       {card.perks.map((perk, idx) => (
//                         <span key={idx} className="px-2 py-1 bg-gray-800/50 text-gray-300 text-xs rounded border border-gray-700/50">
//                           {perk.replace(/_/g, " ")}
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 <div className="pt-4 border-t border-gray-800/50">
//                   <div className="flex justify-between text-xs text-gray-500">
//                     <div>
//                       <span className="block mb-1">Reward Rate</span>
//                       <span className="text-gray-300">{card.rewardRateText || "N/A"}</span>
//                     </div>
//                     <div className="text-right">
//                       <span className="block mb-1">Limit</span>
//                       <span className="text-gray-300">{RUPEE}{(card.limits?.max || card.maxLimit || 0).toLocaleString("en-IN")}</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {!loading && !error && recommendedCards.length === 0 && (
//         <div className="text-center py-16">
//           <h3 className="text-xl font-bold text-gray-200 mb-2">No recommendations yet</h3>
//           <p className="text-gray-500 text-sm">Enter amount and intent to get top 3 card recommendations</p>
//         </div>
//       )}

//       {selectedCard && (
//         <div
//           className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
//           onClick={() => setSelectedCard(null)}
//         >
//           <div
//             className="bg-gray-950 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-800/50"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="p-6 border-b border-gray-800/50">
//               <h2 className="text-2xl font-bold text-white">{selectedCard.cardName}</h2>
//               <p className="text-gray-400 mt-1">{selectedCard.bank} {DOT} {selectedCard.cardType} {DOT} {selectedCard.network}</p>
//             </div>
//             <div className="p-6 space-y-3 text-sm">
//               <div className="flex justify-between"><span className="text-gray-400">Total Benefit</span><span className="text-white font-semibold">{RUPEE}{(selectedCard.totalBenefit || 0).toFixed(2)}</span></div>
//               <div className="flex justify-between"><span className="text-gray-400">Cashback</span><span className="text-white font-semibold">{RUPEE}{(selectedCard.cashback || 0).toFixed(2)}</span></div>
//               <div className="flex justify-between"><span className="text-gray-400">{rewardLabel(selectedCard.rewardType)}</span><span className="text-white font-semibold">{(selectedCard.rewards || 0).toFixed(2)} {rewardUnit(selectedCard.rewardType)}</span></div>
//               <div className="flex justify-between"><span className="text-gray-400">Rewards Value</span><span className="text-white font-semibold">{RUPEE}{(selectedCard.rewardsValue || 0).toFixed(2)}</span></div>
//               <div className="flex justify-between"><span className="text-gray-400">Reward Rate</span><span className="text-white font-semibold">{selectedCard.rewardRateText || "N/A"}</span></div>
//               <div className="flex justify-between"><span className="text-gray-400">Limit</span><span className="text-white font-semibold">{RUPEE}{(selectedCard.limits?.max || selectedCard.maxLimit || 0).toLocaleString("en-IN")}</span></div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// const RecommendCardsPage = () => (
//   <Suspense
//     fallback={
//       <div className="min-h-screen bg-black flex items-center justify-center">
//         <p className="text-gray-400 text-sm">Loading...</p>
//       </div>
//     }
//   >
//     <RecommendCardsContent />
//   </Suspense>
// )

// export default RecommendCardsPage



'use client'
import React, { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

const RUPEE = "\u20B9"
const DOT = "\u2022"

// Rank config for top 3
const RANK = [
  { medal: "🥇", label: "Best Overall",  ring: "ring-yellow-500/40",  badge: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30" },
  { medal: "🥈", label: "Great Value",   ring: "ring-slate-400/40",   badge: "bg-slate-400/10 text-slate-300 border-slate-400/30" },
  { medal: "🥉", label: "Smart Choice",  ring: "ring-orange-600/40",  badge: "bg-orange-700/10 text-orange-300 border-orange-600/30" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Human-readable label for the reward type */
const rewardLabel = (rewardType) =>
  rewardType === "points" ? "Reward Points" : rewardType === "miles" ? "Miles Earned" : "Rewards"

/** Unit suffix for rewards */
const rewardUnit = (rewardType) =>
  rewardType === "points" ? " pts" : rewardType === "miles" ? " miles" : ""

/** Format a rupee amount — shows "₹0.00" for zero, never blank */
const fmt = (n) => `${RUPEE}${(Number(n) || 0).toFixed(2)}`

/** Format reward points / miles with unit */
const fmtReward = (n, rewardType) =>
  `${(Number(n) || 0).toFixed(2)}${rewardUnit(rewardType)}`

/**
 * Derives a human-readable category tag from the usedCategory returned by the API.
 * Falls back to the intent string if usedCategory is absent.
 */
const categoryLabel = (usedCategory, intent) => {
  const map = {
    travel:    "Travel & Hotels",
    fuel:      "Fuel & Commute",
    dining:    "Dining & Food",
    groceries: "Groceries",
    shopping:  "Shopping",
  }
  return map[usedCategory] ?? intent ?? "General"
}

/**
 * For the current top-3 cards, derive "roles" so that each card
 * is clearly labelled for the user:
 *   - Best for Cashback
 *   - Best for Rewards
 *   - Best for Offers & Perks
 *   - Best for Lowest Fees
 *
 * Returns an array parallel to cards: rolesByIndex[i] = [label1, label2, ...]
 */
const deriveRolesForCards = (cards) => {
  if (!Array.isArray(cards) || cards.length === 0) return []

  const getAnnualCost = (card) => {
    const joining = Number(card?.fees?.joining ?? 0)
    const annual  = Number(card?.fees?.annual ?? 0)
    return joining + annual
  }

  const indexOfMax = (picker) => {
    let bestIdx = null
    let bestVal = -Infinity
    cards.forEach((c, idx) => {
      const v = picker(c) ?? 0
      if (v > bestVal) {
        bestVal = v
        bestIdx = idx
      }
    })
    return bestVal > 0 ? bestIdx : null
  }

  const indexOfMin = (picker) => {
    let bestIdx = null
    let bestVal = Infinity
    cards.forEach((c, idx) => {
      const v = picker(c)
      if (v < bestVal) {
        bestVal = v
        bestIdx = idx
      }
    })
    return bestIdx
  }

  const bestCashbackIdx = indexOfMax((c) => Number(c.cashback))
  const bestRewardsIdx  = indexOfMax((c) => Number(c.rewardsValue))
  const bestPerksIdx    = indexOfMax((c) => Number(c.perksValue))
  const bestFeesIdx     = indexOfMin((c) => getAnnualCost(c))

  const rolesByIndex = cards.map(() => [])

  if (bestCashbackIdx !== null) {
    rolesByIndex[bestCashbackIdx].push("Best for Cashback")
  }
  if (bestRewardsIdx !== null) {
    rolesByIndex[bestRewardsIdx].push("Best for Rewards")
  }
  if (bestPerksIdx !== null) {
    rolesByIndex[bestPerksIdx].push("Best for Offers & Perks")
  }
  if (bestFeesIdx !== null) {
    rolesByIndex[bestFeesIdx].push("Best for Lowest Fees")
  }

  // Fallback label so no card looks "unlabelled"
  return rolesByIndex.map((roles) => (roles.length ? roles : ["Great Overall Pick"]))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** One benefit row inside a card */
function BenefitRow({ label, value, highlight }) {
  return (
    <div className={`flex justify-between items-center py-2 border-b border-gray-800/50 ${highlight ? "text-emerald-300" : ""}`}>
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-emerald-300" : "text-gray-200"}`}>{value}</span>
    </div>
  )
}

/** Skeleton card shown while loading */
function CardSkeleton() {
  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 animate-pulse space-y-4">
      <div className="h-5 w-40 bg-gray-700/50 rounded" />
      <div className="h-4 w-28 bg-gray-800/50 rounded" />
      <div className="h-16 bg-gray-800/40 rounded-lg" />
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => <div key={i} className="h-4 bg-gray-800/30 rounded" />)}
      </div>
    </div>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────

const RecommendCardsContent = () => {
  const [loading, setLoading]                    = useState(true)
  const [recommendedCards, setRecommendedCards]  = useState([])
  const [resolvedCategory, setResolvedCategory]  = useState(null)
  const [bestOwnedCard, setBestOwnedCard]        = useState(null)
  const [bestOverallCard, setBestOverallCard]   = useState(null)
  const [error, setError]                        = useState(null)
  const [selectedCard, setSelectedCard]          = useState(null)
  const [apiMessage, setApiMessage]              = useState(null)
  const [payingCardId, setPayingCardId]          = useState(null)
  const [paySuccessMessage, setPaySuccessMessage]= useState("")

  const router       = useRouter()
  const searchParams = useSearchParams()
  const amount       = searchParams.get("amount")
  const intent       = searchParams.get("intent")

  // Pre-compute role labels for the current set of cards
  const rolesByIndex = deriveRolesForCards(recommendedCards)

  useEffect(() => {
    if (!amount || !intent) {
      setError("Amount and intent are required.")
      setLoading(false)
      return
    }

    const fetchRecommendations = async () => {
      setLoading(true)
      setError(null)
      setRecommendedCards([])
      setBestOwnedCard(null)
      setBestOverallCard(null)
      setPaySuccessMessage("")

      try {
        const res  = await fetch("/api/getrecommendation", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ amount, intent }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.message ?? "Failed to get recommendations")

        const cards = Array.isArray(data.cards) ? data.cards.slice(0, 3) : []
        setRecommendedCards(cards)
        setResolvedCategory(data.resolvedCategory ?? null)
        if (data.bestOwnedCard) setBestOwnedCard(data.bestOwnedCard)
        if (data.bestOverallCard) setBestOverallCard(data.bestOverallCard)
        if (data.message) setApiMessage(data.message)
      } catch (err) {
        console.error(err)
        setError(err.message ?? "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [amount, intent])

  return (
    <div className="min-h-screen bg-black">
      {/* ── Header ── */}
      <div className="bg-black/95 backdrop-blur-xl border-b border-gray-900/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/users/recommend")}
                className="flex items-center gap-2 px-3 py-2 bg-gray-900/60 hover:bg-gray-800/60 rounded-xl border border-gray-800/50 text-gray-300 hover:text-white text-sm font-medium transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
              <div>
                <h1
                  className="text-3xl font-extrabold tracking-tight"
                  style={{ background: "linear-gradient(90deg,#888,#fff,#888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                >
                  Top 3 Recommended Cards
                </h1>
                {/* Show what was resolved from the intent */}
                <p className="text-gray-500 mt-1 text-sm">
                  {amount && intent
                    ? <>Showing best cards for <span className="text-gray-300">{RUPEE}{Number(amount).toLocaleString("en-IN")}</span> · {" "}
                      <span className="text-gray-300">{categoryLabel(resolvedCategory, intent)}</span></>
                    : "Based on your amount and intent"}
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push("/users/savings")}
              className="px-4 py-2 rounded-xl bg-gray-900/70 hover:bg-gray-800/80 border border-gray-700/60 text-xs font-semibold text-gray-200 hover:text-white transition-all duration-200"
            >
              View Monthly Savings
            </button>
          </div>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-red-400 mb-2">Error Loading Recommendations</h3>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* ── Cards ── */}
      {!loading && recommendedCards.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {/* Best owned / Best overall summary */}
          {(bestOwnedCard || bestOverallCard) && (
            <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bestOwnedCard && (
                <div className="bg-gray-900/60 border border-emerald-800/50 rounded-xl p-4">
                  <p className="text-xs font-medium text-emerald-400/90 uppercase tracking-wide mb-1">Best card you own</p>
                  <p className="text-lg font-semibold text-gray-100">{bestOwnedCard.cardName}</p>
                  <p className="text-sm text-gray-400 mt-1">Expected reward: {RUPEE}{Number(bestOwnedCard.expectedRewardInr ?? bestOwnedCard.expectedReward ?? 0).toFixed(2)}</p>
                </div>
              )}
              {bestOverallCard && (
                <div className="bg-gray-900/60 border border-amber-800/50 rounded-xl p-4">
                  <p className="text-xs font-medium text-amber-400/90 uppercase tracking-wide mb-1">Best card overall</p>
                  <p className="text-lg font-semibold text-gray-100">{bestOverallCard.cardName}</p>
                  <p className="text-sm text-gray-400 mt-1">Expected reward: {RUPEE}{Number(bestOverallCard.expectedRewardInr ?? bestOverallCard.expectedReward ?? 0).toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          {paySuccessMessage && (
            <div className="max-w-3xl mx-auto mb-6 bg-emerald-900/20 border border-emerald-700/50 rounded-xl p-3">
              <p className="text-emerald-300 text-xs text-center">
                {paySuccessMessage}
              </p>
            </div>
          )}

          {/* Optional API debug message (hidden in production) */}
          {process.env.NODE_ENV !== "production" && apiMessage && (
            <div className="max-w-3xl mx-auto mb-6 bg-blue-900/20 border border-blue-800/50 rounded-xl p-3">
              <p className="text-blue-300 text-xs text-center font-mono">{apiMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedCards.map((card, index) => {
              const rank  = RANK[index]
              const roles = rolesByIndex[index] || []

              return (
                <div
                  key={card._id ?? index}
                  className={`bg-gray-900/50 border border-gray-800/50 rounded-xl p-6
                    hover:border-gray-700/50 transition-all cursor-pointer
                    ring-1 ${rank.ring}`}
                >
                  {/* Header: medal + minimal card identity */}
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{rank.medal}</span>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-200">{card.cardName}</h3>
                        <p className="text-[11px] text-gray-500">{card.bank}</p>
                        {roles.length > 0 && (
                          <p className="text-[10px] text-gray-500 mt-0.5">{roles.join(" · ")}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cashback / rewards: by card + by offer */}
                  <div className="space-y-2 mb-4">
                    {card.rewardType === "cashback" && (
                      <BenefitRow
                        label="Cashback (by card)"
                        value={fmt(card.cashback)}
                        highlight={card.cashback > 0}
                      />
                    )}
                    {(card.rewardType === "points" || card.rewardType === "miles") && (
                      <>
                        <BenefitRow
                          label={`${rewardLabel(card.rewardType)} (by card)`}
                          value={fmtReward(card.rewards, card.rewardType)}
                          highlight
                        />
                        {Number(card.rewardsValue) > 0 && (
                          <BenefitRow
                            label="Value (₹)"
                            value={fmt(card.rewardsValue)}
                            highlight={false}
                          />
                        )}
                      </>
                    )}
                    {Array.isArray(card.appliedOffers) && card.appliedOffers.length > 0 && (
                      <>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1.5">By offer</p>
                        {card.appliedOffers.map((o, i) => (
                          <BenefitRow
                            key={i}
                            label={o.description}
                            value={fmt(o.value)}
                            highlight
                          />
                        ))}
                        <BenefitRow
                          label="Total from offers"
                          value={fmt(card.perksValue)}
                          highlight={card.perksValue > 0}
                        />
                      </>
                    )}
                    <BenefitRow
                      label="Total benefit (card + offers)"
                      value={fmt(card.totalBenefit)}
                      highlight
                    />
                  </div>

                  {Array.isArray(card.perks) && card.perks.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {card.perks.map((perk, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-800/50 text-gray-300 text-[11px] rounded border border-gray-700/50"
                          >
                            {typeof perk === "string" ? perk.replace(/_/g, " ") : perk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer: just Pay button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={async () => {
                        // Prevent double-clicks
                        if (payingCardId) return
                        setPaySuccessMessage("")
                        setPayingCardId(card._id ?? String(index))
                        try {
                          const res = await fetch("/api/transactions", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                              cardId: String(card._id),
                              cardName: card.cardName || "",
                              amount,
                              intent,
                              resolvedCategory: resolvedCategory ?? card.usedCategory ?? "shopping",
                              cashback: card.cashback ?? 0,
                              rewards: card.rewards ?? 0,
                              rewardsValue: card.rewardsValue ?? 0,
                              perksValue: card.perksValue ?? 0,
                              totalBenefit: card.totalBenefit ?? 0,
                            }),
                          })
                          const data = await res.json()
                          if (!res.ok) {
                            throw new Error(data.message || "Failed to record transaction")
                          }
                          setPaySuccessMessage(`Recorded: ${RUPEE}${Number(amount).toLocaleString("en-IN")} added to card spend, ${RUPEE}${(card.totalBenefit ?? 0).toFixed(2)} added to card savings. View in Monthly Savings.`)
                        } catch (err) {
                          console.error(err)
                          setError(err.message || "Failed to record transaction")
                        } finally {
                          setPayingCardId(null)
                        }
                      }}
                      className="shrink-0 px-3 py-2 rounded-lg bg-emerald-500/90 hover:bg-emerald-400 text-black text-xs font-semibold border border-emerald-300/70 disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={payingCardId === (card._id ?? String(index))}
                    >
                      {payingCardId === (card._id ?? String(index)) ? "Recording..." : "Pay with this card"}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && recommendedCards.length === 0 && (
        <div className="text-center py-16">
          <h3 className="text-xl font-bold text-gray-200 mb-2">No recommendations found</h3>
          <p className="text-gray-500 text-sm">Try a different amount or intent.</p>
          <button
            onClick={() => router.push("/users/recommend")}
            className="mt-4 px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-300 hover:text-white transition-colors"
          >
            Go back and try again
          </button>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedCard && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="bg-gray-950 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-800/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-800/50">
              <h2 className="text-2xl font-bold text-white">{selectedCard.cardName}</h2>
              <p className="text-gray-400 mt-1 text-sm">
                {selectedCard.bank}
                {selectedCard.cardType && <> {DOT} {selectedCard.cardType}</>}
                {selectedCard.network  && <> {DOT} {selectedCard.network}</>}
              </p>
            </div>

            <div className="p-6 space-y-3 text-sm">
              {/* Cashback / rewards: by card */}
              {selectedCard.rewardType === "cashback" && (
                <div className="flex justify-between py-2 border-b border-gray-800/40">
                  <span className="text-gray-400">Cashback (by card)</span>
                  <span className="text-white font-semibold">{fmt(selectedCard.cashback)}</span>
                </div>
              )}

              {(selectedCard.rewardType === "points" || selectedCard.rewardType === "miles") && (
                <>
                  <div className="flex justify-between py-2 border-b border-gray-800/40">
                    <span className="text-gray-400">{rewardLabel(selectedCard.rewardType)} (by card)</span>
                    <span className="text-white font-semibold">{fmtReward(selectedCard.rewards, selectedCard.rewardType)}</span>
                  </div>
                  {Number(selectedCard.rewardsValue) > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-800/40">
                      <span className="text-gray-400">Value (₹)</span>
                      <span className="text-white font-semibold">{fmt(selectedCard.rewardsValue)}</span>
                    </div>
                  )}
                </>
              )}

              {/* By offer: each offer + total */}
              {Array.isArray(selectedCard.appliedOffers) && selectedCard.appliedOffers.length > 0 && (
                <>
                  <p className="text-xs text-gray-500 uppercase tracking-wider pt-2">By offer</p>
                  {selectedCard.appliedOffers.map((o, i) => (
                    <div key={i} className="flex justify-between py-2 border-b border-gray-800/40">
                      <span className="text-gray-400 pr-2">{o.description}</span>
                      <span className="text-emerald-300 font-semibold shrink-0">{fmt(o.value)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 border-b border-gray-800/40">
                    <span className="text-gray-400 font-medium">Total from offers</span>
                    <span className="text-emerald-300 font-semibold">{fmt(selectedCard.perksValue)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between py-3 bg-gray-900/50 rounded-lg px-3 mt-2">
                <span className="text-gray-200 font-semibold">Total benefit (card + offers)</span>
                <span className="text-white font-bold">{fmt(selectedCard.totalBenefit)}</span>
              </div>

              {/* Simple explanation */}
              <div className="mt-3 text-[11px] text-gray-500 space-y-1">
                {selectedCard.rewardType === "cashback" && (
                  <p>Cashback = amount × category rate for {categoryLabel(resolvedCategory ?? selectedCard.usedCategory, intent).toLowerCase()}, subject to cap.</p>
                )}
                {(selectedCard.rewardType === "points" || selectedCard.rewardType === "miles") && (
                  <p>{rewardLabel(selectedCard.rewardType)} = amount × category rate ÷ 100; value in ₹ using card&apos;s point value.</p>
                )}
                {selectedCard.perksValue > 0 && (
                  <p>Perks (₹) from active offers, capped per offer.</p>
                )}
              </div>

              {/* Perks */}
              {Array.isArray(selectedCard.perks) && selectedCard.perks.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-gray-500 mb-2">Perks:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCard.perks.map((perk, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-800/60 text-gray-300 text-xs rounded border border-gray-700/50">
                        {typeof perk === "string" ? perk.replace(/_/g, " ") : perk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-800/50">
              <button
                onClick={() => setSelectedCard(null)}
                className="w-full py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 hover:text-white text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Suspense wrapper (required because useSearchParams needs it) ────────────
const RecommendCardsPage = () => (
  <Suspense
    fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400 text-sm animate-pulse">Loading recommendations...</p>
      </div>
    }
  >
    <RecommendCardsContent />
  </Suspense>
)

export default RecommendCardsPage