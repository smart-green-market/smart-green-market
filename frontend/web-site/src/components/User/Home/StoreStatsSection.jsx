import { Link } from "react-router-dom";
import { Eye, ShoppingCart, Sprout, Star, Users } from "lucide-react";
import { useStorefrontPaths } from "../../../hooks/useStorefrontPaths";

const STATS = [
    { icon: Users, value: "10,000+", label: "Khách hàng tin tưởng" },
    { icon: Sprout, value: "100+", label: "Loại nông sản tươi ngon" },
    { icon: ShoppingCart, value: "99%", label: "Giao hàng đúng hẹn" },
    { icon: Star, value: "4.9/5", label: "Đánh giá từ khách hàng" },
];

export default function StoreStatsSection() {
    const paths = useStorefrontPaths();

    return (
        <section className="bg-emerald-700 py-14 sm:py-16">
            <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
                <div className="mb-10 text-center">
                    <h2 className="text-2xl font-bold text-white sm:text-3xl">
                        Smart Green Market trong con số
                    </h2>
                    <p className="mt-2 text-sm text-emerald-100 sm:text-base">
                        Những con số ấn tượng thể hiện sự tin tưởng của khách hàng
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                    {STATS.map(({ icon: Icon, value, label }, index) => (
                        <div
                            key={label}
                            className={`flex flex-col items-center text-center ${
                                index < STATS.length - 1
                                    ? "lg:border-r lg:border-white/20"
                                    : ""
                            }`}
                        >
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
                                <Icon className="h-6 w-6 text-white" />
                            </div>
                            <p className="text-2xl font-bold text-white sm:text-3xl">
                                {value}
                            </p>
                            <p className="mt-1 text-xs text-emerald-100 sm:text-sm">
                                {label}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-12 rounded-2xl bg-white px-6 py-10 text-center shadow-lg sm:px-10">
                    <h3 className="text-xl font-bold text-emerald-950 sm:text-2xl">
                        Sẵn sàng trải nghiệm nông sản tươi ngon?
                    </h3>
                    <p className="mt-2 text-sm text-neutral-500 sm:text-base">
                        Đặt hàng ngay để nhận ưu đãi đặc biệt cho khách hàng mới
                    </p>
                    <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Link
                            to={paths.products}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white no-underline transition-colors hover:bg-emerald-800 sm:w-auto"
                        >
                            <ShoppingCart className="h-4 w-4" />
                            Đặt hàng ngay
                        </Link>
                        <Link
                            to={paths.products}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-700 bg-white px-6 py-3 text-sm font-semibold text-emerald-800 no-underline transition-colors hover:bg-emerald-50 sm:w-auto"
                        >
                            <Eye className="h-4 w-4" />
                            Xem sản phẩm
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
