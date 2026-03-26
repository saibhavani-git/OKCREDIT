# OKCredit ML service (FastAPI + XGBoost / Decision Tree)

End-to-end flow for **transaction choice**, **monthly profile**, and **explainable quiz** models.

## 1. Python environment

```bash
cd ml_service
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

## 2. Export real cards to JSON

From **repository root**:

```bash
npm run ml:export-cards
```

Writes `ml_service/data/cards.json` from `app/data/creditCards.js`.

## 3. Generate datasets & train

Still from **repository root** (so `ml_service` stays on `sys.path` for `reward_math`):

```bash
python ml_service/generate_transaction_dataset.py --rows 80000
python ml_service/train_transaction_xgb.py

python ml_service/generate_monthly_dataset.py --rows 20000
python ml_service/train_monthly_xgb.py

python ml_service/generate_quiz_dataset.py --rows 6000
python ml_service/train_quiz_tree.py
```

Artifacts land in `ml_service/models/`:

- `transaction_xgb.joblib`
- `monthly_xgb.joblib`
- `quiz_tree.joblib`

**GPU:** training scripts try `tree_method="gpu_hist"` and fall back to `"hist"` if CUDA/XGBoost GPU is unavailable.

**Large CSVs:** For 1M+ rows, run `generate_transaction_dataset.py` multiple times with different `--seed` and append, or lower `--chunk-rows` (already streams in chunks).

## 4. Run FastAPI

```bash
cd ml_service
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- `GET /health` — model files loaded?
- `POST /predict-transaction` — `{ "category", "amount", "cashbacks": { "Card Name": 250, ... } }`
- `POST /predict-monthly` — `{ "total_spend", "spend_shopping", ... }`
- `POST /predict-quiz` — quiz feature payload (see `main.py`)

## 5. Next.js hybrid route

Set `ML_FASTAPI_URL` (default `http://127.0.0.1:8000`).

```http
POST /api/recommend-transaction
{ "category": "shopping", "amount": 5000 }
```

Response merges **rule cashback** (same engine as `app/lib/recommendCard.js`) with **ML probabilities** when the Python service is reachable.

## 6. JS reward engine (Step 1)

Reusable module: `app/lib/transactionRewardEngine.js` (used by `/api/recommend-transaction`).
