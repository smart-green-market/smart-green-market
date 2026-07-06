import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Toolbar from "../../components/Admin/UI/Toolbar";
import { AdminInitialLoadGate } from "../../components/Admin/UI/AdminFetchState";
import AdminFilterStatsCards from "../../components/Admin/UI/AdminFilterStatsCards";
import { SUPPLIER_FINANCE_STAT_CARDS } from "../../components/Admin/UI/adminFilterStatsPresets";
import SupplierFinanceFilter from "../../components/Admin/SupplierFinance/SupplierFinanceFilter";
import SupplierFinanceCard from "../../components/Admin/SupplierFinance/SupplierFinanceCard";
import Pagination from "../../components/common/Pagination";
import {
    adminSupplierFinanceService,
    handleApiError,
    PAGE_SIZE,
} from "../../services/api/Admin/adminSupplierFinanceService";
import { buildFinanceOverviewCounts } from "../../utils/supplierFinanceUtils";

export default function SupplierFinancePage() {
    const [overview, setOverview] = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const [totalCount, setTotalCount] = useState(0);

    const [isFetching, setIsFetching] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const hasLoadedRef = useRef(false);

    const financeStats = useMemo(
        () => buildFinanceOverviewCounts(overview),
        [overview],
    );

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, 350);

        return () => window.clearTimeout(timer);
    }, [search]);

    const fetchData = useCallback(
        async ({ page = 1, initial = false } = {}) => {
            try {
                if (initial) {
                    setIsFetching(true);
                    setLoadError("");
                } else {
                    setLoading(true);
                }
                setError("");

                const query = {
                    verification_status: statusFilter || undefined,
                    search: debouncedSearch || undefined,
                };

                const [overviewData, listData] = await Promise.all([
                    adminSupplierFinanceService.getOverview(query),
                    adminSupplierFinanceService.getList({
                        ...query,
                        page,
                    }),
                ]);

                setOverview(overviewData);
                setSuppliers(listData.results);
                setTotalCount(listData.count);
            } catch (err) {
                const message = handleApiError(
                    err,
                    "Không thể tải dữ liệu tài chính nhà cung cấp",
                );
                if (initial) {
                    setLoadError(message);
                } else {
                    setError(message);
                }
            } finally {
                if (initial) {
                    setIsFetching(false);
                } else {
                    setLoading(false);
                }
            }
        },
        [debouncedSearch, statusFilter],
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch]);

    useEffect(() => {
        fetchData({
            page: currentPage,
            initial: !hasLoadedRef.current,
        });
        hasLoadedRef.current = true;
    }, [currentPage, debouncedSearch, statusFilter, fetchData]);

    const handleFilterChange = (value) => {
        setStatusFilter(value);
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <AdminInitialLoadGate
            isFetching={isFetching}
            loadError={loadError}
            onRetry={() => fetchData({ page: currentPage, initial: true })}
            loadingMessage="Đang tải dữ liệu tài chính nhà cung cấp..."
        >
            <div className="flex flex-col gap-6 px-8 pt-6 pb-10">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 font-['Geist',sans-serif]">
                        Quản lý tài chính nhà cung cấp
                    </h1>
                    <p className="mt-1 text-sm text-neutral-500">
                        Theo dõi doanh thu và dòng tiền của từng nhà cung cấp.
                        {overview?.supplierCount ? (
                            <span className="ml-1 font-medium text-emerald-700">
                                {overview.supplierCount} nhà cung cấp trong hệ thống
                            </span>
                        ) : null}
                    </p>
                </div>

                <AdminFilterStatsCards
                    counts={financeStats}
                    cards={SUPPLIER_FINANCE_STAT_CARDS}
                    activeFilter={statusFilter}
                    onFilterChange={handleFilterChange}
                    loading={isFetching || loading}
                />

                <Toolbar
                    search={search}
                    onSearch={setSearch}
                    searchPlaceholder="Tìm theo tên công ty, mã số thuế..."
                    filter={
                        <SupplierFinanceFilter
                            value={statusFilter}
                            onChange={handleFilterChange}
                        />
                    }
                />

                {error ? (
                    <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {loading && !isFetching ? (
                    <div className="flex justify-center py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
                    </div>
                ) : suppliers.length > 0 ? (
                    <div className="flex flex-col gap-5">
                        {suppliers.map((supplier) => (
                            <SupplierFinanceCard
                                key={supplier.id}
                                supplier={supplier}
                            />
                        ))}

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
                        <p className="text-sm font-medium text-neutral-700">
                            Không tìm thấy nhà cung cấp phù hợp
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                            Thử đổi bộ lọc hoặc từ khóa tìm kiếm khác.
                        </p>
                    </div>
                )}
            </div>
        </AdminInitialLoadGate>
    );
}
