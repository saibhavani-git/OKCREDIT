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
  pointValueInr: {
    type: Number,
    default: null
  },
  pointValueSource: {
    type: String,
    default: ""
  },

  baseRewardRate: {
    type: Number,
    default: 0
  },

  categories: {
    shopping: { type: Number, default: 1 },
    travel: { type: Number, default: 1 },
    fuel: { type: Number, default: 1 },
    dining: { type: Number, default: 1 },
    groceries: { type: Number, default: 1 }
  },

  bestFor: [String],

  rewardRateText: {
    type: String
  },

  /* ---------- PERKS (FLEXIBLE) ---------- */
  perks: [{
    type: String,
    enum: [
      'LOUNGE_ACCESS',
      'TRAVEL_INSURANCE',
      'FUEL_WAIVER',
      'AMAZON_PRIME',
      'MOVIE_OFFER',
      'DINING_DISCOUNT',
      'TRAVEL_VOUCHER',
      'CONCIERGE',
      'BUSINESS_BENEFITS'
    ]
  }],

  /* ---------- FEES ---------- */
  fees: {
    joining: {
      type: Number,
      default: 0
    },
    annual: {
      type: Number,
      default: 0
    },
    waiverSpend: {
      type: Number
    }
  },

  /* ---------- ELIGIBILITY ---------- */
  eligibility: {
    minIncome: Number,
    minCreditScore: Number
  },

  /* ---------- USER-SPECIFIC DATA ---------- */
  limits: {
    max: {
      type: Number,
      required: true
    },
    available: {
      type: Number,
      required: true
    }
  },

  billingDate: {
    type: Number // 1–31
  },

  /* ---------- META ---------- */
  image: {
    type: String
  },
  popularityScore: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

export default mongoose.models.CreditCard ||
  mongoose.model('CreditCard', CreditCardSchema);
