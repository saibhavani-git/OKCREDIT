import mongoose from "mongoose";

const TipSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ["groceries", "dining", "shopping", "travel", "fuel", "others"],
    },
    tip: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      default: "youtube",
    },
    videoId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

TipSchema.index({ tip: 1 });
TipSchema.index({ category: 1 });

export default mongoose.models.Tip || mongoose.model("Tip", TipSchema);
