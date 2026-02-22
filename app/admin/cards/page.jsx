'use client'
import React, { useState, useEffect } from 'react';
import  { useRouter } from 'next/navigation';
const Page = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const router =  useRouter()

  useEffect(() => {
    fetch('/api/cards')
      .then(res => res.json())
      .then(data => {
        setCards(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching cards:', error);
        setLoading(false);
      });
  }, []);

  const GetPage= (id)=>{
      router.push(`/admin/${id}/edit`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-400">Loading cards...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black/95 backdrop-blur-xl border-b border-gray-900/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 
            className="text-3xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(90deg, #888, #fff, #888)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            All Credit Cards
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Manage all credit cards in the system</p>
        </div>
      </div>

      {/* Cards Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {cards.length === 0 ? (
          <div className="text-center py-32">
            <p className="text-gray-500">No cards found</p>
          </div>
        ) : (
          <div className="bg-gray-950/50 rounded-xl border border-gray-800/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50 border-b border-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Bank</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Card Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Network</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Reward</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {cards.map((card) => (
                    <tr key={card._id} className="hover:bg-gray-900/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-200">{card.bank}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-300">{card.cardName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-800/50 text-gray-300 rounded">
                          {card.cardType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-400">{card.network}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-300">{card.rewardRateText || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 text-sm font-medium rounded-lg border border-gray-700/50 transition-colors"
                        onClick={()=>GetPage(card._id)} >
                          Edit
                        </button>
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
};

export default Page;
