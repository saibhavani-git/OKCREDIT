'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const Page = () => {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    merchant: '',
    description: '',
    rewardType: 'CASHBACK',
    rewardValue: 0,
    validCards: [{ bank: '', cardName: '' }],
    minTransactionAmount: 0,
    maxRewardCap: '',
    validFrom: '',
    validTill: '',
    priority: 1,
    isActive: true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCardChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      validCards: prev.validCards.map((card, i) => 
        i === index ? { ...card, [field]: value } : card
      )
    }));
  };

  const addCard = () => {
    setFormData(prev => ({
      ...prev,
      validCards: [...prev.validCards, { bank: '', cardName: '' }]
    }));
  };

  const removeCard = (index) => {
    setFormData(prev => ({
      ...prev,
      validCards: prev.validCards.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const submitData = {
        ...formData,
        maxRewardCap: formData.maxRewardCap === '' ? null : Number(formData.maxRewardCap),
        rewardValue: Number(formData.rewardValue),
        minTransactionAmount: Number(formData.minTransactionAmount),
        priority: Number(formData.priority),
        validFrom: new Date(formData.validFrom),
        validTill: new Date(formData.validTill)
      };

      const response = await fetch('/api/offersapi', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Creation failed");
      }

      setMessage("Offer Created Successfully");

      setTimeout(() => {
        router.push('/admin/offers');
      }, 1000);

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black/95 backdrop-blur-xl border-gray-900/50 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                Add New Offer
              </h1>
              <p className="text-gray-500 mt-2 text-sm">Create a new offer for credit cards</p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 text-sm font-medium rounded-lg border border-gray-700/50 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-4 rounded-xl p-3 text-center text-sm bg-red-950/50 border border-red-900/50 text-red-400">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-xl p-3 text-center text-sm bg-green-950/50 border border-green-900/50 text-green-400">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-gray-950/50 rounded-xl border border-gray-800/50 p-8 space-y-8">
          
          {/* Basic Offer Info */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-200 border-gray-800/50 pb-3">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Merchant *</label>
                <input
                  type="text"
                  name="merchant"
                  value={formData.merchant}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                  placeholder="e.g., Amazon"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Reward Type *</label>
                <select
                  name="rewardType"
                  value={formData.rewardType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                  required
                >
                  <option value="CASHBACK">Cashback</option>
                  <option value="REWARD_POINTS">Reward Points</option>
                  <option value="DISCOUNT">Discount</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                  placeholder="e.g., 5% cashback on online shopping"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Reward Value *</label>
                <input
                  type="number"
                  name="rewardValue"
                  value={formData.rewardValue}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Priority</label>
                <input
                  type="number"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          {/* Valid Cards */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-200 border-gray-800/50 pb-3">Valid Cards</h2>
              <button
                type="button"
                onClick={addCard}
                className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 text-sm font-medium rounded-lg border border-gray-700/50 transition-colors"
              >
                Add Card
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.validCards.map((card, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-900/30 rounded-lg border border-gray-800/50">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Bank</label>
                    <input
                      type="text"
                      value={card.bank}
                      onChange={(e) => handleCardChange(index, 'bank', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900/60 border border-gray-700/50 rounded-lg text-gray-100 focus:outline-none focus:border-gray-500/50"
                      placeholder="e.g., HDFC"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Card Name</label>
                    <input
                      type="text"
                      value={card.cardName}
                      onChange={(e) => handleCardChange(index, 'cardName', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900/60 border border-gray-700/50 rounded-lg text-gray-100 focus:outline-none focus:border-gray-500/50"
                      placeholder="e.g., Millennia Credit Card"
                    />
                  </div>
                  <div className="flex items-end">
                    {formData.validCards.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCard(index)}
                        className="w-full px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm font-medium rounded-lg border border-red-800/50 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-200 border-gray-800/50 pb-3">Transaction Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Minimum Transaction Amount (₹)</label>
                <input
                  type="number"
                  name="minTransactionAmount"
                  value={formData.minTransactionAmount}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Maximum Reward Cap (₹)</label>
                <input
                  type="number"
                  name="maxRewardCap"
                  value={formData.maxRewardCap}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>
          </div>

          {/* Validity Period */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-200 border-gray-800/50 pb-3">Validity Period</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Valid From *</label>
                <input
                  type="date"
                  name="validFrom"
                  value={formData.validFrom}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Valid Till *</label>
                <input
                  type="date"
                  name="validTill"
                  value={formData.validTill}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                  required
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-200 border-gray-800/50 pb-3">Status</h2>
            
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-5 h-5 bg-gray-900/60 border-gray-700/50 rounded text-gray-900 focus:ring-gray-500"
                />
                <span className="text-sm text-gray-300">Active Offer</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-800/50">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 font-medium rounded-lg border border-gray-700/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              style={{
                background: "linear-gradient(90deg, #5f676a, #f0f0f0, #5f676a)",
                color: "#000",
              }}
            >
              Create Offer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Page;

