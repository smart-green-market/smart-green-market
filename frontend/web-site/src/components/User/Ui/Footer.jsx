import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";

export default function Footer() {
    return (
        <footer className="w-full bg-white border-t border-stone-200 mt-16">
            <div className="max-w-[1280px] mx-auto px-10 py-12 flex flex-wrap justify-between gap-10">

                {/* Brand */}
                <div className="max-w-xs flex flex-col gap-4">
                    <span className="text-emerald-950 text-2xl font-bold font-serif">GreenMarket</span>
                    © 2026 Smart Green Market
                    <p className="text-neutral-600 text-sm leading-6">
                        Nền tảng mua bán rau sạch trực tiếp từ vườn đến bàn ăn của bạn.
                    </p>
                    <div className="flex gap-3 pt-1">
                        <a href="#" className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-700 transition-colors text-zinc-600">
                            <FaFacebook className="w-4 h-4" />
                        </a>
                        <a href="#" className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-700 transition-colors text-zinc-600">
                            <FaInstagram className="w-4 h-4" />
                        </a>
                        <a href="#" className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-700 transition-colors text-zinc-600">
                            <FaYoutube className="w-4 h-4" />
                        </a>
                    </div>
                </div>

                {/* Links */}
                <div className="flex gap-16">
                    <div className="flex flex-col gap-3">
                        <span className="text-emerald-950 text-sm font-bold">Chính sách</span>
                        <a href="#" className="text-neutral-600 text-sm hover:text-emerald-700 transition-colors">Chính sách đổi trả</a>
                        <a href="#" className="text-neutral-600 text-sm hover:text-emerald-700 transition-colors">Chính sách bảo mật</a>
                        <a href="#" className="text-neutral-600 text-sm hover:text-emerald-700 transition-colors">Điều khoản sử dụng</a>
                    </div>
                    <div className="flex flex-col gap-3">
                        <span className="text-emerald-950 text-sm font-bold">Hỗ Trợ</span>
                        <a href="#" className="text-neutral-600 text-sm hover:text-emerald-700 transition-colors">Hotline CSKH</a>
                        <a href="#" className="text-neutral-600 text-sm hover:text-emerald-700 transition-colors">Hướng dẫn mua hàng</a>
                        <a href="#" className="text-neutral-600 text-sm hover:text-emerald-700 transition-colors">FAQ</a>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-stone-200 py-5 text-center">
                <span className="text-neutral-400 text-sm">Smart Green Market</span>
            </div>
        </footer>
    );
}