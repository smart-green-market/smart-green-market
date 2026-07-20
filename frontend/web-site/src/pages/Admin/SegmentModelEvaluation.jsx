import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Store,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Pagination from "../../components/common/Pagination";
import {
  AdminPageLoadError,
  AdminPageShell,
} from "../../components/Admin/UI/AdminFetchState";
import {
  adminSegmentAiService,
  handleSegmentAiError,
} from "../../services/api/Admin/adminSegmentAiService";

const PAGE_SIZE = 10;

function scoreMeta(score) {
  if (score == null) {
    return { label: "Chưa có", className: "bg-neutral-100 text-neutral-600", icon: Clock3 };
  }
  if (score < 0.4) {
    return { label: "Cần cải thiện", className: "bg-amber-100 text-amber-800", icon: AlertTriangle };
  }
  if (score < 0.5) {
    return { label: "Ổn định", className: "bg-sky-100 text-sky-800", icon: Activity };
  }
  return { label: "Đáng tin cậy", className: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 };
}

function formatDateTime(value) {
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

export default function SegmentModelEvaluationPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState({ count: 0, page: 1, page_size: PAGE_SIZE, results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminSegmentAiService.getAdminHistory({
        page,
        page_size: PAGE_SIZE,
      });
      setHistory(data);
    } catch (requestError) {
      setError(handleSegmentAiError(requestError, "Không thể tải lịch sử đánh giá mô hình."));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    // Đồng bộ lịch sử phân loại từ API theo trang hiện tại.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHistory();
  }, [fetchHistory]);

  const totalPages = Math.max(1, Math.ceil(history.count / history.page_size));

  if (error && history.results.length === 0) {
    return (
      <AdminPageShell>
        <AdminPageLoadError message={error} onRetry={fetchHistory} />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại trang trước
      </button>

      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950 via-violet-800 to-emerald-700 px-6 py-7 text-white shadow-lg sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <BrainCircuit className="h-6 w-6" />
            </span>
            <div>
              <h1 className="mt-2 text-2xl font-black">Đánh giá chất lượng phân khúc</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchHistory}
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/20 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Làm mới
          </button>
        </div>
      </section>

      <div className="flex gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm leading-6 text-indigo-950">
        <p>
          <strong>Silhouette Score</strong> chỉ số đánh giá chất lượng phân loại khách hàng <strong>(giao động từ -1 đến 1)</strong>.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-black text-neutral-900">Lịch sử phân loại toàn hệ thống</h2>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
          </div>
        ) : history.results.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center text-center text-neutral-400">
            <BrainCircuit className="h-10 w-10" />
            <p className="mt-3 text-sm font-semibold">Chưa có phiên phân loại khách hàng.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead className="bg-neutral-50 text-[11px] font-black uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-6 py-4">Đại lý</th>
                    <th className="px-4 py-4 text-center">Khách hàng</th>
                    <th className="px-4 py-4">Silhouette Score</th>
                    <th className="px-4 py-4">Đánh giá</th>
                    <th className="px-6 py-4">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {history.results.map((item) => {
                    const meta = scoreMeta(item.silhouette_score);
                    const ScoreIcon = meta.icon;
                    return (
                      <tr key={item.id} className="transition hover:bg-violet-50/30">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                              <Store className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="font-bold text-neutral-900">
                                {item.dealer_name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center font-black text-neutral-900">
                          {item.total_customers.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-mono text-base font-black text-neutral-900">
                            {item.silhouette_score == null ? "—" : item.silhouette_score.toFixed(3)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-black ${meta.className}`}>
                            <ScoreIcon className="h-3.5 w-3.5" /> {meta.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                          {item.formatted_created_at || formatDateTime(item.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-neutral-100 px-6 pb-6 pt-1">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </section>
    </AdminPageShell>
  );
}
