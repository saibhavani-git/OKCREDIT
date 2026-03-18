import mongoose from "mongoose";

const YoutubeChunkSchema = new mongoose.Schema(
  {
    videoId: { type: String, required: true, index: true },
    videoTitle: { type: String, default: "" },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true }
);

YoutubeChunkSchema.index({ videoId: 1, chunkIndex: 1 });

export default mongoose.models.YoutubeChunk || mongoose.model("YoutubeChunk", YoutubeChunkSchema);
