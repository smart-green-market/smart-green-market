export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export function formatPhone(phone) {
  if (!phone) return "—";
  return phone.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");
}

export function InfoField({ label, value, wide = false }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || "—"}</p>
    </div>
  );
}

export function Badge({ label, variant = "default" }) {
  const styles = {
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    yellow: "bg-yellow-50 text-yellow-800 border border-yellow-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    gray: "bg-gray-100 text-gray-600 border border-gray-200",
    default: "bg-gray-100 text-gray-600 border border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[variant]}`}>
      {label}
    </span>
  );
}
