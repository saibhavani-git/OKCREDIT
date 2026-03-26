"use client";

import React from "react";

export default function ProgressBar({ currentStep = 1, totalSteps = 5 }) {
  const pct = Math.round((currentStep / totalSteps) * 100);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-400">Step {currentStep} of {totalSteps}</p>
        <p className="text-xs text-gray-500">{pct}%</p>
      </div>
      <div className="h-2 rounded-full bg-gray-800/70 overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg,#7a7a7a,#ffffff,#7a7a7a)",
          }}
        />
      </div>
    </div>
  );
}
