const OPTIONS = [
    { label: "TẤT CẢ", value: "" },
    { label: "ĐANG HOẠT ĐỘNG", value: "active" },
    { label: "TẠM KHÓA", value: "inactive" },
    { label: "TỪ CHỐI", value: "rejected" },
    { label: "CHỜ DUYỆT", value: "pending" },
];

export default function DealerFilter({ value, onChange }) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            {OPTIONS.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors font-['Geist',sans-serif] ${
                        value === opt.value
                            ? "bg-emerald-800 text-white"
                            : "bg-stone-100 text-neutral-600 hover:bg-stone-200"
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

export function getDealerDisplayStatus(dealer) {
    if (!dealer) return "pending";

    if (dealer.status === "pending" || dealer.status === "rejected") {
        return dealer.status;
    }

    if (dealer.status === "active") {
        return dealer.account_status || dealer.account?.status || "active";
    }

    return dealer.status;
}
