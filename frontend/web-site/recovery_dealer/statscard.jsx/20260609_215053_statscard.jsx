// src/components/StatsCard.jsx
export default function StatsCard({ icon: Icon, label, value, iconBg, valueColor }) {
    return (
        <div className="bg-white border border-neutral-100 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[11px] text-neutral-500 font-medium">{label}</p>
                <p className={`text-2xl font-extrabold leading-tight ${valueColor}`}>{value}</p>
            </div>
        </div>
    );
}