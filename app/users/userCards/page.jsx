'use client'
import React from "react"
import { useState ,useEffect} from "react"
import { useRouter } from "next/navigation"


const Page = () => {
  const router = useRouter()
  const [cards,setCards] = useState([])
  const [selectedCard, setSelectedCard] = useState(null);
  useEffect(()=>{
      fetch('/api/userCards',{method:"GET"})
      .then(res => {
        console.log("Response status:", res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log("Cards data received:", data);
        setCards(data);
      })
      .catch(error => {
        console.error("Error fetching cards:", error);
        setCards([]);
      });
  },[])

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

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black/95 backdrop-blur-xl border-b border-gray-900/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 
                className="text-5xl font-extrabold tracking-tight"
                style={{
                  background: "linear-gradient(90deg, #888, #fff, #888)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                My Cards
              </h1>
              <p className="text-gray-500 mt-2 text-sm">Manage and view all your credit cards</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/users/recommend')}
                className="px-4 py-2 bg-gray-900/50 hover:bg-gray-800/50 rounded-lg border border-gray-700/50 text-gray-300 text-sm font-medium transition-colors"
              >
                Get Recommendation
              </button>
              <button
                onClick={() => router.push('/users/addCards')}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                style={{
                  background: "linear-gradient(90deg, #5f676a, #f0f0f0, #5f676a)",
                  color: "#000",
                }}
              >
                + Add Card
              </button>
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-full border border-gray-800">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400 font-medium">{cards.length} {cards.length === 1 ? 'Card' : 'Cards'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="max-w-7xl mx-auto px-5 sm:px-7 lg:px-9 py-13">
        {cards.length === 0 ? (
          <div className="text-center py-32">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl mb-6 border border-gray-800">
              <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-200 mb-2">No cards yet</h3>
            <p className="text-gray-500 text-sm">Add your first credit card to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(cards || []).map((card, index) => (
          <div
            key={card._id}
            onClick={() => setSelectedCard(card)}
                className="group cursor-pointer relative"
                style={{ animationDelay: `${index * 100}ms` }}
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

                    {/* Middle Section */}
                    <div className="flex-1 flex flex-col justify-center py-4">
                      <h2 className="text-2xl font-extrabold mb-3 tracking-tight leading-tight">{card.cardName}</h2>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-white/25 rounded-lg backdrop-blur-md text-xs font-semibold border border-white/30 shadow-sm">
                          {card.cardType}
                        </span>
                        <span className="text-xs opacity-60">•</span>
                        <span className="text-xs opacity-80 font-medium">{card.network}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] opacity-60 mb-1.5 font-medium uppercase tracking-wide">Limit</p>
                        <p className="text-sm font-bold"> ₹{card.limits?.max?.toLocaleString("en-IN") || "N/A"}</p>

                      </div>
                    </div>

                    {/* Bottom Section */}
                    
                  </div>

                  {/* Subtle glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card Details Modal */}
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="relative z-10">
                <p className="text-xs opacity-80 font-semibold uppercase tracking-wider mb-2">{selectedCard.bank}</p>
                <h2 className="text-3xl font-bold mb-3 leading-tight">{selectedCard.cardName}</h2>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white/20 rounded-lg text-xs font-semibold backdrop-blur-sm">
                    {selectedCard.cardType}
                  </span>
                  <span className="text-xs opacity-70">{selectedCard.network}</span>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 bg-gray-950 overflow-y-auto flex-1">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3">
                {/* <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800/50">
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">Reward Rate</p>
                  <p className="text-lg font-bold text-white">{selectedCard.rewardRateText || 'N/A'}</p>
                </div> */}
                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800/50">
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">Annual Fee</p>
                  <p className="text-lg font-bold text-white">₹{selectedCard.fees?.annual?.toLocaleString("en-IN") || 0}</p>
                </div>
              </div>

              {/* Joining Fee */}
              {selectedCard.fees?.joining && selectedCard.fees.joining > 0 && (
                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800/50">
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">Joining Fee</p>
                  <p className="text-lg font-bold text-white">₹{selectedCard.fees.joining.toLocaleString("en-IN")}</p>
                </div>
              )}

              {/* Credit Limit */}
              <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800/50">
                <p className="text-xs text-gray-500 mb-2 font-medium">Credit Limit</p>
                <p className="text-2xl font-bold text-white">₹{selectedCard.limits?.max?.toLocaleString("en-IN") || "N/A"}</p>
              </div>

              {/* Available Limit */}
              {selectedCard.limits?.available && (
                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800/50">
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">Available Limit</p>
                  <p className="text-xl font-semibold text-white">₹{selectedCard.limits.available.toLocaleString('en-IN')}</p>
                </div>
              )}

              {/* Billing Date */}
              {selectedCard.billingDate && (
                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800/50">
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">Billing Date</p>
                  <p className="text-base font-semibold text-white">Every {selectedCard.billingDate}{selectedCard.billingDate === 1 ? 'st' : selectedCard.billingDate === 2 ? 'nd' : selectedCard.billingDate === 3 ? 'rd' : 'th'} of the month</p>
                </div>
              )}

              {/* Perks */}
              {selectedCard.perks && selectedCard.perks.length > 0 && (
                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800/50">
                  <p className="text-xs text-gray-500 mb-3 font-medium">Perks & Benefits</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCard.perks.includes('LOUNGE_ACCESS') && (
                      <span className="px-3 py-1.5 bg-gray-800/60 rounded-lg text-xs font-medium text-gray-200">Lounge Access</span>
                    )}
                    {selectedCard.perks.includes('FUEL_WAIVER') && (
                      <span className="px-3 py-1.5 bg-gray-800/60 rounded-lg text-xs font-medium text-gray-200">Fuel Waiver</span>
                    )}
                    {selectedCard.perks.includes('AMAZON_PRIME') && (
                      <span className="px-3 py-1.5 bg-gray-800/60 rounded-lg text-xs font-medium text-gray-200">Amazon Prime</span>
                    )}
                    {selectedCard.perks.includes('TRAVEL_INSURANCE') && (
                      <span className="px-3 py-1.5 bg-gray-800/60 rounded-lg text-xs font-medium text-gray-200">Travel Insurance</span>
                    )}
                    {selectedCard.perks.includes('MOVIE_OFFER') && (
                      <span className="px-3 py-1.5 bg-gray-800/60 rounded-lg text-xs font-medium text-gray-200">Movie Offers</span>
                    )}
                    {selectedCard.perks.includes('DINING_DISCOUNT') && (
                      <span className="px-3 py-1.5 bg-gray-800/60 rounded-lg text-xs font-medium text-gray-200">Dining Discount</span>
                    )}
                    {selectedCard.perks.includes('TRAVEL_VOUCHER') && (
                      <span className="px-3 py-1.5 bg-gray-800/60 rounded-lg text-xs font-medium text-gray-200">Travel Voucher</span>
                    )}
                    {selectedCard.perks.includes('CONCIERGE') && (
                      <span className="px-3 py-1.5 bg-gray-800/60 rounded-lg text-xs font-medium text-gray-200">Concierge</span>
                    )}
                    {selectedCard.perks.includes('BUSINESS_BENEFITS') && (
                      <span className="px-3 py-1.5 bg-gray-800/60 rounded-lg text-xs font-medium text-gray-200">Business Benefits</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Page