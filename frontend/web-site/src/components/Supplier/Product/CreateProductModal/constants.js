// ── CSS class tokens ────────────────────────────────────────────
export const inputCls =
  "w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors placeholder:text-zinc-300 disabled:bg-zinc-50 disabled:text-zinc-400";

export const selectCls =
  "w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors bg-white disabled:bg-zinc-50 disabled:text-zinc-400";

export const labelCls = "text-xs text-zinc-500 block mb-1";

// ── Unit options ─────────────────────────────────────────────────
export const UNIT_OPTIONS = [
  { value: "kg",    label: "kg" },
  { value: "g",     label: "g" },
  { value: "box",   label: "thùng" },
  { value: "bunch", label: "bó" },
  { value: "piece", label: "cái / trái" },
];

// ── Input key blockers ───────────────────────────────────────────
export const blockInvalidNumberKeys = (e) => {
  if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
};

export const blockDecimalKeys = (e) => {
  if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
};

// ── UI colour tokens per mode ────────────────────────────────────
export function getModeTokens(isPersonal) {
  return {
    headerColor: isPersonal ? "text-blue-950"  : "text-emerald-950",
    accentColor: isPersonal ? "text-blue-700"  : "text-green-700",
    ringColor:   isPersonal ? "focus:ring-blue-500" : "focus:ring-green-600",
    btnColor:    isPersonal ? "bg-blue-700 hover:bg-blue-800" : "bg-green-700 hover:bg-green-800",
    tipBg:       isPersonal ? "bg-blue-50 border-blue-200"   : "bg-green-50 border-green-200",
    tipText:     isPersonal ? "text-blue-700"  : "text-green-700",
    tipTitle:    isPersonal ? "text-blue-900"  : "text-green-900",
  };
}

// ── Parse response lồng 2 tầng: response.results[].results[] ────
export function extractProductList(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.results)) {
    const first = response.results[0];
    if (first && Array.isArray(first.results)) {
      return response.results.flatMap((r) => r.results ?? []);
    }
    return response.results;
  }
  return [];
}

// ── Default form state ───────────────────────────────────────────
export const DEFAULT_FORM = {
  name: "",
  unit: "kg",
  category: "",
  wholesale_price: "",
  daily_production_capacity: "",
  description: "",
  storage_duration_days: "",
  min_storage_temp: "",
  max_storage_temp: "",
};
