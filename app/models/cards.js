import mongoose from "mongoose";
const Schema = mongoose.Schema;

const CreditCardSchema = new Schema({
  /* ---------- BASIC CARD INFO ---------- */
  bank: {
    type: String,
    required: true
  },
  cardName: {
    type: String,
    required: true
  },
  network: {
    type: String,
    enum: ['Visa', 'Mastercard', 'RuPay', 'Amex'],
    required: true
  },
  cardType: {
    type: String,
    enum: ['Cashback', 'Travel', 'Fuel', 'Shopping', 'Basic'],
    required: true
  },

  /* ---------- REWARDS & BENEFITS ---------- */
  rewardType: {
    type: String,
    enum: ['cashback', 'points', 'miles'],
    required: true
  },

  baseRewardRate: {
    type: Number, // e.g. 0.5 (% or points per ₹100)
    default: 0
  },

  categories: {
    shopping: { type: Number, default: 1 },
    travel: { type: Number, default: 1 },
    fuel: { type: Number, default: 1 },
    dining: { type: Number, default: 1 },
    groceries: { type: Number, default: 1 }
  },

  bestFor: [{
    type: String
  }],

  rewardRateText: {
    type: String // "5% cashback", "10X points"
  },

  perks: {
    loungeAccess: { type: Boolean, default: false },
    fuelWaiver: { type: Boolean, default: false },
    amazonPrime: { type: Boolean, default: false }
  },

  /* ---------- FEES ---------- */
  annualFee: {
    type: Number,
    default: 0
  },
  joiningFee: {
    type: Number,
    default: 0
  },
  feeWaiverSpend: {
    type: Number // yearly spend for fee waiver
  },

  /* ---------- ELIGIBILITY ---------- */
  eligibility: {
    minIncome: {
      type: Number
    },
    minCreditScore: {
      type: Number
    }
  },

  /* ---------- USER-SPECIFIC DATA ---------- */
  maxLimit: {
    type: Number,
    required: true
  },
  availableLimit: {
    type: Number,
    required: true
  },
  billingDate: {
    type: Number // 1–31
  },

  /* ---------- META ---------- */
  image: {
    type: String // card image URL
  },
  popularityScore: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

export default mongoose.models.CreditCard || mongoose.model('CreditCard', CreditCardSchema);