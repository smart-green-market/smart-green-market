import { getPreOrderStatusMeta } from "../../utils/preorderStatusConfig";

export default function PreOrderStatusBadge({
  status,
  audience = "buyer",
  compact = false,
  showIcon = true,
  className = "",
}) {
  const meta = getPreOrderStatusMeta(status, audience);
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ${meta.bg} ${meta.text} ${meta.ring} ${
        compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
      } ${className}`}
    >
      {showIcon ? <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} /> : null}
      {meta.label}
    </span>
  );
}
