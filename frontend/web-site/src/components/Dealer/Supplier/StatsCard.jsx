export default function StatsCard({ icon: Icon, label, value, iconBg, valueColor }) {
    const textColor = iconBg.replace("bg-", "text-").replace("-50", "-700");
    return (
        <div className="bg-white border border-neutral-100 rounded-2xl p-5 md:p-6 flex items-center gap-4 shadow-xs transition-all hover:shadow-md min-h-[105px]">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${textColor}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs text-neutral-500 font-semibold tracking-wide uppercase mb-1">{label}</p>
                <p className={`text-2xl md:text-3xl font-black leading-tight ${valueColor}`}>{value}</p>
            </div>
        </div>
    );
}