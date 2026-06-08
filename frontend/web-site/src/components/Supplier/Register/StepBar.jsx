import React from "react";

const STEPS = [
  { label: "Tài khoản" },
  { label: "Hồ sơ" },
  { label: "Giấy tờ" },
];

export default function StepBar({ current }) {
  return (
    <div className="flex items-start w-full mb-9">
      {STEPS.map((s, i) => {
        const isDone = i < current;
        const isActive = i === current;

        return (
          <div key={i} className="flex flex-col items-center flex-1 relative">
            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={`absolute top-[18px] left-1/2 w-full h-[2px] z-0 transition-colors duration-400 ${
                  isDone ? "bg-emerald-400" : "bg-gray-200"
                }`}
              />
            )}

            {/* Circle */}
            <div
              className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300
                ${isDone ? "bg-emerald-400 border-emerald-400 text-white shadow-[0_0_0_4px_rgba(52,211,153,0.2)]" : ""}
                ${isActive ? "bg-[#006c49] border-[#006c49] text-white shadow-[0_0_0_5px_rgba(0,108,73,0.18)] scale-110" : ""}
                ${!isDone && !isActive ? "bg-white border-gray-200 text-gray-400" : ""}
              `}
            >
              {isDone ? "✓" : i + 1}
            </div>

            {/* Label */}
            <span
              className={`text-[11px] font-medium mt-2 text-center whitespace-nowrap transition-colors duration-300
                ${isDone ? "text-emerald-500" : ""}
                ${isActive ? "text-[#006c49] font-bold" : ""}
                ${!isDone && !isActive ? "text-gray-400" : ""}
              `}
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
