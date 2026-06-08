const OPTIONS = [
    {
        label: "TẤT CẢ",
        value: "",
    },

    {
        label: "ĐANG HOẠT ĐỘNG",
        value: "approved",
    },

    {
        label: "TỪ CHỐI",
        value: "rejected",
    },

    {
        label: "ĐĂNG KÝ",
        value: "pending",
    },
];

export default function Filter({
    value,
    onChange,
}) {
    return (
        <div className="flex items-center gap-2 flex-wrap">
            {OPTIONS.map((opt) => (
                <button
                    key={opt.label}
                    onClick={() =>
                        onChange(opt.value)
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer
                    ${
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