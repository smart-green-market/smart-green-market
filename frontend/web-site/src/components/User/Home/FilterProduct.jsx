import { useEffect, useMemo, useState } from "react";
import {
    ChevronsLeft,
    ChevronsRight,
    ChevronLeft,
    ChevronRight,
    Loader2,
} from "lucide-react";
import { useBuyerCatalog } from "../../../hooks/useBuyerCatalog";
import { buildUnitFilterOptions, buildSupplierFilterOptions, toCardProduct } from "../../../utils/userProductUtils";
import FilterProductCard from "./FilterProductCard";

const PAGE_SIZE = 8;

function FilterSection({ title, children }) {
    return (
        <div className="border-b border-stone-200 py-5 last:border-b-0">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-zinc-800">
                <span className="h-4 w-1 rounded-full bg-emerald-700" />
                {title}
            </h3>
            {children}
        </div>
    );
}

function TagButton({ active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${active
                ? "bg-emerald-700 text-white"
                : "bg-stone-100 text-neutral-600 hover:bg-emerald-50 hover:text-emerald-800"
                }`}
        >
            {children}
        </button>
    );
}

function parseInputPrice(value) {
    const digits = String(value).replace(/[^\d]/g, "");
    return digits ? Number(digits) : null;
}

export default function FilterProduct() {
    const { categories, products, loading, error } = useBuyerCatalog();
    const catalog = useMemo(() => products.map(toCardProduct), [products]);

    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedUnits, setSelectedUnits] = useState([]);
    const [selectedSuppliers, setSelectedSuppliers] = useState([]);
    const [stockFilter, setStockFilter] = useState("all");
    const [draftMinPrice, setDraftMinPrice] = useState("");
    const [draftMaxPrice, setDraftMaxPrice] = useState("");
    const [draftMinQuantity, setDraftMinQuantity] = useState("");

    const [appliedMinPrice, setAppliedMinPrice] = useState(null);
    const [appliedMaxPrice, setAppliedMaxPrice] = useState(null);
    const [appliedMinQuantity, setAppliedMinQuantity] = useState(null);

    const [page, setPage] = useState(1);

    const availableUnits = useMemo(
        () => buildUnitFilterOptions(products),
        [products],
    );

    const availableSuppliers = useMemo(
        () => buildSupplierFilterOptions(products),
        [products],
    );

    const toggleCategory = (id) => {
        const key = String(id);
        setSelectedCategories((prev) =>
            prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
        );
        setPage(1);
    };

    const toggleUnit = (unit) => {
        setSelectedUnits((prev) =>
            prev.includes(unit) ? prev.filter((item) => item !== unit) : [...prev, unit],
        );
        setPage(1);
    };

    const toggleSupplier = (supplier) => {
        setSelectedSuppliers((prev) =>
            prev.includes(supplier)
                ? prev.filter((item) => item !== supplier)
                : [...prev, supplier],
        );
        setPage(1);
    };

    const handleApplyFilter = () => {
        setAppliedMinPrice(parseInputPrice(draftMinPrice));
        setAppliedMaxPrice(parseInputPrice(draftMaxPrice));
        setAppliedMinQuantity(parseInputPrice(draftMinQuantity));
        setPage(1);
    };

    const filteredProducts = useMemo(() => {
        return catalog.filter((product) => {
            const productCategoryId =
                product.category_id != null ? String(product.category_id) : "";

            const matchCategory =
                selectedCategories.length === 0 ||
                (productCategoryId !== "" &&
                    selectedCategories.includes(productCategoryId));

            const matchUnit =
                selectedUnits.length === 0 ||
                selectedUnits.includes(
                    product.unitFilterKey ?? product.unitKey ?? "",
                );

            const matchMin =
                appliedMinPrice == null || product.priceValue >= appliedMinPrice;

            const matchMax =
                appliedMaxPrice == null || product.priceValue <= appliedMaxPrice;

            const supplierName = product.supplier_name || "";
            const matchSupplier =
                selectedSuppliers.length === 0 ||
                selectedSuppliers.includes(supplierName);

            const matchStock =
                stockFilter === "all" ||
                (stockFilter === "in_stock" && product.in_stock) ||
                (stockFilter === "out_of_stock" && !product.in_stock);

            const matchMinQuantity =
                appliedMinQuantity == null ||
                Number(product.available_quantity ?? 0) >= appliedMinQuantity;

            return (
                matchCategory &&
                matchUnit &&
                matchMin &&
                matchMax &&
                matchSupplier &&
                matchStock &&
                matchMinQuantity
            );
        });
    }, [
        catalog,
        selectedCategories,
        selectedUnits,
        selectedSuppliers,
        stockFilter,
        appliedMinPrice,
        appliedMaxPrice,
        appliedMinQuantity,
    ]);

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));

    const pageProducts = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredProducts.slice(start, start + PAGE_SIZE);
    }, [filteredProducts, page]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const visibleCategories = categories.filter(
        (item) => item.status !== "inactive" && item.status !== "rejected",
    );

    return (
        <section id="kham-pha" className="mx-auto w-full max-w-[1280px] px-10 pt-12 pb-4">
            <div className="mb-8">
                <h2 className="font-playfair text-2xl font-bold text-emerald-950">
                    Khám phá sản phẩm
                </h2>
            </div>

            {error ? (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            ) : null}

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <aside className="w-full shrink-0 rounded-lg border border-stone-200 bg-white shadow-sm lg:w-[280px]">
                    <div className="border-b border-stone-200 px-5 py-4">
                        <h3 className="text-base font-bold text-zinc-900">Bộ lọc</h3>
                    </div>

                    <div className="px-5">
                        <FilterSection title="Danh mục">
                            <div className="flex flex-wrap gap-2">
                                {loading ? (
                                    <span className="text-xs text-neutral-400">
                                        Đang tải...
                                    </span>
                                ) : visibleCategories.length > 0 ? (
                                    visibleCategories.map((category) => (
                                        <TagButton
                                            key={category.id}
                                            active={selectedCategories.includes(
                                                String(category.id),
                                            )}
                                            onClick={() =>
                                                toggleCategory(String(category.id))
                                            }
                                        >
                                            {category.name}
                                            {category.product_count != null ? (
                                                <span className="ml-1 opacity-70">
                                                    ({category.product_count})
                                                </span>
                                            ) : null}
                                        </TagButton>
                                    ))
                                ) : (
                                    <span className="text-xs text-neutral-400">
                                        Chưa có danh mục
                                    </span>
                                )}
                            </div>
                        </FilterSection>

                        <FilterSection title="Đơn vị tính">
                            <div className="flex flex-wrap gap-2">
                                {loading ? (
                                    <span className="text-xs text-neutral-400">
                                        Đang tải...
                                    </span>
                                ) : availableUnits.length > 0 ? (
                                    availableUnits.map((unit) => (
                                        <TagButton
                                            key={unit.value}
                                            active={selectedUnits.includes(unit.value)}
                                            onClick={() => toggleUnit(unit.value)}
                                        >
                                            {unit.label}
                                            {unit.count != null ? (
                                                <span className="ml-1 opacity-70">
                                                    ({unit.count})
                                                </span>
                                            ) : null}
                                        </TagButton>
                                    ))
                                ) : (
                                    <span className="text-xs text-neutral-400">
                                        Chưa có dữ liệu
                                    </span>
                                )}
                            </div>
                        </FilterSection>

                        <FilterSection title="Tồn kho">
                            <div className="flex flex-wrap gap-2">
                                <TagButton
                                    active={stockFilter === "all"}
                                    onClick={() => {
                                        setStockFilter("all");
                                        setPage(1);
                                    }}
                                >
                                    Tất cả
                                </TagButton>
                                <TagButton
                                    active={stockFilter === "in_stock"}
                                    onClick={() => {
                                        setStockFilter("in_stock");
                                        setPage(1);
                                    }}
                                >
                                    Còn hàng
                                </TagButton>
                                <TagButton
                                    active={stockFilter === "out_of_stock"}
                                    onClick={() => {
                                        setStockFilter("out_of_stock");
                                        setPage(1);
                                    }}
                                >
                                    Hết hàng
                                </TagButton>
                            </div>
                            <div className="mt-3">
                                <label className="mb-1.5 block text-xs text-neutral-500">
                                    Số lượng tối thiểu
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="VD: 10"
                                    value={draftMinQuantity}
                                    onChange={(e) =>
                                        setDraftMinQuantity(e.target.value)
                                    }
                                    className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                                />
                            </div>
                        </FilterSection>

                        <FilterSection title="Khoảng giá">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0 đ"
                                    value={draftMinPrice}
                                    onChange={(e) => setDraftMinPrice(e.target.value)}
                                    className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                                />
                                <span className="text-neutral-400">-</span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="500.000 đ"
                                    value={draftMaxPrice}
                                    onChange={(e) => setDraftMaxPrice(e.target.value)}
                                    className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                                />
                            </div>
                        </FilterSection>
                    </div>

                    <div className="p-5 pt-2">
                        <button
                            type="button"
                            onClick={handleApplyFilter}
                            className="w-full rounded-md bg-emerald-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
                        >
                            Áp dụng bộ lọc
                        </button>
                    </div>
                </aside>

                <div className="min-w-0 flex-1">
                    {loading ? (
                        <div className="flex h-48 items-center justify-center rounded-lg border border-stone-200 bg-white">
                            <Loader2 className="h-7 w-7 animate-spin text-emerald-700" />
                        </div>
                    ) : pageProducts.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-stone-200 bg-white px-6 py-16 text-center text-sm text-neutral-500">
                            Không tìm thấy sản phẩm phù hợp với bộ lọc.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {pageProducts.map((product) => (
                                <FilterProductCard
                                    key={product.id}
                                    id={product.id}
                                    brand={product.brand}
                                    categoryName={product.category_name}
                                    name={product.name}
                                    price={product.price}
                                    rating={product.rating}
                                    availableQuantity={product.available_quantity}
                                    unit={product.unit}
                                    inStock={product.in_stock}
                                    image={product.image}
                                />
                            ))}
                        </div>
                    )}

                    {filteredProducts.length > 0 && (
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onChange={setPage}
                        />
                    )}
                </div>
            </div>
        </section>
    );
}

function Pagination({ page, totalPages, onChange }) {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="mt-8 flex items-center justify-center gap-1">
            <PaginationBtn
                disabled={page === 1}
                onClick={() => onChange(1)}
                aria-label="Trang đầu"
            >
                <ChevronsLeft className="h-4 w-4" />
            </PaginationBtn>
            <PaginationBtn
                disabled={page === 1}
                onClick={() => onChange(page - 1)}
                aria-label="Trang trước"
            >
                <ChevronLeft className="h-4 w-4" />
            </PaginationBtn>

            {pages.map((p) => (
                <button
                    key={p}
                    type="button"
                    onClick={() => onChange(p)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${p === page
                        ? "bg-emerald-700 text-white"
                        : "text-neutral-600 hover:bg-emerald-50 hover:text-emerald-800"
                        }`}
                >
                    {p}
                </button>
            ))}

            <PaginationBtn
                disabled={page === totalPages}
                onClick={() => onChange(page + 1)}
                aria-label="Trang sau"
            >
                <ChevronRight className="h-4 w-4" />
            </PaginationBtn>
            <PaginationBtn
                disabled={page === totalPages}
                onClick={() => onChange(totalPages)}
                aria-label="Trang cuối"
            >
                <ChevronsRight className="h-4 w-4" />
            </PaginationBtn>
        </div>
    );
}

function PaginationBtn({ disabled, onClick, children, ...props }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
            {...props}
        >
            {children}
        </button>
    );
}
