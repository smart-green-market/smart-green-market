const OPTIONS = [
    { label: "TẤT CẢ",         value: "" },
    { label: "ĐÃ DUYỆT", value: "approved" },
    { label: "TỪ CHỐI",        value: "rejected" },
    { label: "ĐĂNG KÝ",      value: "pending" },
];

export default function Filter({ value, onChange }) {
    return (
        <div className="flex items-center gap-2">
            {OPTIONS.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors font-['Geist',sans-serif] cursor-pointer
                        ${value === opt.value
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