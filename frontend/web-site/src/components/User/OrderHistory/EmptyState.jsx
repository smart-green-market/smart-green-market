// ============================================================
// EmptyState.jsx — khi chưa có đơn hàng hoàn thành nào
// ============================================================
import React from "react";

const EmptyState = () => (
  <div className="bg-white rounded-2xl border border-gray-200 py-16 flex flex-col items-center text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    </div>
    <p className="text-[14px] font-medium text-gray-600 mb-1">Chưa có đơn hàng nào hoàn thành</p>
    <p className="text-[13px] text-gray-400">Các đơn hàng đã giao thành công sẽ xuất hiện ở đây.</p>
  </div>
);

export default EmptyState;