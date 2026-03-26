"use client";

import React from "react";

export default function OptionCard({
  title,
  subtitle,
  icon,
  selected,
  onClick,
  multi = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 transition-all ${
        selected
          ? "border-gray-500 bg-gray-800/70 ring-1 ring-gray-600/50"
          : "border-gray-800/60 bg-gray-900/60 hover:bg-gray-800/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl border border-gray-700/60 bg-gray-900/70 flex items-center justify-center text-gray-300">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold">{title}</p>
          {subtitle ? <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p> : null}
        </div>
        <div
          className={`mt-1 w-5 h-5 rounded-full border ${
            selected ? "bg-gray-200 border-gray-200" : "border-gray-600"
          }`}
          aria-hidden
        />
      </div>
      {multi ? <p className="text-[11px] text-gray-500 mt-3">Multi-select enabled</p> : null}
    </button>
  );
}
