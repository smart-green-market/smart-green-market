export default function UserRegisterLeftPanel() {
    return (
        <div className="relative flex flex-1 flex-col justify-between overflow-hidden bg-[#006c49] p-12">
            <div
                className="absolute inset-0 bg-cover bg-center opacity-50"
                style={{
                    backgroundImage:
                        "url('https://vietpatservice.com/wp-content/uploads/2015/01/rau-cu-sach.jpg')",
                    mixBlendMode: "overlay",
                }}
            />
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "linear-gradient(0deg, rgba(0,108,73,0.9) 0%, rgba(0,108,73,0.2) 100%)",
                }}
            />

            <div className="relative z-10 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
                        <path
                            d="M13 3C13 3 5 8 5 15a8 8 0 0016 0C21 8 13 3 13 3z"
                            fill="#006c49"
                        />
                        <path
                            d="M13 10v10M9 14l4-4 4 4"
                            stroke="#fff"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
                <span className="text-[20px] font-bold tracking-tight text-white">
                    Smart Green Market
                </span>
            </div>

            <div className="relative z-10">
                <h1 className="mb-4 text-[34px] font-extrabold leading-[1.2] tracking-tight text-white">
                    Mua nông sản sạch, an tâm từng bữa ăn
                </h1>
                <p className="mb-7 text-sm leading-[1.75] text-[#9df4c9] opacity-90">
                    Tạo tài khoản khách hàng tại cửa hàng đại lý bạn tin tưởng. Theo dõi đơn
                    hàng và nhận ưu đãi dành riêng cho bạn.
                </p>

                <div className="flex gap-3">
                    <div className="hover:scale-105 transition-all duration-300 flex-1 rounded-2xl border border-white/20 bg-white/15 p-4 backdrop-blur-md">
                        <div className="mb-2 text-2xl">🥬</div>
                        <div className="mb-1 text-[11px] text-white/65">Nguồn hàng</div>
                        <div className="text-base font-bold text-white">Rau củ tươi sạch</div>
                    </div>
                    <div className="hover:scale-105 transition-all duration-300 flex-1 rounded-2xl border border-white/20 bg-white/15 p-4 backdrop-blur-md">
                        <div className="mb-2 text-2xl">📦</div>
                        <div className="mb-1 text-[11px] text-white/65">Đơn hàng</div>
                        <div className="text-base font-bold text-white">Theo dõi đơn hàng</div>
                    </div>
                </div>
            </div>

            <div className="relative z-10 text-[11px] text-white/40">
                © {new Date().getFullYear()} Smart Green Market
            </div>
        </div>
    );
}
