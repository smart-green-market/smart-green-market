import { ArrowLeft } from "lucide-react";

export default function OrderDetailHeader({ orderData, onBack }) {
  return (
    <div>
      {/* 1. Thanh điều hướng phụ (Breadcrumbs) */}
      <div className="mb-6 flex items-center gap-2 text-sm text-neutral-500 font-medium">
        <span
          onClick={onBack}
          className="hover:text-emerald-700 cursor-pointer transition-colors"
        >
          Nhập hàng
        </span>
        <span className="text-neutral-300">/</span>
        <span className="text-emerald-700 font-semibold">
          Chi tiết phiếu nhập
        </span>
      </div>

      {/* 2. Tiêu đề chính & Trạng thái phiếu nhập */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs">
        <div className="flex items-center gap-4">
          {/* Nút quay lại trang danh sách */}
          <button
            onClick={onBack}
            className="p-2.5 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer text-neutral-600 border border-neutral-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 leading-tight">
              Phiếu Nhập Hàng
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              <span className="font-bold text-emerald-800">{orderData.id}</span>
              <span className="mx-2">•</span>
              Ngày tạo: {orderData.date}
            </p>
          </div>
        </div>

        {/* Trạng thái và Ngày giao dự kiến */}
        <div className="flex items-center gap-6 self-start md:self-auto">
          <div className="text-right">
            {/* <span className="inline-block bg-emerald-50 text-emerald-700 font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
              {orderData.status}
            </span> */}
            <p className="text-xs text-neutral-400 mt-1.5 font-medium">
              Giao dự kiến: {orderData.deliveryDate}
            </p>
            {
              orderData.completedAt && (
                <p className="text-xs text-emerald-600 mt-1.5 font-medium">
                  Hoàn thành: {orderData.completedAt}
                </p>
              )
            }
          </div >
        </div >
      </div >
    </div >
  );
}
