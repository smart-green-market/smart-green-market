import { Layers, Calendar, AlertCircle, User, Clock } from "lucide-react";

export default function CategoryInfoCard({ category }) {
  const getStatusBadge = (status) => {
    if (status === "Đang kinh doanh") {
      return (
        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50 flex items-center gap-1.5 w-fit shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Đang kinh doanh
        </span>
      );
    }
    return (
      <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/50 flex items-center gap-1.5 w-fit shadow-sm">
        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
        Tạm ngưng
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-lg p-6 mb-8 relative overflow-hidden font-['Geist',sans-serif] transition-all hover:shadow-xl">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-400/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start relative z-10">
        <div className="flex gap-5 items-start">
          {/* Icon/Avatar Category */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-700 border border-emerald-200/50 flex items-center justify-center shadow-inner shrink-0">
            <Layers className="w-8 h-8" strokeWidth={1.5} />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight">
                {category.name}
              </h1>
              {getStatusBadge(category.status)}
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-neutral-500 font-medium bg-neutral-50 px-2.5 py-1 rounded-md border border-neutral-100">
                Mã DM: <span className="font-bold text-neutral-700">{category.code}</span>
              </p>
              {category.created_by && (
                <p className="text-xs text-neutral-500 font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Người tạo: <span className="font-bold text-emerald-700">{category.created_by.profile_name || category.created_by.username}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-neutral-100/80"></div>

      {/* Description & Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        <div className="md:col-span-2 space-y-3 bg-neutral-50/50 p-4 rounded-xl border border-neutral-50">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            Mô tả danh mục
          </h3>
          <p className="text-sm text-neutral-700 leading-relaxed font-medium">
            {category.description || "Chưa có mô tả cho danh mục này."}
          </p>
        </div>

        <div className="space-y-5">
          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 flex items-center justify-between">
             <span className="text-[11px] uppercase font-bold text-emerald-800 tracking-wider">
               Sản phẩm
             </span>
             <span className="text-xl font-black text-emerald-700 bg-white px-3 py-1 rounded-lg shadow-sm border border-emerald-100">
               {category.product_count || 0}
             </span>
          </div>

          <div className="space-y-3 px-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Tạo lúc
              </span>
              <span className="font-bold text-neutral-700">
                {formatDate(category.created_at)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Cập nhật
              </span>
              <span className="font-bold text-neutral-700">
                {formatDate(category.updated_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
