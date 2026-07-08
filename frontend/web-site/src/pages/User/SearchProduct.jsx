import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import FilterProductCard from "../../components/User/Home/FilterProductCard";
import SearchProductFilter from "../../components/User/Search/SearchProductFilter";
import Pagination from "../../components/common/Pagination";
import { useBuyerCatalogProducts } from "../../hooks/useBuyerCatalog";
import { useStorefrontPaths } from "../../hooks/useStorefrontPaths";
import { buyerCatalogService } from "../../services/api/Buyer/buyerCatalogService";
import { toCardProduct } from "../../utils/userProductUtils";

const SEARCH_PAGE_SIZE = 20;

export default function SearchProductPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const paths = useStorefrontPaths();
    const query = searchParams.get("q") ?? "";
    const ordering = searchParams.get("ordering") ?? "-updated_at";
    const category = searchParams.get("category") ?? "";
    const [input, setInput] = useState(query);
    const [page, setPage] = useState(1);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    useEffect(() => {
        setInput(query);
    }, [query]);

    useEffect(() => {
        setPage(1);
    }, [query, ordering, category]);

    useEffect(() => {
        let cancelled = false;

        if (!paths.slug) {
            setCategories([]);
            setLoadingCategories(false);
            return;
        }

        setLoadingCategories(true);
        buyerCatalogService
            .getCategory(paths.slug)
            .then((rows) => {
                if (!cancelled) {
                    setCategories(
                        (rows ?? []).filter(
                            (item) =>
                                item.status !== "inactive" &&
                                item.status !== "rejected",
                        ),
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setLoadingCategories(false);
            });

        return () => {
            cancelled = true;
        };
    }, [paths.slug]);

    const apiParams = useMemo(() => {
        const params = { ordering };
        const trimmed = String(query).trim();
        if (trimmed) params.search = trimmed;
        if (category) params.category = category;
        return params;
    }, [query, ordering, category]);

    const { products, pagination, loading, error } = useBuyerCatalogProducts({
        apiParams,
        page,
        pageSize: SEARCH_PAGE_SIZE,
    });

    const items = products.map(toCardProduct);
    const totalCount = pagination.count;
    const totalPages = pagination.totalPages;
    const showingFrom =
        totalCount === 0 ? 0 : (page - 1) * SEARCH_PAGE_SIZE + 1;
    const showingTo = Math.min(page * SEARCH_PAGE_SIZE, totalCount);

    const updateParams = (nextQuery, nextOrdering, nextCategory) => {
        const params = new URLSearchParams();
        const trimmed = String(nextQuery).trim();
        if (trimmed) params.set("q", trimmed);
        if (nextOrdering && nextOrdering !== "-updated_at") {
            params.set("ordering", nextOrdering);
        }
        if (nextCategory) params.set("category", nextCategory);
        setSearchParams(params);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        updateParams(input, ordering, category);
    };

    const handleOrderingChange = (nextOrdering) => {
        updateParams(query, nextOrdering, category);
    };

    const handleCategoryChange = (nextCategory) => {
        updateParams(query, ordering, nextCategory);
    };

    const handlePageChange = (nextPage) => {
        setPage(nextPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const selectedCategoryName =
        categories.find((item) => String(item.id) === String(category))?.name ??
        "";

    return (
        <>
            <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-10 sm:py-12">
                <nav className="mb-6 text-sm text-neutral-500">
                    <Link
                        to={paths.home}
                        className="text-emerald-800 no-underline hover:underline"
                    >
                        Cửa hàng
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="text-neutral-700">Tìm kiếm</span>
                </nav>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-emerald-950">
                        Tìm kiếm sản phẩm
                    </h1>
                    <p className="mt-2 text-sm text-neutral-600">
                        Tìm theo tên sản phẩm, mô tả, nhà cung cấp hoặc danh mục.
                    </p>
                </div>

                <div className="mb-6">
                    <SearchProductFilter
                        input={input}
                        onInputChange={setInput}
                        ordering={ordering}
                        onOrderingChange={handleOrderingChange}
                        category={category}
                        onCategoryChange={handleCategoryChange}
                        categories={categories}
                        loadingCategories={loadingCategories}
                        onSubmit={handleSubmit}
                    />
                </div>

                {query || category ? (
                    <p className="mb-6 text-sm text-neutral-600">
                        {query ? (
                            <>
                                Kết quả cho &quot;{query}&quot;
                                {selectedCategoryName
                                    ? ` trong danh mục "${selectedCategoryName}"`
                                    : ""}
                            </>
                        ) : (
                            <>Danh mục &quot;{selectedCategoryName}&quot;</>
                        )}
                        {" — "}
                        {totalCount} sản phẩm
                    </p>
                ) : (
                    <p className="mb-6 text-sm text-neutral-600">
                        {totalCount} sản phẩm trong cửa hàng
                    </p>
                )}

                {error ? (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {loading ? (
                    <div className="flex h-48 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center text-sm text-neutral-500">
                        Không tìm thấy sản phẩm phù hợp.
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {items.map((product) => (
                                <FilterProductCard
                                    key={product.id}
                                    {...product}
                                />
                            ))}
                        </div>

                        {totalCount > 0 ? (
                            <div className="flex flex-col items-center gap-4">
                                <Pagination
                                    currentPage={page}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </>
    );
}
