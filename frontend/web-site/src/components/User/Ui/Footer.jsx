import { Link } from "react-router-dom";
import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";
import { useStorefrontPaths } from "../../../hooks/useStorefrontPaths";

export default function Footer() {
    const paths = useStorefrontPaths();

    const policyLinks = [
        { label: "Chính sách đổi trả", hash: "doi-tra" },
        { label: "Chính sách bảo mật", hash: "bao-mat" },
        { label: "Điều khoản sử dụng", hash: "dieu-khoan" },
    ];

    const supportLinks = [
        { label: "Hotline CSKH", hash: "hotline" },
        { label: "Hướng dẫn mua hàng", hash: "huong-dan-mua-hang" },
        { label: "FAQ", hash: "faq" },
    ];

    return (
        <footer className="mt-16 w-full border-t border-stone-200 bg-white">
            <div className="mx-auto flex max-w-[1280px] flex-wrap justify-between gap-10 px-4 py-12 sm:px-10">
                <div className="flex max-w-xs flex-col gap-4">
                    <span className="font-serif text-2xl font-bold text-emerald-950">
                        GreenMarket
                    </span>
                    © 2026 Smart Green Market
                    <p className="text-sm leading-6 text-neutral-600">
                        Nền tảng mua bán rau sạch trực tiếp từ vườn đến bàn ăn của bạn.
                    </p>
                    <div className="flex gap-3 pt-1">
                        <a
                            href="#"
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-emerald-100 hover:text-emerald-700"
                        >
                            <FaFacebook className="h-4 w-4" />
                        </a>
                        <a
                            href="#"
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-emerald-100 hover:text-emerald-700"
                        >
                            <FaInstagram className="h-4 w-4" />
                        </a>
                        <a
                            href="#"
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-emerald-100 hover:text-emerald-700"
                        >
                            <FaYoutube className="h-4 w-4" />
                        </a>
                    </div>
                </div>

                <div className="flex gap-12 sm:gap-16">
                    <div className="flex flex-col gap-3">
                        <span className="text-sm font-bold text-emerald-950">Chính sách</span>
                        {policyLinks.map((item) => (
                            <Link
                                key={item.hash}
                                to={`${paths.policies}#${item.hash}`}
                                className="text-sm text-neutral-600 no-underline transition-colors hover:text-emerald-700"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                    <div className="flex flex-col gap-3">
                        <span className="text-sm font-bold text-emerald-950">Hỗ Trợ</span>
                        {supportLinks.map((item) => (
                            <Link
                                key={item.hash}
                                to={`${paths.support}#${item.hash}`}
                                className="text-sm text-neutral-600 no-underline transition-colors hover:text-emerald-700"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <div className="border-t border-stone-200 py-5 text-center">
                <span className="text-sm text-neutral-400">Smart Green Market</span>
            </div>
        </footer>
    );
}
