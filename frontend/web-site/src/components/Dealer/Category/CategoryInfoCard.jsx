import { Layers, Calendar, AlertCircle } from "lucide-react";

export default function CategoryInfoCard({ category }) {
  const getStatusBadge = (status) => {
    if (status === "Đang kinh doanh") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50 flex items-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Đang kinh doanh
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/50 flex items-center gap-1.5 w-fit">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        Tạm ngưng
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 mb-8 relative overflow-hidden font-['Geist',sans-serif]">
      {/* Decorative background circle */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
        <div className="flex gap-4 items-start">
          {/* Icon/Avatar Category */}
          <div className="w-14 h-14 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shadow-sm shrink-0">
            <Layers className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-extrabold text-emerald-950 tracking-tight">
                {category.name}
              </h1>
              {getStatusBadge(category.status)}
            </div>
            <p className="text-xs text-neutral-400 font-medium">
              Mã danh mục:{" "}
              <span className="font-bold text-neutral-600">{category.code}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-neutral-100"></div>

      {/* Description & Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Mô tả danh mục
          </h3>
          <p className="text-xs text-neutral-650 leading-relaxed font-medium">
            {category.description || "Chưa có mô tả cho danh mục này."}
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                Số sản phẩm
              </span>
              <span className="text-xs font-extrabold text-emerald-700 leading-tight block">
                {category.count}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                Cập nhật lần cuối
              </span>
              <span className="text-xs font-bold text-neutral-700 leading-tight flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                10/06/2026
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
