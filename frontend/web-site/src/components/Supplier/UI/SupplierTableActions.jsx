const VARIANT_CLASS = {
  default: "text-neutral-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200",
  warning: "text-neutral-600 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-200",
  danger: "text-neutral-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200",
};

export function SupplierActionButton({
  label,
  onClick,
  variant = "default",
  disabled = false,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 text-xs font-semibold rounded-md border border-neutral-200 bg-white
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-['Geist',sans-serif]
        ${VARIANT_CLASS[variant] ?? VARIANT_CLASS.default} ${className}`}
    >
      {label}
    </button>
  );
}

export function SupplierActionGroup({ children }) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-0.5">
      {children}
    </div>
  );
}
