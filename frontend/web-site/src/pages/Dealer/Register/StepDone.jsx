import { Link } from "react-router-dom";

export default function StepDone() {
    return (
        <div className="flex animate-[fadeSlide_0.28s_ease] flex-col items-center py-8 text-center">
            <div className="mb-6 flex h-20 w-20 animate-[popIn_0.4s_cubic-bezier(.175,.885,.32,1.275)] items-center justify-center rounded-full bg-emerald-100 text-4xl">
                🎉
            </div>

            <h2 className="mb-2 text-[24px] font-extrabold tracking-tight text-[#141b2b]">
                Đăng ký thành công!
            </h2>

            <p className="mb-8 text-[14px] leading-[1.75] text-[#5a6a5e]">
                Hồ sơ đại lý của bạn đã được gửi.
                <br />
                Chúng tôi sẽ xét duyệt và thông báo qua email
                <br />
                trong vòng{" "}
                <strong className="text-[#141b2b]">1–3 ngày làm việc</strong>.
            </p>

            <Link
                to="/"
                className="flex w-full max-w-[280px] items-center justify-center gap-2 rounded-xl bg-[#006c49] py-4 text-[15px] font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#005038]"
            >
                Về trang chủ →
            </Link>
        </div>
    );
}
