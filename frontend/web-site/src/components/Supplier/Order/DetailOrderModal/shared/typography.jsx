export function InfoRow({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-neutral-400 uppercase tracking-wide font-medium">{label}</span>
      <span className="text-sm font-medium text-gray-800">{children}</span>
    </div>
  );
}

export function MetaItem({ icon, label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-medium uppercase tracking-wide">
        {icon}{label}
      </div>
      <p className="text-sm font-semibold text-gray-800">{children}</p>
    </div>
  );
}

export function SummaryRow({ label, value, className = "" }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className={`font-medium text-gray-800 ${className}`}>{value}</span>
    </div>
  );
}
