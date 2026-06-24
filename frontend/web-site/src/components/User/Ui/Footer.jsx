import { Link } from "react-router-dom";
import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";
import { useStorefrontPaths } from "../../../hooks/useStorefrontPaths";

function FooterLinkColumn({ title, links }) {
    return (
        <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white">
                {title}
            </h3>
            <ul className="flex flex-col gap-1.5">
                {links.map((item) => (
                    <li key={item.hash}>
                        <Link
                            to={item.to}
                            className="text-sm text-white/75 no-underline transition-colors hover:text-white"
                        >
                            {item.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

const SOCIAL_LINKS = [
    { href: "#", icon: FaFacebook, label: "Facebook" },
    { href: "#", icon: FaInstagram, label: "Instagram" },
    { href: "#", icon: FaYoutube, label: "YouTube" },
];

export default function Footer() {
    const paths = useStorefrontPaths();

    const policyLinks = [
        { label: "Chính sách đổi trả", hash: "doi-tra" },
        { label: "Chính sách bảo mật", hash: "bao-mat" },
        { label: "Điều khoản sử dụng", hash: "dieu-khoan" },
    ].map((item) => ({
        ...item,
        to: `${paths.policies}#${item.hash}`,
    }));

    const supportLinks = [
        { label: "Hotline CSKH", hash: "hotline" },
        { label: "Hướng dẫn mua hàng", hash: "huong-dan-mua-hang" },
        { label: "FAQ", hash: "faq" },
    ].map((item) => ({
        ...item,
        to: `${paths.support}#${item.hash}`,
    }));

    return (
        <footer className="mt-10 w-full bg-emerald-700 text-white">
            <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
                    {/* Brand */}
                    <div className="sm:col-span-2 lg:col-span-5">
                        <Link
                            to={paths.home}
                            className="text-xl font-bold text-white no-underline"
                        >
                            Smart Green Market
                        </Link>
                        <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/75">
                            Nền tảng mua bán rau sạch trực tiếp từ vườn đến bàn ăn của bạn.
                        </p>
                        <div className="mt-3 flex gap-2">
                            {SOCIAL_LINKS.map(({ href, icon: Icon, label }) => (
                                <a
                                    key={label}
                                    href={href}
                                    aria-label={label}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links — 2 cột trên mobile/tablet, cạnh nhau trên desktop */}
                    <div className="grid grid-cols-2 gap-4 sm:col-span-2 lg:col-span-4 lg:col-start-7">
                        <FooterLinkColumn title="Chính sách" links={policyLinks} />
                        <FooterLinkColumn title="Hỗ trợ" links={supportLinks} />
                    </div>
                </div>

                <div className="mt-5 flex flex-col items-center justify-between gap-2 border-t border-white/20 pt-4 text-xs text-white/60 sm:flex-row">
                    <span>© 2026 Smart Green Market.</span>
                </div>
            </div>
        </footer>
    );
}
