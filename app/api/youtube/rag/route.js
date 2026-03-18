import { NextResponse } from "next/server";
import dbConnect from "../../../lib/db";
import Tip from "../../../models/Tip";
import YoutubeChunk from "../../../models/YoutubeChunk";
import OpenAI from "openai";
import { YoutubeTranscript } from "youtube-transcript";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const YOUTUBE_SEARCH_QUERIES = [
  "credit card tricks India",
  "maximize credit card rewards",
  "credit card hacks",
];

// Shorts from these finance/credit card channels only (max 5 shorts total)
const SHORTS_CHANNEL_QUERIES = [
  "Finance with Sharan",
  "The Credit Card Guy",
  "creditcarguy",
];
const MAX_SHORTS = 5;

// Curated video IDs to pass to Gemini when search fails (finance/credit card shorts)
const CURATED_VIDEO_IDS = [
  "63roiyFLuz8",
  "f2j1miuz-VI",
  "IQy3F62Rl08",
  "umyjsY_r2ZQ",
  "JSSzeVk-wUo",
];

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const TOP_K_CHUNKS = 10;
const CATEGORIES = ["groceries", "dining", "shopping", "travel", "fuel", "others"];
const GEMINI_EMBED_MODEL = "gemini-embedding-001";
const GEMINI_GEN_MODEL = "gemini-flash-latest";
const GEMINI_EMBED_DIM = 3072;

const EXTRACTION_PROMPT = `From the provided transcript context, extract useful credit card tricks or tips.
Return a JSON array of objects. Each object must have exactly:
{ "category": one of [groceries, dining, shopping, travel, fuel, others], "tip": "short actionable advice about maximizing credit card rewards", "source": "youtube" }
Only include meaningful financial advice. If no valid tips found, return [].
Transcript context:
`;

function buildGeminiTipsPrompt(videoIds) {
  const idList = (videoIds && videoIds.length) ? videoIds.join(", ") : "none";
  return `You are a credit card and rewards expert. Generate 12-18 short, actionable credit card tips for Indian users. These tips should be the kind of advice popular finance creators like "Finance with Sharan" and "The Credit Card Guy" share (rewards, cashback, fees, usage hacks, eligibility).

YouTube video IDs for context (you don't have access to the videos; use your knowledge of this type of content): ${idList}

Return a JSON object with a single key "tips" containing an array of objects. Each object must have:
- "category": exactly one of [groceries, dining, shopping, travel, fuel, others]
- "tip": one short actionable sentence (e.g. "Use a cashback card for fuel to get 2-5% back.")
- "source": "youtube"

Example: { "tips": [ { "category": "fuel", "tip": "Use a fuel surcharge waiver card or fuel-specific card to save on petrol spends.", "source": "youtube" }, ... ] }

Respond with only the JSON object, no markdown or extra text.`;
}

