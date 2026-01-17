'use client'
import React, { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

const RecommendCardsContent = () => {
  
  const [loading, setLoading] = useState(true)
  const [recommendedCards, setRecommendedCards] = useState([])
  const [error, setError] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [recommendationMessage, setRecommendationMessage] = useState(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const userInput = searchParams.get('prompt')
  // Get gradient colors based on bank
  const getCardGradient = (bank) => {
    
    const gradients = {
      'HDFC': 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e8ba3 100%)',
      'ICICI': 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 50%, #c44569 100%)',
      'SBI': 'linear-gradient(135deg, #0f4c75 0%, #3282b8 50%, #bbe1fa 100%)',
      'Axis': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      'Kotak': 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #4facfe 100%)',
      'IDFC First': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 50%, #4facfe 100%)',
    };
    return gradients[bank] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  };
useEffect(() => {
  if (!userInput?.trim()) {
    setLoading(false);
    return;
  }

  setRecommendedCards([]);
  setLoading(true);
  setError(null);

  const fetchRecommendations = async () => {
    try {
      const res = await fetch("/api/getrecommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userInput }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to get recommendation");
      }
      
      // Case 1: cards directly
      if (Array.isArray(data.cards)) {
        setRecommendedCards(data.cards.slice(0, 3));
        if (data.message) {
          setRecommendationMessage(data.message);
        }
        return;
      }

      // Case 2: cardIds
      if (Array.isArray(data.cardIds)) {
        const cards = await Promise.all(
          data.cardIds.slice(0, 3).map(async (id) => {
            const cardRes = await fetch(`/api/cards?id=${id}`);
            if (!cardRes.ok) throw new Error("Failed to fetch card details");
            return cardRes.json();
          })
        );
        setRecommendedCards(cards);
        return;
      }

      // Fallback
      const fallbackRes = await fetch("/api/cards");
      const fallbackCards = await fallbackRes.json();
      setRecommendedCards(fallbackCards.slice(0, 3));

    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  fetchRecommendations();
}, [userInput]);



  return (
    <>
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black/95 backdrop-blur-xl border-b border-gray-900/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/recommend')}
                className="flex items-center gap-2 px-3 py-2 bg-gray-900/60 hover:bg-gray-800/60 rounded-xl border border-gray-800/50 text-gray-300 hover:text-white text-sm font-medium transition-all duration-200 hover:scale-105 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back</span>
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
                  Recommended Cards
                </h1>
                <p className="text-gray-500 mt-2 text-sm">Based on your requirements</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="relative">
              <svg className="animate-spin h-16 w-16 text-gray-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="mt-8 text-xl font-bold text-gray-300" style={{
              background: "linear-gradient(90deg, #888, #fff, #888)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Finding Perfect Cards for You...
            </h3>
            <p className="mt-3 text-gray-500 text-sm">Analyzing your requirements and matching the best cards</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto bg-red-900/20 border border-red-800/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-red-400">Error Loading Recommendations</h3>
            </div>
            <p className="text-red-300 text-sm">{error}</p>
            <button
              onClick={() => router.push('/recommend')}
              className="mt-4 px-4 py-2 bg-red-900/50 hover:bg-red-900/70 text-red-200 rounded-lg transition-colors text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

        {/* Recommended Cards */}
        {!loading && recommendedCards.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 
              className="text-3xl font-bold mb-4 text-center"
              style={{
                background: "linear-gradient(90deg, #888, #fff, #888)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Top 3 Recommended Cards
            </h2>
            
            {/* Recommendation Message */}
            {recommendationMessage && (
              <div className="max-w-3xl mx-auto mb-8 bg-blue-900/20 border border-blue-800/50 rounded-xl p-4">
                <p className="text-blue-300 text-sm text-center">{recommendationMessage}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {recommendedCards.map((card, index) => (
                <div
                  key={card._id || index}
                  onClick={() => setSelectedCard(card)}
                  className="group cursor-pointer relative"
                >
                  {/* Credit Card Design */}
                  <div 
                    className="relative h-64 rounded-3xl shadow-2xl transform transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden group/card"
                    style={{
                      background: getCardGradient(card.bank),
                    }}
                  >
                    {/* Animated shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover/card:opacity-100 group-hover/card:translate-x-full transition-all duration-1000 -translate-x-full"></div>
                    
                    {/* Pattern overlay */}
                    <div className="absolute inset-0 opacity-10" style={{
                      backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                      backgroundSize: '24px 24px'
                    }}></div>
                    
                    {/* Badge for cards that need to be added */}
                    {card.needsToBeAdded && (
                      <div className="absolute top-4 right-4 z-10">
                        <span className="px-3 py-1 bg-yellow-500/90 text-black text-xs font-bold rounded-full shadow-lg border-2 border-yellow-300/50">
                          ADD THIS CARD
                        </span>
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="relative h-full p-7 flex flex-col justify-between text-white">
                      {/* Top Section */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 bg-white/25 rounded-xl backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20">
                            <div className="w-10 h-10 bg-white/40 rounded-lg"></div>
                          </div>
                          <div>
                            <p className="text-[10px] opacity-90 font-semibold uppercase tracking-[0.15em] leading-tight">{card.bank}</p>
                            <p className="text-[9px] opacity-60 mt-0.5">{card.network}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="w-16 h-11 bg-white/20 rounded-lg backdrop-blur-sm border border-white/30 shadow-inner"></div>
                        </div>
                      </div>

                     
                      <div className="flex-1 flex flex-col justify-center py-4">
                        <h2 className="text-2xl font-extrabold mb-3 tracking-tight leading-tight">{card.cardName}</h2>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1.5 bg-white/25 rounded-lg backdrop-blur-md text-xs font-semibold border border-white/30 shadow-sm">
                            {card.cardType}
                          </span>
                          <span className="text-xs opacity-60">•</span>
                          <span className="text-xs opacity-80 font-medium">{card.network}</span>
                        </div>
                      </div>

                      {/* Bottom Section */}
                      <div className="flex justify-between items-end pt-2">
                        <div>
                          <p className="text-[10px] opacity-60 mb-1.5 font-medium uppercase tracking-wide">Reward</p>
                          <p className="text-sm font-bold">{card.rewardRateText || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] opacity-60 mb-1.5 font-medium uppercase tracking-wide">Limit</p>
                          <p className="text-sm font-bold">₹{card.maxLimit?.toLocaleString('en-IN') || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Subtle glow on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        
        {!loading && recommendedCards.length === 0 && !error && userInput && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl mb-6 border border-gray-800">
              <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-200 mb-2">No recommendations yet</h3>
            <p className="text-gray-500 text-sm">Enter your spending habits above to get personalized card recommendations</p>
          </div>
        )}
      </div>
      
      {selectedCard && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCard(null)}
        >
          <div 
            className="bg-gray-950 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col transform border border-gray-800/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div 
              className="relative h-48 text-white p-6 flex flex-col justify-between overflow-hidden"
              style={{
                background: getCardGradient(selectedCard.bank),
              }}
            >
              <button
                className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 z-20 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCard(null);
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div>
                <p className="text-xs opacity-80 font-semibold uppercase tracking-wider mb-1">{selectedCard.bank}</p>
                <h2 className="text-3xl font-extrabold mb-2">{selectedCard.cardName}</h2>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white/25 rounded-lg backdrop-blur-md text-xs font-semibold border border-white/30">
                    {selectedCard.cardType}
                  </span>
                  <span className="text-xs opacity-60">•</span>
                  <span className="text-xs opacity-80">{selectedCard.network}</span>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Add Card Button if needed */}
              {selectedCard.needsToBeAdded && (
                <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-xl p-4 mb-4">
                  <p className="text-yellow-300 text-sm mb-3">This card is not in your collection yet.</p>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const res = await fetch('/api/userCards', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ cardId: selectedCard._id }),
                        });
                        if (res.ok) {
                          alert('Card added successfully!');
                          setSelectedCard(null);
                          // Refresh recommendations
                          window.location.reload();
                        } else {
                          alert('Failed to add card');
                        }
                      } catch (err) {
                        console.error(err);
                        alert('Failed to add card');
                      }
                    }}
                    className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors"
                  >
                    Add This Card to My Collection
                  </button>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Rewards & Benefits</h3>
                <div className="space-y-3">
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800/50">
                    <p className="text-xs text-gray-400 mb-1">Reward Rate</p>
                    <p className="text-lg font-bold text-white">{selectedCard.rewardRateText || 'N/A'}</p>
                  </div>
                  {selectedCard.bestFor && selectedCard.bestFor.length > 0 && (
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800/50">
                      <p className="text-xs text-gray-400 mb-2">Best For</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedCard.bestFor.map((item, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-800/50 rounded-lg text-xs text-gray-300">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Card Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                    <span className="text-sm text-gray-400">Credit Limit</span>
                    <span className="text-sm font-semibold text-white">₹{selectedCard.maxLimit?.toLocaleString('en-IN') || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                    <span className="text-sm text-gray-400">Annual Fee</span>
                    <span className="text-sm font-semibold text-white">₹{selectedCard.annualFee || 0}</span>
                  </div>
                  {selectedCard.joiningFee && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                      <span className="text-sm text-gray-400">Joining Fee</span>
                      <span className="text-sm font-semibold text-white">₹{selectedCard.joiningFee}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const recommendCards = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-4 border-gray-600 border-t-white rounded-full"></div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <RecommendCardsContent />
    </Suspense>
  )
}

export default recommendCards
