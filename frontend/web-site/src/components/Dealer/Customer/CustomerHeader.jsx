import { Download, Plus, Users, Award, TrendingUp } from "lucide-react";

export default function CustomerHeader({
  loading,
  pagination,
  customers,
  onExport,
  onAdd,
}) {
  const activeCount = customers.filter((c) => c.status === "active").length;
  const totalOrders = customers.reduce((sum, c) => sum + (c.total_orders || 0), 0);
  const activePercentage = !loading && pagination?.count > 0
    ? Math.round((activeCount / customers.length) * 100)
    : 0;

  return (
    <>
      {/* Header Info & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Quản lý Khách hàng</h1>
          <p className="text-sm text-neutral-500 font-medium mt-1">
            Phân tích và chăm sóc tập khách hàng đại lý.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-sm font-bold transition-colors"
          >
            <Download className="w-4 h-4" /> Xuất báo cáo
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#006A3A] hover:bg-[#005A30] text-white rounded-xl text-sm font-bold transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" /> Thêm khách hàng
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1 - Tổng khách hàng */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-500 mb-1">Tổng khách hàng</p>
            <h2 className="text-4xl font-black text-neutral-900 tracking-tight">
              {loading ? "..." : pagination?.count || 0}
            </h2>
          </div>
        </div>

        {/* Card 2 - Hoạt động */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Award className="w-5 h-5" />
            </div>
            <div className="bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-full text-xs font-bold">
              Trạng thái
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-500 mb-1">Đang hoạt động</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-black text-neutral-900 tracking-tight">
                {loading ? "..." : activeCount}
              </h2>
              <span className="text-sm font-bold text-neutral-400">
                / {activePercentage}% tổng số
              </span>
            </div>
          </div>
        </div>

        {/* Card 3 - Tổng đơn hàng */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-500 mb-1">Tổng đơn hàng</p>
            <h2 className="text-4xl font-black text-neutral-900 tracking-tight">
              {loading ? "..." : totalOrders}
            </h2>
          </div>
        </div>
      </div>
    </>
  );
}
