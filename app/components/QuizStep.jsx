"use client";

import React from "react";
import OptionCard from "./OptionCard";

export default function QuizStep({
  title,
  subtitle,
  options,
  selectedValue,
  selectedValues,
  onSelect,
  multi = false,
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
        
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => {
          const isSelected = multi
            ? Array.isArray(selectedValues) && selectedValues.includes(opt.value)
            : selectedValue === opt.value;
          return (
            <OptionCard
              key={opt.value}
              title={opt.label}
              subtitle={opt.subtitle}
              icon={opt.icon}
              selected={isSelected}
              onClick={() => onSelect(opt.value)}
              multi={multi}
            />
          );
        })}
      </div>
    </section>
  );
}
