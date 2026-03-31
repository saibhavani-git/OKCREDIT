import { NextResponse } from "next/server";

const ML_BASE = process.env.ML_FASTAPI_URL || "http://127.0.0.1:8000";

/**
 * POST /api/predict-monthly-spend
 * Proxies to FastAPI /predict-next-month-spend.
 * Body: { history: [ { month, food, groceries, ... }, ... ], predict_month?: "YYYY-MM" }
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!Array.isArray(body.history) || body.history.length === 0) {
      return NextResponse.json(
        { message: "history must be a non-empty array of monthly rows" },
        { status: 400 }
      );
    }

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`${ML_BASE.replace(/\/$/, "")}/predict-next-month-spend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        history: body.history,
        predict_month: body.predict_month || null,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(t);

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { message: data.detail || data.message || "ML service error", ml_service: false },
        { status: res.status === 503 ? 503 : 502 }
      );
    }

    return NextResponse.json({ ...data, ml_service: true });
  } catch (e) {
    console.error("[predict-monthly-spend]", e);
    return NextResponse.json(
      {
        message:
          "Could not reach ML service. Start uvicorn and train monthly_category_spend_xgb.joblib.",
        ml_service: false,
      },
      { status: 503 }
    );
  }
}
