# API Keys & Environment Variables

Add these to your `.env` file in the project root.

---

## Required for core app

| Variable       | Purpose |
|----------------|---------|
| **MONGODB_URI** | MongoDB connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/okcredit`) |
| **JWT_SECRET**  | Secret used to sign and verify login tokens (use a long random string) |

---

## Required for YouTube Tips (RAG) feature

Used when you open **Tips** in the navbar and click **Refresh from YouTube**.

| Variable | Purpose |
|----------|---------|
| **YOUTUBE_API_KEY** or **GOOGLE_API_KEY** | YouTube Data API v3 key. Get it from [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create API Key, and enable **YouTube Data API v3**. |
| **OPENAI_API_KEY** | OpenAI API key for embeddings (`text-embedding-3-small`) and tip extraction (`gpt-4o-mini`). Get it from [platform.openai.com](https://platform.openai.com/api-keys). |

---

## Summary

- **Minimum to run the app:** `MONGODB_URI`, `JWT_SECRET`
- **To use Tips (YouTube RAG):** also `YOUTUBE_API_KEY` (or `GOOGLE_API_KEY`) and `OPENAI_API_KEY`

Example `.env`:

```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/okcredit
JWT_SECRET=your-long-random-secret-string

# Optional – for Navbar → Tips → Refresh from YouTube
YOUTUBE_API_KEY=your_youtube_data_api_v3_key
OPENAI_API_KEY=sk-your-openai-key
```
