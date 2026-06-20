import { Package, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function ProductStatsCards({ products }) {
  const stats = [
    {
      label: "Tổng sản phẩm",
      value: products.length || 0,
      icon: Package,
      color: "bg-emerald-500",
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-50"
    },
    {
      label: "Đang hiển thị",
      value: products.filter(p => p.status === "active").length || 0,
      icon: CheckCircle,
      color: "bg-blue-500",
      textColor: "text-blue-700",
      bgColor: "bg-blue-50"
    },
    {
      label: "Đã ẩn",
      value: products.filter(p => p.status !== "active").length || 0,
      icon: XCircle,
      color: "bg-neutral-500",
      textColor: "text-neutral-700",
      bgColor: "bg-neutral-50"
    },
    {
      label: "Sắp hết hàng",
      value: products.filter(p => p.sold > 100).length || 0, // Mock logic, có thể đổi theo stock thực
      icon: AlertTriangle,
      color: "bg-amber-500",
      textColor: "text-amber-700",
      bgColor: "bg-amber-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div key={idx} className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
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
          </div>
        );
      })}
    </div>
  );
}