async function geminiEmbed(apiKey, text) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBED_MODEL}:embedContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model: `models/${GEMINI_EMBED_MODEL}`,
        content: { parts: [{ text }] },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini embed: ${res.status} ${err}`);
  }
  const data = await res.json();
  const values = data.embedding?.values ?? data.embeddings?.[0]?.values;
  return Array.isArray(values) ? values : null;
}

async function geminiGenerateContent(apiKey, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_GEN_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini generate: ${res.status} ${err}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text != null ? String(text).trim() : "";
}

function chunkText(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  let start = 0;
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return chunks;
  while (start < clean.length) {
    let end = start + size;
    if (end < clean.length) {
      const lastSpace = clean.lastIndexOf(" ", end);
      if (lastSpace > start) end = lastSpace;
    }
    chunks.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;
    start = end - overlap;
    if (start < 0) start = 0;
  }
  return chunks.filter(Boolean);
}

function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

async function searchYouTube(query, apiKey, maxResults = 5) {
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(maxResults),
    key: apiKey,
  });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
  if (!res.ok) {
    const err = await res.text();
    console.error("[youtube/rag] YouTube API error:", res.status, err);
    return [];
  }
  const data = await res.json();
  return (data.items || []).map((item) => ({
    videoId: item.id?.videoId,
    title: item.snippet?.title || "",
  })).filter((item) => item.videoId);
}

async function getChannelIdByName(apiKey, channelQuery, logFn = () => {}) {
  const params = new URLSearchParams({
    part: "snippet",
    q: channelQuery,
    type: "channel",
    maxResults: "1",
    key: apiKey,
  });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
  if (!res.ok) return null;
  const data = await res.json();
  const channel = data.items?.[0];
  const channelId = channel?.id?.channelId || channel?.snippet?.channelId;
  if (channelId) logFn(`Resolved channel "${channelQuery}" -> ${channelId}`);
  return channelId || null;
}

async function searchVideosFromChannel(apiKey, channelId, maxResults = 5, shortOnly = true) {
  const params = new URLSearchParams({
    part: "snippet",
    channelId,
    type: "video",
    maxResults: String(maxResults),
    order: "date",
    key: apiKey,
  });
  if (shortOnly) params.set("videoDuration", "short");
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
  if (!res.ok) {
    const err = await res.text();
    console.error("[youtube/rag] YouTube search error:", res.status, err);
    return [];
  }
  const data = await res.json();
  return (data.items || []).map((item) => ({
    videoId: item.id?.videoId,
    title: item.snippet?.title || "",
  })).filter((item) => item.videoId);
}

async function searchShortsFromChannel(apiKey, channelId, maxResults = 5) {
  return searchVideosFromChannel(apiKey, channelId, maxResults, true);
}

// Uses youtube-transcript (fetches manual + auto captions from watch page)
async function fetchTranscript(videoId, logFn = () => {}) {
  const tryFetch = async (config = null) => {
    const segments = await YoutubeTranscript.fetchTranscript(videoId, config || undefined);
    return Array.isArray(segments) && segments.length > 0
      ? segments.map((s) => s.text || "").join(" ").trim()
      : null;
  };
  try {
    let text = await tryFetch();
    if (text) return text;
    text = await tryFetch({ lang: "en" });
    if (text) return text;
    logFn(`Transcript empty for ${videoId}`);
    return null;
  } catch (err) {
    try {
      const text = await tryFetch({ lang: "en" });
      if (text) return text;
    } catch (_) {
      // ignore
    }
    console.error(`[youtube/rag] Transcript fetch failed for ${videoId}:`, err.message);
    logFn(`Transcript fetch failed for ${videoId}: ${err.message}`);
    return null;
  }
}

export async function GET(request) {
  const logs = [];
  const log = (msg) => {
    logs.push(msg);
    console.log("[youtube/rag]", msg);
  };

  try {
    await dbConnect();

    const youtubeApiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const useGemini = Boolean(geminiKey);

    if (!useGemini && !youtubeApiKey) {
      return NextResponse.json(
        { message: "YOUTUBE_API_KEY or GOOGLE_API_KEY is required for transcript-based tips" },
        { status: 400 }
      );
    }
    if (!useGemini && !openaiKey) {
      return NextResponse.json(
        { message: "GEMINI_API_KEY or OPENAI_API_KEY is required for embeddings and extraction" },
        { status: 400 }
      );
    }

    const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

    const { searchParams } = new URL(request.url);
    const skipIngest = searchParams.get("skipIngest") === "true";
    const query = searchParams.get("query") || "credit card tips tricks rewards India";

    // Gemini-only path: pass video IDs to Gemini and get tips (no transcripts, no RAG)
    if (useGemini) {
      let videoIdsForGemini = [];
      if (youtubeApiKey && !skipIngest) {
        log("Step 1: Fetching up to 5 Shorts from Finance with Sharan & The Credit Card Guy...");
        const seen = new Set();
        const seenChannels = new Set();
        for (const channelQuery of SHORTS_CHANNEL_QUERIES) {
          const channelId = await getChannelIdByName(youtubeApiKey, channelQuery, log);
          if (!channelId || seenChannels.has(channelId)) continue;
          seenChannels.add(channelId);
          const perChannel = Math.ceil(MAX_SHORTS / 2);
          const items = await searchShortsFromChannel(youtubeApiKey, channelId, perChannel);
          for (const item of items) {
            if (item.videoId && !seen.has(item.videoId) && videoIdsForGemini.length < MAX_SHORTS) {
              seen.add(item.videoId);
              videoIdsForGemini.push(item.videoId);
            }
          }
          if (videoIdsForGemini.length >= MAX_SHORTS) break;
        }
      }
      if (videoIdsForGemini.length === 0) {
        log("Using curated video IDs for Gemini.");
        videoIdsForGemini = [...CURATED_VIDEO_IDS].slice(0, MAX_SHORTS);
      }
      log(`Asking Gemini for tips (video IDs: ${videoIdsForGemini.join(", ") || "none"}).`);
      const prompt = buildGeminiTipsPrompt(videoIdsForGemini);
      const content = await geminiGenerateContent(geminiKey, prompt) || "{}";
      let parsed = [];
      try {
        const obj = JSON.parse(content);
        if (Array.isArray(obj.tips)) parsed = obj.tips;
        else if (Array.isArray(obj)) parsed = obj;
        else if (obj && typeof obj.category === "string" && typeof obj.tip === "string") parsed = [obj];
      } catch {
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          try {
            parsed = JSON.parse(arrayMatch[0]);
          } catch {
            parsed = [];
          }
        }
      }
      const normalized = parsed
        .map((t) => {
          const category = CATEGORIES.includes((t.category || "").toLowerCase())
            ? (t.category || "others").toLowerCase()
            : "others";
          const tip = (t.tip || "").trim();
          if (!tip) return null;
          return { category, tip, source: "youtube" };
        })
        .filter(Boolean);
      log(`Gemini returned ${normalized.length} tips. Replacing previous YouTube tips...`);
      await Tip.deleteMany({ source: "youtube" });
      if (normalized.length > 0) await Tip.insertMany(normalized);
      const allTips = await Tip.find({ source: "youtube" }).sort({ createdAt: -1 }).limit(100).lean();
      return NextResponse.json({
        tips: allTips.map((t) => ({ category: t.category, tip: t.tip, source: t.source })),
        logs,
      });
    }

    let videoIds = [];
    if (!skipIngest) {
      log("Step 1: Fetching up to 5 Shorts from Finance with Sharan & The Credit Card Guy...");
      const seen = new Set();
      const seenChannels = new Set();
      for (const channelQuery of SHORTS_CHANNEL_QUERIES) {
        const channelId = await getChannelIdByName(youtubeApiKey, channelQuery, log);
        if (!channelId || seenChannels.has(channelId)) continue;
        seenChannels.add(channelId);
        const perChannel = Math.ceil(MAX_SHORTS / 2);
        const items = await searchShortsFromChannel(youtubeApiKey, channelId, perChannel);
        for (const item of items) {
          if (item.videoId && !seen.has(item.videoId) && videoIds.length < MAX_SHORTS) {
            seen.add(item.videoId);
            videoIds.push({ videoId: item.videoId, title: item.title });
          }
        }
        if (videoIds.length >= MAX_SHORTS) break;
      }
      if (videoIds.length === 0) {
        log("No Shorts found from those channels. Falling back to general credit card search...");
        for (const q of YOUTUBE_SEARCH_QUERIES) {
          const items = await searchYouTube(q, youtubeApiKey, 3);
          for (const item of items) {
            if (item.videoId && !seen.has(item.videoId)) {
              seen.add(item.videoId);
              videoIds.push({ videoId: item.videoId, title: item.title });
            }
          }
        }
      }
      if (videoIds.length > MAX_SHORTS) videoIds = videoIds.slice(0, MAX_SHORTS);
      log(`Using ${videoIds.length} videos (max ${MAX_SHORTS} Shorts from finance channels).`);
      if (videoIds.length === 0) log("YouTube search returned no videos. Check YOUTUBE_API_KEY and quota.");
    }

    const existingChunks = await YoutubeChunk.countDocuments();
    const compatibleChunkCount = useGemini
      ? await YoutubeChunk.countDocuments({ $expr: { $eq: [ { $size: "$embedding" }, GEMINI_EMBED_DIM ] } })
      : existingChunks;
    const needIngest = (useGemini ? compatibleChunkCount === 0 : existingChunks === 0) && videoIds.length > 0;
    if (needIngest && videoIds.length > 0) {
      log("Step 2: Fetching transcripts and chunking...");
      let allChunks = [];
      for (const { videoId, title } of videoIds) {
        const transcript = await fetchTranscript(videoId, log);
        if (!transcript) continue;
        const chunks = chunkText(transcript);
        for (let i = 0; i < chunks.length; i++) {
          allChunks.push({ videoId, videoTitle: title, chunkIndex: i, text: chunks[i] });
        }
      }
      if (allChunks.length === 0 && videoIds.length > 0) {
        log("Shorts had no captions. Trying regular videos from same channels (more likely to have captions)...");
        const seen = new Set(videoIds.map((v) => v.videoId));
        const seenChannels = new Set();
        for (const channelQuery of SHORTS_CHANNEL_QUERIES) {
          const channelId = await getChannelIdByName(youtubeApiKey, channelQuery, log);
          if (!channelId || seenChannels.has(channelId)) continue;
          seenChannels.add(channelId);
          const items = await searchVideosFromChannel(youtubeApiKey, channelId, 4, false);
          for (const item of items) {
            if (!item.videoId || seen.has(item.videoId)) continue;
            seen.add(item.videoId);
            const transcript = await fetchTranscript(item.videoId, log);
            if (!transcript) continue;
            const chunks = chunkText(transcript);
            for (let i = 0; i < chunks.length; i++) {
              allChunks.push({ videoId: item.videoId, videoTitle: item.title, chunkIndex: i, text: chunks[i] });
            }
            if (allChunks.length > 0) break;
          }
          if (allChunks.length > 0) break;
        }
        if (allChunks.length === 0) {
          log("No captions from channel videos. Trying general credit card search...");
          const extraQueries = ["credit card rewards India", "best credit card India"];
          for (const q of extraQueries) {
            const items = await searchYouTube(q, youtubeApiKey, 3);
            for (const item of items) {
              if (item.videoId && !seen.has(item.videoId)) {
                seen.add(item.videoId);
                const transcript = await fetchTranscript(item.videoId, log);
                if (!transcript) continue;
                const chunks = chunkText(transcript);
                for (let i = 0; i < chunks.length; i++) {
                  allChunks.push({ videoId: item.videoId, videoTitle: item.title, chunkIndex: i, text: chunks[i] });
                }
              }
            }
          }
        }
      }
      log(`Chunked into ${allChunks.length} pieces.`);

      if (allChunks.length > 0) {
        log("Step 3: Generating embeddings...");
        if (useGemini) {
          for (let i = 0; i < allChunks.length; i++) {
            try {
              const vec = await geminiEmbed(geminiKey, allChunks[i].text);
              if (Array.isArray(vec) && vec.length > 0) allChunks[i].embedding = vec;
            } catch (e) {
              log(`Gemini embed failed for chunk ${i}: ${e.message}`);
            }
          }
        } else {
          const embeddingModel = "text-embedding-3-small";
          for (let i = 0; i < allChunks.length; i += 20) {
            const batch = allChunks.slice(i, i + 20);
            const inputs = batch.map((c) => c.text);
            try {
              const resp = await openai.embeddings.create({
                model: embeddingModel,
                input: inputs,
              });
              const data = resp.data || [];
              for (let j = 0; j < batch.length; j++) {
                const vec = data[j]?.embedding;
                if (Array.isArray(vec)) allChunks[i + j].embedding = vec;
              }
            } catch (e) {
              log(`Embedding batch failed: ${e.message}`);
            }
          }
        }
        const toInsert = allChunks.filter((c) => c.embedding?.length > 0);
        if (toInsert.length > 0) {
          await YoutubeChunk.insertMany(toInsert);
          log(`Step 4: Stored ${toInsert.length} chunks in vector store.`);
        }
      }
    } else if (existingChunks > 0) {
      log(`Using ${useGemini ? compatibleChunkCount : existingChunks} compatible existing chunks (skipIngest=${skipIngest}).`);
    }

    let chunksInDb = await YoutubeChunk.find({ embedding: { $exists: true, $ne: [] } }).lean();
    if (useGemini) {
      chunksInDb = chunksInDb.filter((c) => Array.isArray(c.embedding) && c.embedding.length === GEMINI_EMBED_DIM);
    }
    if (chunksInDb.length === 0) {
      const hint = logs.some((l) => String(l).includes("Transcript fetch failed") || String(l).includes("Chunked into 0"))
        ? " No captions were found on the searched videos, or embedding failed. See logs below."
        : " Ensure skipIngest is not set and try again.";
      return NextResponse.json({
        message: "No transcript chunks available." + hint,
        tips: [],
        logs,
      });
    }

    log("Step 5: Retrieving relevant chunks (RAG)...");
    let queryVec;
    if (useGemini) {
      queryVec = await geminiEmbed(geminiKey, query);
    } else {
      const queryEmbeddingResp = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });
      queryVec = queryEmbeddingResp.data?.[0]?.embedding;
    }
    if (!queryVec?.length) {
      return NextResponse.json({ message: "Failed to embed query", tips: [], logs }, { status: 500 });
    }

    const withScore = chunksInDb.map((c) => ({
      ...c,
      score: cosineSimilarity(c.embedding, queryVec),
    }));
    withScore.sort((a, b) => (b.score || 0) - (a.score || 0));
    const topChunks = withScore.slice(0, TOP_K_CHUNKS);
    const contextText = topChunks.map((c) => c.text).join("\n\n");

    log("Step 6: Extracting tips with LLM...");
    const fullPrompt = EXTRACTION_PROMPT + contextText + '\n\nRespond with only a JSON object: { "tips": [ { "category": "...", "tip": "...", "source": "youtube" }, ... ] }';
    let content;
    if (useGemini) {
      content = await geminiGenerateContent(geminiKey, fullPrompt) || "{}";
    } else {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: fullPrompt }],
      });
      content = completion.choices?.[0]?.message?.content?.trim() || "{}";
    }
    let parsed = [];
    try {
      const obj = JSON.parse(content);
      if (Array.isArray(obj.tips)) parsed = obj.tips;
      else if (Array.isArray(obj)) parsed = obj;
      else if (obj && typeof obj.category === "string" && typeof obj.tip === "string") parsed = [obj];
      else parsed = [];
    } catch {
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          parsed = JSON.parse(arrayMatch[0]);
        } catch {
          parsed = [];
        }
      }
    }

    const normalized = parsed
      .map((t) => {
        const category = CATEGORIES.includes((t.category || "").toLowerCase())
          ? (t.category || "others").toLowerCase()
          : "others";
        const tip = (t.tip || "").trim();
        if (!tip) return null;
        return { category, tip, source: "youtube" };
      })
      .filter(Boolean);

    log(`Extracted ${normalized.length} tips. Deduplicating and saving...`);
    const inserted = [];
    for (const t of normalized) {
      const existing = await Tip.findOne({ tip: t.tip });
      if (existing) continue;
      await Tip.create(t);
      inserted.push(t);
    }
    log(`Stored ${inserted.length} new tips (${normalized.length - inserted.length} duplicates skipped).`);

    const allTips = await Tip.find({ source: "youtube" }).sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({
      tips: allTips.map((t) => ({
        category: t.category,
        tip: t.tip,
        source: t.source,
      })),
      logs,
    });
  } catch (error) {
    console.error("[youtube/rag] Error:", error);
    return NextResponse.json(
      { message: error.message || "RAG pipeline failed", tips: [], logs },
      { status: 500 }
    );
  }
}
