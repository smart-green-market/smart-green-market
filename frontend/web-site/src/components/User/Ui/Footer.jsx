import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    FaFacebook,
    FaInstagram,
    FaYoutube,
    FaTiktok,
    FaPhone,
    FaEnvelope,
    FaMapMarkerAlt,
    FaClock,
    FaTruck,
    FaShieldAlt,
    FaLeaf,
    FaSmile,
} from "react-icons/fa";
import { useStorefrontPaths, useDealerSlug } from "../../../hooks/useStorefrontPaths";
import { buyerDealerService } from "../../../services/api/Buyer/buyerDealerService";
import { buyerCatalogService } from "../../../services/api/Buyer/buyerCatalogService";

/* ─── Hằng số ─────────────────────────────────────────── */
const SOCIAL_LINKS = [
    { href: "#", icon: FaFacebook, label: "Facebook" },
    { href: "#", icon: FaInstagram, label: "Instagram" },
    { href: "#", icon: FaYoutube, label: "YouTube" },
    { href: "#", icon: FaTiktok, label: "TikTok" },
];

const COMMITMENT_ITEMS = [
    {
        icon: FaTruck,
        title: "GIAO HÀNG TOÀN QUỐC",
        desc: "Giao hàng nhanh chóng, đúng hẹn, hỗ trợ tận nơi",
    },
    {
        icon: FaShieldAlt,
        title: "THANH TOÁN AN TOÀN",
        desc: "Đa dạng phương thức thanh toán, bảo mật tuyệt đối",
    },
    {
        icon: FaLeaf,
        title: "THỰC PHẨM SẠCH – AN TOÀN",
        desc: "Sản phẩm đạt chuẩn VietGAP, nguồn gốc rõ ràng",
    },
    {
        icon: FaSmile,
        title: "CAM KẾT HÀI LÒNG",
        desc: "Đổi trả dễ dàng nếu sản phẩm không đạt chất lượng",
    },
];

const PAYMENT_METHODS = [
    { id: "visa",       label: "Visa",       bg: "#1a1f71", color: "#fff", text: "VISA" },
    { id: "mastercard", label: "Mastercard", bg: "#eb001b", color: "#fff", text: "MC" },
    { id: "momo",       label: "MoMo",       bg: "#ae2070", color: "#fff", text: "MoMo" },
    { id: "zalopay",    label: "ZaloPay",    bg: "#006fff", color: "#fff", text: "ZaloPay" },
    { id: "vnpay",      label: "VNPAY",      bg: "#e53935", color: "#fff", text: "VNPAY" },
    { id: "cod",        label: "COD",        bg: "#059669", color: "#fff", text: "COD" },
];

const POLICY_LINKS_DEF = [
    { label: "Chính sách đổi trả",   hash: "doi-tra" },
    { label: "Chính sách bảo mật",   hash: "bao-mat" },
    { label: "Điều khoản sử dụng",   hash: "dieu-khoan" },
    { label: "Chính sách giao hàng", hash: "giao-hang" },
    { label: "Chính sách thanh toán", hash: "thanh-toan" },
];

const SUPPORT_LINKS_DEF = [
    { label: "Hotline CSKH",          hash: "hotline" },
    { label: "Hướng dẫn mua hàng",    hash: "huong-dan-mua-hang" },
    { label: "Theo dõi đơn hàng",     hash: "theo-doi" },
    { label: "Phương thức thanh toán", hash: "thanh-toan" },
    { label: "FAQ",                    hash: "faq" },
    { label: "Liên hệ chúng tôi",     hash: "lien-he" },
];

/* Tailwind emerald link – khớp tone header emerald-700 */
const LINK_CLASS =
    "block py-1 text-[13px] leading-snug text-emerald-100/80 no-underline " +
    "transition-all duration-200 hover:text-white hover:translate-x-1";

/* ─── Sub-components ───────────────────────────────────── */
function ColTitle({ children }) {
    return (
        <h3 className="mb-3 text-[13px] font-bold uppercase tracking-widest text-white after:mt-2 after:block after:h-[3px] after:w-8 after:rounded-full after:bg-emerald-300 after:content-['']">
            {children}
        </h3>
    );
}

function CommitmentCard({ icon: Icon, title, desc }) {
    return (
        <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 ring-2 ring-emerald-400/40">
                <Icon className="h-5 w-5 text-emerald-200" />
            </div>
            <div>
                <p className="text-[13px] font-bold uppercase tracking-wide text-white">
                    {title}
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-emerald-100/70">
                    {desc}
                </p>
            </div>
        </div>
    );
}

