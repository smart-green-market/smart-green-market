import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, Loader2 } from "lucide-react";
import {
    fetchBuyerProductById,
    fetchRelatedBuyerProducts,
} from "../../hooks/useBuyerCatalog";
import { useStorefrontPaths } from "../../hooks/useStorefrontPaths";
import { handleApiError } from "../../services/api/Buyer/buyerCatalogService";
import ProductDetailGallery from "../../components/User/Product/ProductDetailGallery";
import ProductDetailPurchase from "../../components/User/Product/ProductDetailPurchase";
import ProductDetailSpecs from "../../components/User/Product/ProductDetailSpecs";
import ProductReviews from "../../components/User/Product/ProductReviews";
import RelatedProducts from "../../components/User/Product/RelatedProducts";

export default function ProductDetailPage() {
    const { id } = useParams();
    const paths = useStorefrontPaths();
    const [product, setProduct] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadProduct() {
            setLoading(true);
            setError("");

            if (!paths.slug) {
                setError("Chưa xác định cửa hàng. Vui lòng truy cập qua link cửa hàng đại lý.");
                setLoading(false);
                return;
            }

            try {
                const detail = await fetchBuyerProductById(paths.slug, id);
                if (cancelled) return;

                setProduct(detail);

                const relatedList = await fetchRelatedBuyerProducts(
                    paths.slug,
                    detail.id,
                    detail.category_id,
                    4,
                );
                if (!cancelled) setRelated(relatedList);
            } catch (err) {
                if (!cancelled) {
                    setError(handleApiError(err, "Không thể tải thông tin sản phẩm"));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        if (id) loadProduct();

        return () => {
            cancelled = true;
        };
    }, [id, paths.slug]);

    const breadcrumb = useMemo(() => {
        if (!product) return [];
        return [
            { label: "Cửa hàng", to: paths.home },
            { label: product.category_name || "Nông sản", to: paths.home },
            { label: product.name, to: null },
        ];
    }, [product, paths.home]);

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="mx-auto flex min-h-[50vh] max-w-[1280px] flex-col items-center justify-center gap-4 px-10 text-center">
                <p className="text-neutral-600">{error || "Không tìm thấy sản phẩm."}</p>
                <Link
                    to={paths.home}
                    className="rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-emerald-900"
                >
                    Về cửa hàng
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-10 sm:py-12">
            <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm sm:text-base">
                {breadcrumb.map((item, index) => (
                    <span key={item.label} className="inline-flex items-center gap-2">
                        {index > 0 ? (
                            <ChevronRight className="h-4 w-4 text-neutral-500" />
                        ) : null}
                        {item.to ? (
                            <Link
                                to={item.to}
                                className="text-neutral-700 no-underline hover:text-emerald-800"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className="font-bold text-emerald-950">{item.label}</span>
                        )}
                    </span>
                ))}
            </nav>

            <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
                <ProductDetailGallery
                    images={product.images}
                    name={product.name}
                    status={product.status}
                    inStock={product.in_stock}
                />
                <ProductDetailPurchase
                    product={product}
                    rating={product.rating}
                    reviewCount={product.sold}
                />
            </div>

            <div className="mt-16">
                <ProductDetailSpecs product={product} />
            </div>

            <div className="mt-16">
                <ProductReviews />
            </div>

            <div className="mt-16">
                <RelatedProducts products={related} />
            </div>
        </div>
    );
}
