'use client'
import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

const AddCards = () => {
  const [allCards, setAllCards] = useState([])
  const [userCards, setUserCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingCard, setAddingCard] = useState(null)
  const router = useRouter()

  useEffect(() => {
    fetchAllCards()
    fetchUserCards()
  }, [])

  const fetchAllCards = async () => {
    try {
      const res = await fetch('/api/cards')
      const data = await res.json()
      setAllCards(data)
    } catch (error) {
      console.error("Error fetching cards:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserCards = async () => {
    try {
      const res = await fetch('/api/userCards')
      if (res.ok) {
        const data = await res.json()
        setUserCards(data.map(card => card._id))
      }
    } catch (error) {
      console.error("Error fetching user cards:", error)
    }
  }

  const handleAddCard = async (cardId) => {
    setAddingCard(cardId)
    try {
      const res = await fetch('/api/userCards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardId }),
      })

      const data = await res.json()

      if (res.ok) {
        // Update user cards list
        setUserCards([...userCards, cardId])
       // alert('Card added successfully!')
      } else {
        alert(data.message || 'Failed to add card')
      }
    } catch (error) {
      console.error("Error adding card:", error)
      alert('Failed to add card')
    } finally {
      setAddingCard(null)
    }
  }

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

  // Filter cards that user doesn't have
  const availableCards = allCards.filter(card => !userCards.includes(card._id))

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading cards...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black/95 backdrop-blur-xl border-b border-gray-900/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 
                className="text-3xl font-extrabold tracking-tight"
                style={{
                  background: "linear-gradient(90deg, #888, #fff, #888)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Add Cards
              </h1>
              <p className="text-gray-500 mt-2 text-sm">Discover and add new credit cards to your wallet</p>
            </div>
            <button
              onClick={() => router.push('/users/userCards')}
              className="px-4 py-2 bg-gray-900/50 hover:bg-gray-800/50 rounded-lg border border-gray-700/50 text-gray-300 text-sm font-medium transition-colors"
            >
              My Cards
            </button>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {availableCards.length === 0 ? (
          <div className="text-center py-32">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl mb-6 border border-gray-800">
              <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-200 mb-2">All cards added!</h3>
            <p className="text-gray-500 text-sm">You have added all available cards</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {availableCards.map((card) => (
              <div
                key={card._id}
                className="group relative"
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
                    </div>

                    {/* Bottom Section */}
                    <div className="flex justify-between items-end pt-2">
                      <div>
                        <p className="text-[10px] opacity-60 mb-1.5 font-medium uppercase tracking-wide">Reward</p>
                        <p className="text-sm font-bold">{card.rewardRateText || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] opacity-60 mb-1.5 font-medium uppercase tracking-wide">Fee</p>
                        <p className="text-sm font-bold">₹{card.annualFee?.toLocaleString('en-IN') || '0'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Subtle glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"></div>
                </div>

                {/* Add Button */}
                <button
                  onClick={() => handleAddCard(card._id)}
                  disabled={addingCard === card._id}
                  className="mt-4 w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  style={{
                    background: addingCard === card._id
                      ? "linear-gradient(90deg, #2c2c2c, #2c2c2c, #2c2c2c)"
                      : "linear-gradient(90deg, #5f676a, #f0f0f0, #5f676a)",
                    color: addingCard === card._id ? "#888" : "#000",
                  }}
                >
                  {addingCard === card._id ? 'Adding...' : 'Add Card'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AddCards