function PaymentBadge({ label, bg, color, text }) {
    return (
        <div
            className="flex h-10 min-w-[64px] items-center justify-center rounded-md px-3 text-[13px] font-bold shadow-md"
            style={{ background: bg, color }}
            title={label}
        >
            {text}
        </div>
    );
}

/* ─── Main Footer ──────────────────────────────────────── */
export default function Footer() {
    const paths = useStorefrontPaths();
    const slug = useDealerSlug();

    const [dealerInfo, setDealerInfo] = useState(null);
    const [categories, setCategories] = useState([]);

    /* fetch dealer info & categories */
    useEffect(() => {
        if (!slug) return;
        let alive = true;

        buyerDealerService
            .getDealer(slug)
            .then((d) => { if (alive) setDealerInfo(d); })
            .catch(() => {});

        buyerCatalogService
            .getCategory(slug)
            .then((list) => { if (alive) setCategories(Array.isArray(list) ? list : []); })
            .catch(() => {});

        return () => { alive = false; };
    }, [slug]);

    const navigate = useNavigate();

    /** Điều hướng tới url rồi scroll thẳng tới section FilterProduct (#kham-pha).
     *  Dùng setTimeout nhỏ để đợi React render xong sau khi navigate. */
    const navigateToCatalog = (url) => {
        navigate(url);
        setTimeout(() => {
            const section = document.getElementById("kham-pha");
            if (section) {
                section.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }, 80);
    };

    /* build links from paths */
    const policyLinks = POLICY_LINKS_DEF.map((item) => ({
        ...item,
        to: `${paths.policies}#${item.hash}`,
    }));

    const supportLinks = SUPPORT_LINKS_DEF.map((item) => ({
        ...item,
        to: `${paths.support}#${item.hash}`,
    }));

    /* contact info – prefer dealer API, fallback to defaults */
    const phone     = dealerInfo?.contact?.phone   || "1900 1234";
    const email     = dealerInfo?.contact?.email   || "support@smartgreenmarket.vn";
    const address   = dealerInfo?.store_address    || "123 Nguyễn Văn Linh, Đà Nẵng, Việt Nam";
    const storeName = dealerInfo?.store_name       || "Smart Green Market";

    return (
        <footer className="mt-10 w-full bg-emerald-700 text-white">

            {/* ── TOP SECTION ──────────────────────────────── */}
            <div className="mx-auto max-w-[1280px] px-4 pt-10 pb-8 sm:px-6 lg:px-10">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-12 lg:gap-6">

                    {/* Brand */}
                    <div className="sm:col-span-2 lg:col-span-3">
                        <Link to={paths.home} className="no-underline">
                            <div className="flex items-center gap-2">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                                    <FaLeaf className="h-6 w-6 text-white" />
                                </div>
                                <div className="leading-tight">
                                    <span className="block text-[18px] font-extrabold uppercase tracking-tight text-white">
                                        SMART GREEN
                                    </span>
                                    <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
                                        MARKET
                                    </span>
                                </div>
                            </div>
                        </Link>

                        <p className="mt-4 text-[13px] leading-relaxed text-emerald-100/75">
                            Kết nối nông dân và người tiêu dùng, mang thực phẩm sạch, minh bạch và
                            bền vững đến mọi gia đình Việt.
                        </p>

                        {/* Social icons */}
                        <div className="mt-4 flex gap-2">
                            {SOCIAL_LINKS.map(({ href, icon: Icon, label }) => (
                                <a
                                    key={label}
                                    href={href}
                                    aria-label={label}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 hover:bg-white/25"
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* LIÊN HỆ */}
                    <div className="lg:col-span-3">
                        <ColTitle>Liên hệ</ColTitle>
                        <ul className="flex flex-col gap-3">
                            <li className="flex items-start gap-2.5">
                                <FaPhone className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-300" />
                                <div>
                                    <p className="text-[11px] text-emerald-200/60">Hotline</p>
                                    <p className="text-[13px] font-semibold text-white">{phone}</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <FaEnvelope className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-300" />
                                <div>
                                    <p className="text-[11px] text-emerald-200/60">Email</p>
                                    <p className="text-[13px] font-semibold text-white break-all">{email}</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <FaMapMarkerAlt className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-300" />
                                <div>
                                    <p className="text-[11px] text-emerald-200/60">Địa chỉ</p>
                                    <p className="text-[13px] font-semibold text-white">{address}</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <FaClock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-300" />
                                <div>
                                    <p className="text-[11px] text-emerald-200/60">Giờ làm việc</p>
                                    <p className="text-[13px] font-semibold text-white">08:00 – 21:00</p>
                                    <p className="text-[12px] text-emerald-100/60">(Thứ 2 – Chủ nhật)</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* DANH MỤC – lấy từ API dealer */}
                    <div className="lg:col-span-2">
                        <ColTitle>Danh mục</ColTitle>
                        <ul className="flex flex-col gap-0.5">
                            {categories.length > 0 ? (
                                <>
                                    {categories.slice(0, 7).map((cat) => (
                                        <li key={cat.id}>
                                            <button
                                                type="button"
                                                onClick={() => navigateToCatalog(paths.productsWithCategory(cat.id))}
                                                className={`${LINK_CLASS} w-full text-left bg-transparent border-0 cursor-pointer p-0`}
                                            >
                                                {cat.name}
                                            </button>
                                        </li>
                                    ))}
                                    <li>
                                        <button
                                            type="button"
                                            onClick={() => navigateToCatalog(paths.products)}
                                            className="block py-1 text-[13px] font-semibold text-emerald-300 no-underline transition-all duration-200 hover:text-white hover:translate-x-1 bg-transparent border-0 cursor-pointer p-0"
                                        >
                                            Xem tất cả →
                                        </button>
                                    </li>
                                </>
                            ) : (
                                /* Skeleton khi chưa load xong */
                                Array.from({ length: 5 }).map((_, i) => (
                                    <li
                                        key={i}
                                        className="my-1 h-4 animate-pulse rounded bg-white/10"
                                        style={{ width: `${55 + i * 10}px` }}
                                    />
                                ))
                            )}
                        </ul>
                    </div>

                    {/* CHÍNH SÁCH */}
                    <div className="lg:col-span-2">
                        <ColTitle>Chính sách</ColTitle>
                        <ul className="flex flex-col gap-0.5">
                            {policyLinks.map((item) => (
                                <li key={item.hash}>
                                    <Link to={item.to} className={LINK_CLASS}>
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* HỖ TRỢ */}
                    <div className="lg:col-span-2">
                        <ColTitle>Hỗ trợ</ColTitle>
                        <ul className="flex flex-col gap-0.5">
                            {supportLinks.map((item) => (
                                <li key={item.hash}>
                                    <Link to={item.to} className={LINK_CLASS}>
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* ── CAM KẾT ──────────────────────────────────── */}
            <div className="border-t border-emerald-900/30 bg-emerald-800">
                <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-10">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {COMMITMENT_ITEMS.map((item) => (
                            <CommitmentCard key={item.title} {...item} />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── PHƯƠNG THỨC THANH TOÁN ───────────────────── */}
            {/* <div className="border-t border-emerald-900/30 bg-emerald-700">
                <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-10 text-center">
                    <p className="mb-4 text-[12px] font-bold uppercase tracking-widest text-emerald-200/70">
                        Phương thức thanh toán
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {PAYMENT_METHODS.map((m) => (
                            <PaymentBadge key={m.id} {...m} />
                        ))}
                    </div>
                </div>
            </div> */}

            {/* ── BOTTOM BAR ───────────────────────────────── */}
            <div className="border-t border-emerald-900/30 bg-emerald-900">
                <div className="mx-auto max-w-[1280px] px-4 py-4 sm:px-6 lg:px-10">
                    <div className="flex flex-col items-center justify-between gap-3 text-[12px] text-emerald-200/50 sm:flex-row">
                        {/* Copyright */}
                        <div className="flex items-center gap-2">
                            <FaLeaf className="h-3.5 w-3.5 text-emerald-400" />
                            <span>© 2026 {storeName}. All Rights Reserved.</span>
                        </div>

                        {/* Quick links */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            {[
                                { label: "Điều khoản sử dụng", to: `${paths.policies}#dieu-khoan` },
                                { label: "Chính sách bảo mật", to: `${paths.policies}#bao-mat` },
                                { label: "Cookie",              to: `${paths.policies}#cookie` },
                                { label: "Sitemap",             to: paths.about },
                            ].map((link, idx, arr) => (
                                <span key={link.label} className="flex items-center gap-4">
                                    <Link
                                        to={link.to}
                                        className="no-underline text-emerald-200/50 transition-colors hover:text-emerald-300"
                                    >
                                        {link.label}
                                    </Link>
                                    {idx < arr.length - 1 && (
                                        <span className="text-emerald-700">|</span>
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
