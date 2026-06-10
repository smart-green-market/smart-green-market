import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
export default function StepDone() {
  return (
    <div className="flex flex-col items-center text-center py-8 animate-[fadeSlide_0.28s_ease]">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-4xl mb-6 animate-[popIn_0.4s_cubic-bezier(.175,.885,.32,1.275)]">
        🎉
      </div>
      <h2 className="text-[24px] font-extrabold text-[#141b2b] tracking-tight mb-2">
        Đăng ký thành công!
      </h2>
      <p className="text-[14px] text-[#5a6a5e] leading-[1.75] mb-8">
        Hồ sơ của bạn đã được gửi đi.
        <br />
        Chúng tôi sẽ xét duyệt và thông báo qua email
        <br />
        trong vòng <strong className="text-[#141b2b]">1–3 ngày làm việc</strong>.
      </p>
      <NavLink to="/" className="max-w-[280px] w-full py-4 bg-[#006c49] hover:bg-[#005038] text-white rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5">
        <button className="max-w-[280px] w-full py-4 bg-[#006c49] hover:bg-[#005038] text-white rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5">
          Đến trang chính →
        </button>
      </NavLink>
    </div>
  );
}
