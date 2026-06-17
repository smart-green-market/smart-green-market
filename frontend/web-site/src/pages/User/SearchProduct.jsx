import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import FilterProductCard from "../../components/User/Home/FilterProductCard";
import { useBuyerProductSearch } from "../../hooks/useBuyerCatalog";
import { useStorefrontPaths } from "../../hooks/useStorefrontPaths";
import { toCardProduct } from "../../utils/userProductUtils";

const ORDER_OPTIONS = [
    { value: "-updated_at", label: "Mới nhất" },
    { value: "name", label: "Tên A → Z" },
    { value: "-name", label: "Tên Z → A" },
    { value: "price", label: "Giá thấp → cao" },
    { value: "-price", label: "Giá cao → thấp" },
    { value: "stock", label: "Tồn kho tăng dần" },
    { value: "-stock", label: "Tồn kho giảm dần" },
];

export default function SearchProductPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const paths = useStorefrontPaths();
    const query = searchParams.get("q") ?? "";
    const ordering = searchParams.get("ordering") ?? "-updated_at";
    const [input, setInput] = useState(query);

    useEffect(() => {
        setInput(query);
    }, [query]);

    const { products, loading, error } = useBuyerProductSearch({
        search: query,
        ordering,
    });
    const items = products.map(toCardProduct);

    const updateParams = (nextQuery, nextOrdering) => {
        const params = new URLSearchParams();
        const trimmed = String(nextQuery).trim();
        if (trimmed) params.set("q", trimmed);
        if (nextOrdering && nextOrdering !== "-updated_at") {
            params.set("ordering", nextOrdering);
        }
        setSearchParams(params);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        updateParams(input, ordering);
    };

    const handleOrderingChange = (event) => {
        updateParams(query, event.target.value);
    };

    return (
        <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-10 sm:py-12">
            <nav className="mb-6 text-sm text-neutral-500">
                <Link to={paths.home} className="text-emerald-800 no-underline hover:underline">
                    Cửa hàng
                </Link>
                <span className="mx-2">/</span>
                <span className="text-neutral-700">Tìm kiếm</span>
            </nav>

            <div className="mb-8">
                <h1 className="font-playfair text-3xl font-bold text-emerald-950">
                    Tìm kiếm sản phẩm
                </h1>
                <p className="mt-2 text-sm text-neutral-600">
                    Tìm theo tên sản phẩm, mô tả, nhà cung cấp hoặc danh mục.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                        type="search"
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        placeholder="Tìm kiếm thực phẩm sạch..."
                        className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                </div>
                <select
                    value={ordering}
                    onChange={handleOrderingChange}
                    className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
                >
                    {ORDER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <button
                    type="submit"
                    className="rounded-xl bg-emerald-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-900"
                >
                    Tìm kiếm
                </button>
            </form>

            {query ? (
                <p className="mb-6 text-sm text-neutral-600">
                    Kết quả cho &quot;{query}&quot; — {items.length} sản phẩm
                </p>
            ) : (
                <p className="mb-6 text-sm text-neutral-600">
                    {items.length} sản phẩm trong cửa hàng
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {items.map((product) => (
                        <FilterProductCard
                            key={product.id}
                            id={product.id}
                            brand={product.brand}
                            name={product.name}
                            price={product.price}
                            rating={product.rating}
                            sold={product.available_quantity}
                            inStock={product.in_stock}
                            image={product.image}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
