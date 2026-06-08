const OPTIONS = [
    { label: "TẤT CẢ",         value: "" },
    { label: "ĐÃ ĐỌC", value: "active" },
    { label: "CHƯA ĐỌC",        value: "rejected" },
    { label: "THÔNG BÁO",        value: "info" },
    { label: "CẢNH BÁO",        value: "warning" },
    { label: "THÀNH CÔNG",        value: "success" },
    { label: "THẤT BẠI",        value: "error" },
    { label: "GIẤY TỜ",        value: "supplier_document" },
    { label: "CHỨNG CHỈ",        value: "certification" },
    { label: "DANH MỤC",        value: "category" },
    { label: "NHÀ CUNG CẤP",        value: "supplier" },
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