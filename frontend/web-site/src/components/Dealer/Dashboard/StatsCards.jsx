export default function StatsCards({ stats }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                    <div key={idx} className="bg-white border border-emerald-100/50 rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                    {stat.label}
                                </p>
                                <h3 className="text-xl md:text-2xl font-bold text-neutral-800 mt-2">
                                    {stat.value}
                                </h3>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.textColor}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-1.5">
                            <span className={`text-xs font-medium ${stat.textColor}`}>
                                {stat.change}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
