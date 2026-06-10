import React from "react";

export default function LeftPanel() {
  return (
    <div className="flex-1 p-12 flex flex-col justify-between relative overflow-hidden bg-[#006c49]">
      {/* Background image overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-50"
        style={{
          backgroundImage:
            "url('https://vietpatservice.com/wp-content/uploads/2015/01/rau-cu-sach.jpg')",
          mixBlendMode: "overlay",
        }}
      />
      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(0deg, rgba(0,108,73,0.9) 0%, rgba(0,108,73,0.2) 100%)",
        }}
      />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <path d="M13 3C13 3 5 8 5 15a8 8 0 0016 0C21 8 13 3 13 3z" fill="#006c49" />
            <path
              d="M13 10v10M9 14l4-4 4 4"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span className="text-[20px] font-bold text-white tracking-tight">
          Smart Green Market
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h1 className="text-[34px] font-extrabold text-white leading-[1.2] tracking-tight mb-4">
          Tham gia cộng đồng Smart Green
        </h1>
        <h2 className="text-[24px] font-extrabold text-white leading-[1.2] tracking-tight mb-4">
         Đăng ký tài khoản nhà cung cấp
        </h2>
        <p className="text-sm text-[#9df4c9] leading-[1.75] opacity-90 mb-7">
          Hệ thống quản trị thông minh dành cho chuỗi cung ứng nông sản bền vững.
          Quản lý sản phẩm, chứng nhận và dữ liệu thị trường trong tầm tay bạn.
        </p>

        {/* Feature cards */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white/15 border border-white/20 rounded-2xl p-4 backdrop-blur-md">
            <div className="text-2xl mb-2">🏅</div>
            <div className="text-[11px] text-white/65 mb-1">Chứng nhận</div>
            <div className="text-base font-bold text-white">Chuẩn Toàn Cầu</div>
          </div>
          <div className="flex-1 bg-white/15 border border-white/20 rounded-2xl p-4 backdrop-blur-md">
            <div className="text-2xl mb-2">📈</div>
            <div className="text-[11px] text-white/65 mb-1">Dữ liệu</div>
            <div className="text-base font-bold text-white">Thời gian thực</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-[11px] text-white/40">
        © 2025 Smart Green Market. All rights reserved.
      </div>
    </div>
  );
}
