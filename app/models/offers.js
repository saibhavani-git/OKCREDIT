import mongoose from "mongoose";
const OfferSchema = new mongoose.Schema({
  merchant: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  rewardType: {
    type: String,
    enum: ['CASHBACK', 'REWARD_POINTS', 'DISCOUNT'],
    required: true
  },

  rewardValue: {
    type: Number,
    required: true
  },

  validCards: [
    {
      bank: String,
      cardName: String,
     
    }
  ],

  minTransactionAmount: {
    type: Number,
    default: 0
  },

  maxRewardCap: {
    type: Number // monthly or per transaction cap
  },

  validFrom: {
    type: Date,
    required: true
  },

  validTill: {
    type: Date,
    required: true
  },

  priority: {
    type: Number,
    default: 1
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });


export default mongoose.models.Offer ||
  mongoose.model('Offer', OfferSchema);