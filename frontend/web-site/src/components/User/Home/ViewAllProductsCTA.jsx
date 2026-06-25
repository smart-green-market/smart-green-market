import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useStorefrontPaths } from "../../../hooks/useStorefrontPaths";

export default function ViewAllProductsCTA({ productCount = 0 }) {
    const paths = useStorefrontPaths();
    const countLabel =
        productCount > 0 ? `${productCount}+` : "100+";

    return (
        <section className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 lg:px-10">
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/50 px-6 py-10 text-center shadow-sm sm:px-10 sm:py-12">
                <p className="text-base text-neutral-600 sm:text-lg">
                    Khám phá thêm{" "}
                    <span className="font-semibold text-emerald-800">
                        {countLabel} sản phẩm
                    </span>{" "}
                    nông sản tươi ngon khác
                </p>
                <Link
                    to={paths.products}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-emerald-700 bg-white px-8 py-3 text-sm font-semibold text-emerald-800 no-underline transition-all hover:bg-emerald-700 hover:text-white"
                >
                    Xem tất cả sản phẩm
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </section>
    );
}
