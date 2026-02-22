'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const page = () => {
    const router = useRouter()
    const [offers,setOffers] = useState([])
    const [loading,setLoading]=useState(true)
    const [error,setError]=useState('')
    const [message,setMessage]=useState('')
    useEffect(()=>{
       const fetchOffers = async () => {
      try {
        const response = await fetch('/api/offersapi')
        const res = await response.json()

        if (response.ok) {
          setOffers(res)
        } else {
          setMessage(res.message)
        }
      } catch (e) {
        setError('Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    fetchOffers()
        
    },[])

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const getRewardTypeColor = (type) => {
        switch(type) {
            case 'CASHBACK':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'REWARD_POINTS':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'DISCOUNT':
                return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-gray-400">Loading offers...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-red-400">{error}</div>
            </div>
        );
    }

    if (message) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-gray-400">{message}</div>
            </div>
        );
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
                                All Offers
                            </h1>
                            <p className="text-gray-500 mt-2 text-sm">View and manage all available offers</p>
                        </div>
                        <button
                            onClick={() => router.push('/admin/offers/add')}
                            className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                            style={{
                                background: "linear-gradient(90deg,rgb(28, 48, 58),rgb(41, 62, 67),rgb(27, 46, 52))",
                                color: "white",
                            }}
                        >
                            Add Offer
                        </button>
                    </div>
                </div>
            </div>

            {/* Offers Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {offers.length === 0 ? (
                    <div className="text-center py-32">
                        <p className="text-gray-500">No offers found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {offers.map((offer) => (
                            <div 
                                key={offer._id} 
                                className="bg-gray-950/50 rounded-xl border border-gray-800/50 p-6 hover:border-gray-700/50 transition-all hover:shadow-lg hover:shadow-gray-900/20"
                            >
                                {/* Merchant Name */}
                                <div className="flex items-start justify-between mb-4">
                                    <h3 className="text-xl font-bold text-gray-200">{offer.merchant}</h3>
                                    {offer.isActive ? (
                                        <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded border border-green-500/30">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 text-xs font-medium bg-gray-500/20 text-gray-400 rounded border border-gray-500/30">
                                            Inactive
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                    {offer.description}
                                </p>

                                {/* Reward Type and Value */}
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded border ${getRewardTypeColor(offer.rewardType)}`}>
                                        {offer.rewardType.replace('_', ' ')}
                                    </span>
                                    <span className="text-gray-300 font-semibold">
                                        {offer.rewardValue}
                                        {offer.rewardType === 'CASHBACK' ? '%' : offer.rewardType === 'REWARD_POINTS' ? 'X' : '%'}
                                    </span>
                                </div>

                                {/* Valid Cards */}
                                <div className="mb-4">
                                    <p className="text-xs text-gray-500 mb-2">Valid Cards:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {offer.validCards && offer.validCards.length > 0 ? (
                                            offer.validCards.map((card, index) => (
                                                <span 
                                                    key={index}
                                                    className="px-2 py-1 text-xs bg-gray-800/50 text-gray-300 rounded border border-gray-700/50"
                                                >
                                                    {card.bank} - {card.cardName}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-500">No cards specified</span>
                                        )}
                                    </div>
                                </div>

                                {/* Transaction Details */}
                                <div className="space-y-2 mb-4 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Min. Amount:</span>
                                        <span className="text-gray-300">₹{offer.minTransactionAmount || 0}</span>
                                    </div>
                                    {offer.maxRewardCap && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Max. Reward:</span>
                                            <span className="text-gray-300">₹{offer.maxRewardCap}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Validity Dates */}
                                <div className="pt-4 border-t border-gray-800/50">
                                    <div className="flex justify-between text-xs">
                                        <div>
                                            <span className="text-gray-500">From:</span>
                                            <span className="text-gray-300 ml-2">{formatDate(offer.validFrom)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Till:</span>
                                            <span className="text-gray-300 ml-2">{formatDate(offer.validTill)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Priority Badge and Edit Button */}
                                <div className="mt-3 flex items-center justify-between pt-3 border-t border-gray-800/50">
                                    {offer.priority !== undefined ? (
                                        <span className="text-xs text-gray-500">
                                            Priority: <span className="text-gray-300 font-medium">{offer.priority}</span>
                                        </span>
                                    ) : (
                                        <span></span>
                                    )}
                                    <button
                                        onClick={() => router.push(`/admin/offers/${offer._id}/edit`)}
                                        className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 text-sm font-medium rounded-lg border border-gray-700/50 transition-colors"
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default page