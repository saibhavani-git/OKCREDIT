# XGBoost for quiz & “recommend a card to buy”

Both use the same hybrid: **rule engine** + small **XGBoost** boost.  
If you see **“XGBoost: off”** in the app, ML isn’t running yet — follow **Turn it on** below.

---

## Turn it on (checklist)

### 1. Python 3 + packages

```bash
python --version
# or on Windows:
py -3 --version
```

Install deps (use the same interpreter Next.js will call):

```bash
pip install xgboost joblib numpy
```

### 2. Train the model file

From the **project root** (this repo):

1. Put **`MONGODB_URI`** in `.env` and seed cards: `npm run seed`
2. Build training CSV from your DB:

   ```bash
   npm run synthetic-module2
   ```

3. Train:

   ```bash
   npm run train-xgboost-module2
   ```

You must get a file at:

**`ml_models/xgboost_module2_yearly.joblib`**

### 3. Point Next.js at Python (if it still says “off”)

Windows often doesn’t have `python` on PATH. Set in **`.env`** (use your real path):

```env
PYTHON_PATH=C:\Users\YOU\AppData\Local\Programs\Python\Python312\python.exe
```

Or if the `py` launcher works, the app will try **`py -3`** automatically on Windows.

### 4. Restart the dev server

Restart **`npm run dev`** after adding `.joblib` or changing `.env`.

---

## Env vars

| Variable | Purpose |
|----------|---------|
| `ML_XGBOOST_MODEL_PATH` / `ML_MODULE2_MODEL_PATH` | Optional full path to `.joblib` (default: `ml_models/xgboost_module2_yearly.joblib` under project root) |
| `PYTHON` / `PYTHON_PATH` | Python executable if `python` / `py -3` fail |

---

## Why it can stay “off”

- File **`xgboost_module2_yearly.joblib`** missing (training not run or wrong folder)
- Python not installed or not on PATH → set **`PYTHON_PATH`**
- Missing packages → `pip install xgboost joblib numpy`
- **`scripts/xgboost_predict_quiz.py`** missing from the repo

Rule-based recommendations still work; **`mlBoost`** is just **0**.

---

## What the model learns

Training rows are **(monthly ₹ per category + card id slot) → yearly reward** where the target is computed with the **same category rules** as the app. XGBoost learns extra interactions; at runtime the boost is **small** (`normalized × 0.1 × net value`) so **rules stay primary**.
