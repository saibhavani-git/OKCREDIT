'use client'
import React, { useEffect, useState } from 'react';
import { useRouter,useParams } from 'next/navigation';

const Page = () => {
  const router = useRouter();
   const params = useParams();
   const [message,setMessage] =useState('')
   const [error,setError]=useState('')
  const [formData, setFormData] = useState({
    bank: '',
    cardName: '',
    network: 'Visa',
    cardType: 'Cashback',
    rewardType: 'cashback',
    baseRewardRate: 0,
    categories: {
      shopping: 1,
      travel: 1,
      fuel: 1,
      dining: 1,
      groceries: 1
    },
    bestFor: [],
    rewardRateText: '',
    perks: [],
    fees: {
      joining: 0,
      annual: 0,
      waiverSpend: 0
    },
    eligibility: {
      minIncome: 0,
      minCreditScore: 0
    },
    limits: {
      max: 0,
      available: 0
    },
    billingDate: 1,
    popularityScore: 0
  });

  useEffect(() => {
  const fetchCard = async () => {
    try {
      const res = await fetch(`/api/editcard/${params.id}`);
      const data = await res.json();
      console.log(data)
      setFormData(data);
    } catch (error) {
      console.error(error);
    }
  };

  if (params.id) fetchCard();
}, [params.id]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleCategoryChange = (category, value) => {
    setFormData(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: parseFloat(value) || 0
      }
    }));
  };

  const handleBestForChange = (e) => {
    const values = e.target.value.split(',').map(v => v.trim()).filter(boolean);
    setFormData(prev => ({
      ...prev,
      bestFor: values
    }));
  };

  const handlePerksChange = (perk, checked) => {
    setFormData(prev => ({
      ...prev,
      perks: checked
        ? [...prev.perks, perk]
        : prev.perks.filter(p => p !== perk)
    }));
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage('');
  setError('');

  try {
    const response = await fetch(`/api/editcard/${params.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Update failed");
    }

    setMessage("Successfully Updated");

    setTimeout(() => {
      router.push('/admin/cards');
    }, 1000);

  } catch (err) {
    setError(err.message);
  }
};


  

  const allPerks = [
    'LOUNGE_ACCESS',
    'TRAVEL_INSURANCE',
    'FUEL_WAIVER',
    'AMAZON_PRIME',
    'MOVIE_OFFER',
    'DINING_DISCOUNT',
    'TRAVEL_VOUCHER',
    'CONCIERGE',
    'BUSINESS_BENEFITS'
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black/95 backdrop-blur-xl  border-gray-900/50 sticky top-0 z-40">
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
                Edit Credit Card
              </h1>
              <p className="text-gray-500 mt-2 text-sm">Card ID: {params.id}</p>
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

          {/* Success */}
          {message && (
            <div className="mb-4 rounded-xl p-3 text-center text-sm bg-green-950/50 border border-green-900/50 text-green-400">
              {message}
            </div>
          )}


        <form onSubmit={handleSubmit} className="bg-gray-950/50 rounded-xl border border-gray-800/50 p-8 space-y-8">
          
          {/* Basic Card Info */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-200  border-gray-800/50 pb-3">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Bank</label>
                <input
                  type="text"
                  name="bank"
                  value={formData.bank}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                  placeholder="e.g., HDFC"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Card Name</label>
                <input
                  type="text"
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                  placeholder="e.g., Millennia Credit Card"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Network</label>
                <select
                  name="network"
                  value={formData.network}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                >
                  <option value="Visa">Visa</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="RuPay">RuPay</option>
                  <option value="Amex">Amex</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Card Type</label>
                <select
                  name="cardType"
                  value={formData.cardType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                >
                  <option value="Cashback">Cashback</option>
                  <option value="Travel">Travel</option>
                  <option value="Fuel">Fuel</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Basic">Basic</option>
                </select>
              </div>
            </div>
          </div>

          {/* Rewards & Benefits */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-200  border-gray-800/50 pb-3">Rewards & Benefits</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Reward Type</label>
                <select
                  name="rewardType"
                  value={formData.rewardType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                >
                  <option value="cashback">Cashback</option>
                  <option value="points">Points</option>
                  <option value="miles">Miles</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Base Reward Rate</label>
                <input
                  type="number"
                  name="baseRewardRate"
                  value={formData.baseRewardRate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                  placeholder="0"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">Reward Rate Text</label>
                <input
                  type="text"
                  name="rewardRateText"
                  value={formData.rewardRateText}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                  placeholder="e.g., 5% cashback on Amazon, Flipkart, Myntra"
                />
              </div>
            </div>

            {/* Category Multipliers */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Category Multipliers</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {['shopping', 'travel', 'fuel', 'dining', 'groceries'].map(category => (
                  <div key={category}>
                    <label className="block text-xs text-gray-500 mb-1 capitalize">{category}</label>
                    <input
                      type="number"
                      value={formData.categories[category]}
                      onChange={(e) => handleCategoryChange(category, e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900/60 border border-gray-700/50 rounded-lg text-gray-100 focus:outline-none focus:border-gray-500/50"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Best For (comma separated)</label>
              <input
                type="text"
                value={formData.bestFor.join(', ')}
                onChange={handleBestForChange}
                className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                placeholder="e.g., Online Shopping, Amazon, Flipkart"
              />
            </div>
          </div>

          {/* Perks */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-200  border-gray-800/50 pb-3">Perks</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {allPerks.map(perk => (
                <label key={perk} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.perks.includes(perk)}
                    onChange={(e) => handlePerksChange(perk, e.target.checked)}
                    className="w-4 h-4 bg-gray-900/60 border-gray-700/50 rounded text-gray-900 focus:ring-gray-500"
                  />
                  <span className="text-sm text-gray-300">{perk.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Fees */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-200  border-gray-800/50 pb-3">Fees</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Joining Fee (₹)</label>
                <input
                  type="number"
                  value={formData.fees.joining}
                  onChange={(e) => handleNestedChange('fees', 'joining', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Annual Fee (₹)</label>
                <input
                  type="number"
                  value={formData.fees.annual}
                  onChange={(e) => handleNestedChange('fees', 'annual', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Waiver Spend (₹)</label>
                <input
                  type="number"
                  value={formData.fees.waiverSpend}
                  onChange={(e) => handleNestedChange('fees', 'waiverSpend', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Eligibility */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-200  border-gray-800/50 pb-3">Eligibility</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Minimum Income (₹)</label>
                <input
                  type="number"
                  value={formData.eligibility.minIncome}
                  onChange={(e) => handleNestedChange('eligibility', 'minIncome', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Minimum Credit Score</label>
                <input
                  type="number"
                  value={formData.eligibility.minCreditScore}
                  onChange={(e) => handleNestedChange('eligibility', 'minCreditScore', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Limits */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-200  border-gray-800/50 pb-3">Credit Limits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Maximum Limit (₹)</label>
                <input
                  type="number"
                  value={formData.limits.max}
                  onChange={(e) => handleNestedChange('limits', 'max', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Available Limit (₹)</label>
                <input
                  type="number"
                  value={formData.limits.available}
                  onChange={(e) => handleNestedChange('limits', 'available', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Other */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-200  border-gray-800/50 pb-3">Other Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Billing Date (1-31)</label>
                <input
                  type="number"
                  name="billingDate"
                  value={formData.billingDate}
                  onChange={handleChange}
                  min="1"
                  max="31"
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Popularity Score</label>
                <input
                  type="number"
                  name="popularityScore"
                  value={formData.popularityScore}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 focus:outline-none focus:border-gray-500/50"
                  placeholder="0"
                />
              </div>
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Page;