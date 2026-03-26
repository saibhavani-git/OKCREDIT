/**
 * Batch XGBoost inference via Python + joblib (runs in Node API routes, not Edge).
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

/**
 * Try common Python invocations (Windows often has `py` but not `python` on PATH).
 */
function* pythonCandidates() {
  if (process.env.PYTHON_PATH) yield { cmd: process.env.PYTHON_PATH, args: [] };
  if (process.env.PYTHON && process.env.PYTHON !== process.env.PYTHON_PATH) {
    yield { cmd: process.env.PYTHON, args: [] };
  }
  if (process.platform === "win32") {
    yield { cmd: "py", args: ["-3"] };
  }
  yield { cmd: "python3", args: [] };
  yield { cmd: "python", args: [] };
}

function runPredict(scriptAbs, modelPathAbs, payload) {
  const input = JSON.stringify(payload);
  const tried = new Set();
  for (const { cmd, args: prefix } of pythonCandidates()) {
    const key = `${cmd} ${prefix.join(" ")}`;
    if (tried.has(key)) continue;
    tried.add(key);
    const argv = [...prefix, scriptAbs, modelPathAbs];
    const result = spawnSync(cmd, argv, {
      input,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      windowsHide: true,
    });
    if (result.error) continue;
    if (result.status !== 0) continue;
    return result;
  }
  return null;
}

export function predictXgbBatch(featureRows, modelPathAbs, logLabel = "[xgboost]") {
  if (!modelPathAbs || !fs.existsSync(modelPathAbs)) return null;
  const script = path.join(process.cwd(), "scripts", "xgboost_predict_quiz.py");
  if (!fs.existsSync(script)) return null;

  const result = runPredict(script, modelPathAbs, { X: featureRows });
  if (!result) {
    console.warn(
      `${logLabel} XGBoost predict failed: no working Python (install Python 3, pip install xgboost joblib numpy). Set PYTHON_PATH in .env to your python.exe. Model: ${modelPathAbs}`
    );
    return null;
  }
  try {
    const out = JSON.parse(result.stdout.trim());
    return Array.isArray(out.scores) ? out.scores : null;
  } catch {
    console.warn(`${logLabel} Invalid JSON from Python`);
    return null;
  }
}
