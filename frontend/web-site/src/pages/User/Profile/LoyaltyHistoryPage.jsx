import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Coins,
  Gift,
  Loader2,
  ReceiptText,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import Pagination from "../../../components/common/Pagination";
import { useDealerSlug, useStorefrontPaths } from "../../../hooks/useStorefrontPaths";
import {
  buyerLoyaltyService,
  handleLoyaltyApiError,
  normalizeLoyaltyHistory,
} from "../../../services/api/Buyer/buyerLoyaltyService";

const PAGE_SIZE = 10;
const numberFormat = new Intl.NumberFormat("vi-VN");

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function PointChange({ points }) {
  const value = Number(points ?? 0);
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownLeft;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold ${
        positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {positive ? "+" : ""}{numberFormat.format(value)}
    </span>
  );
}

export default function LoyaltyHistoryPage() {
  const dealerSlug = useDealerSlug();
  const paths = useStorefrontPaths();
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState(() => normalizeLoyaltyHistory(null, PAGE_SIZE));
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    if (!dealerSlug) {
      setError("Chưa xác định cửa hàng.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const payload = await buyerLoyaltyService.getHistory(dealerSlug, {
        page,
        page_size: PAGE_SIZE,
      });
      const normalized = normalizeLoyaltyHistory(payload, PAGE_SIZE);
      const lastPage = Math.max(1, Math.ceil(normalized.count / normalized.page_size));
      setHistory(normalized);
      if (page > lastPage) setPage(lastPage);
    } catch (requestError) {
      setError(
        handleLoyaltyApiError(requestError, "Không thể tải lịch sử điểm."),
      );
    } finally {
      setLoading(false);
    }
  }, [dealerSlug, page]);

  useEffect(() => {
    // Đồng bộ trang hiện tại từ API mỗi khi page/storefront thay đổi.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!dealerSlug) return;
    buyerLoyaltyService
      .getMyScore(dealerSlug)
      .then(setScore)
      .catch(() => setScore(null));
  }, [dealerSlug]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(history.count / history.page_size)),
    [history.count, history.page_size],
  );

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-600 px-6 py-6 text-white">
          <Link
            to={paths.account}
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-50 no-underline hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại hồ sơ
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <Coins className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold">Lịch sử điểm thành viên</h1>
                <p className="mt-1 text-sm text-emerald-50/80">
                  Theo dõi toàn bộ giao dịch cộng và trừ điểm của bạn.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 backdrop-blur">
              <p className="text-xs text-emerald-50/75">Số dư hiện tại</p>
              <p className="mt-1 text-2xl font-bold">
                {numberFormat.format(Number(score?.loyalty_points ?? 0))} điểm
              </p>
              <p className="mt-1 text-xs text-emerald-50/75">
                {score?.current_tier?.name || "Thành viên"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-6 py-4">
          <div>
            <h2 className="font-bold text-neutral-900">Các lần thay đổi điểm</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Tổng {numberFormat.format(history.count)} giao dịch
            </p>
          </div>
          <button
            type="button"
            onClick={loadHistory}
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 px-3.5 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
          </div>
        ) : error ? (
          <div className="m-6 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={loadHistory}
              className="mt-4 cursor-pointer rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Thử lại
            </button>
          </div>
        ) : history.results.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <Gift className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-bold text-neutral-900">Chưa có giao dịch điểm</h3>
            <p className="mt-1 max-w-sm text-sm text-neutral-500">
              Hoàn tất đơn hàng đầu tiên để bắt đầu tích điểm và mở khóa hạng thành viên.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead className="bg-neutral-50 text-[11px] uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-6 py-3.5">Thời gian</th>
                    <th className="px-4 py-3.5">Nội dung</th>
                    <th className="px-4 py-3.5">Đơn hàng</th>
                    <th className="px-4 py-3.5 text-center">Thay đổi</th>
                    <th className="px-4 py-3.5 text-right">Trước</th>
                    <th className="px-6 py-3.5 text-right">Sau</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {history.results.map((item) => (
                    <tr key={item.id} className="transition hover:bg-emerald-50/40">
                      <td className="whitespace-nowrap px-6 py-4 text-xs text-neutral-500">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                            <ReceiptText className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-neutral-900">
                              {item.transaction_type_label || "Điều chỉnh điểm"}
                            </p>
                            <p className="mt-0.5 max-w-[260px] text-xs leading-5 text-neutral-500">
                              {item.reason || "Giao dịch điểm thành viên"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-neutral-700">
                        {item.order_code || (item.order_id ? `#${item.order_id}` : "—")}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <PointChange points={item.points} />
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-neutral-500">
                        {numberFormat.format(Number(item.balance_before ?? 0))}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-neutral-900">
                        {numberFormat.format(Number(item.balance_after ?? 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-neutral-100 px-6 pb-6 pt-1">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
