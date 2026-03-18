import mongoose from "mongoose";

const { Schema } = mongoose;

const TransactionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    card: {
      type: Schema.Types.ObjectId,
      ref: "CreditCard",
      required: true,
    },
    cardName: {
      type: String,
      default: "",
    },

    // Original request context
    amount: {
      type: Number,
      required: true,
    },
    intent: {
      type: String,
      required: true,
    },
    resolvedCategory: {
      type: String,
      default: "shopping",
    },

    // Benefit breakdown as shown to the user when they paid
    cashback: {
      type: Number,
      default: 0,
    },
    rewards: {
      type: Number,
      default: 0,
    },
    rewardsValue: {
      type: Number,
      default: 0,
    },
    perksValue: {
      type: Number,
      default: 0,
    },
    totalBenefit: {
      type: Number,
      default: 0,
    },

    // Future: snapshot fields for credit score, statement period, etc.
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);

