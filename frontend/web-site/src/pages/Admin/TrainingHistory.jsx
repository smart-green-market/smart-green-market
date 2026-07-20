import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Database,
  Eye,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import TrainingHistoryDetailModal from "../../components/Admin/Training/TrainingHistoryDetailModal";
import {
  AdminPageLoadError,
  AdminPageShell,
} from "../../components/Admin/UI/AdminFetchState";
import Pagination from "../../components/common/Pagination";
import { formatDateTime } from "../../components/common/formatDateTime";
import {
  aiTrainingServicer,
  handleApiError,
} from "../../services/api/Admin/aiTrainingServicer";

const PAGE_SIZE = 10;

const STATUS_META = {
  success: { label: "Thành công", className: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  completed: { label: "Hoàn tất", className: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  running: { label: "Đang chạy", className: "bg-sky-100 text-sky-800", icon: Clock3 },
  training: { label: "Đang huấn luyện", className: "bg-sky-100 text-sky-800", icon: Clock3 },
  failed: { label: "Thất bại", className: "bg-red-100 text-red-800", icon: AlertTriangle },
  error: { label: "Có lỗi", className: "bg-red-100 text-red-800", icon: AlertTriangle },
  unknown: { label: "Chưa xác định", className: "bg-neutral-100 text-neutral-700", icon: Clock3 },
};

function formatNumber(value, maximumFractionDigits = 4) {
  if (value == null) return "—";
  return Number(value).toLocaleString("vi-VN", { maximumFractionDigits });
}

function formatPercent(value) {
  return `${Number(value || 0).toLocaleString("vi-VN", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

export default function TrainingHistoryPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState({
    count: 0,
    page: 1,
    page_size: PAGE_SIZE,
    results: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await aiTrainingServicer.getTrainRelatedProducts({
        page,
        page_size: PAGE_SIZE,
      });
      setHistory(data);
    } catch (requestError) {
      setError(handleApiError(requestError, "Không thể tải lịch sử huấn luyện AI."));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    // Tải đúng trang lịch sử huấn luyện hiện tại từ API.
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
        className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại trang trước
      </button>

      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-emerald-800 px-6 py-7 text-white shadow-lg sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <BrainCircuit className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-100">
                Related products · Item2Vec
              </p>
              <h1 className="mt-1 text-2xl font-black">Lịch sử huấn luyện AI</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
                Kiểm tra từng phiên huấn luyện, độ hội tụ Loss và tỷ lệ sản phẩm đã có dữ liệu gợi ý.
              </p>
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
        <Database className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" />
        <p>
          <strong>Coverage</strong> cho biết phạm vi sản phẩm có gợi ý; <strong>Final loss</strong> là sai số cuối quá trình huấn luyện. Nhấn “Xem chi tiết” để xem đường Loss và coverage từng Đại lý.
        </p>
      </div>

      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchHistory}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white hover:bg-red-700"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Thử lại
          </button>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-black text-neutral-950">Các phiên huấn luyện gần đây</h2>
            <p className="mt-1 text-sm text-neutral-500">Danh sách được phân trang trực tiếp từ API.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-700" />
          </div>
        ) : history.results.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center text-center text-neutral-400">
            <BrainCircuit className="h-10 w-10" />
            <p className="mt-3 text-sm font-semibold">Chưa có phiên huấn luyện nào.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] border-collapse text-left">
                <thead className="bg-neutral-50 text-[11px] font-black uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-6 py-4">Phiên / mô hình</th>
                    <th className="px-4 py-4">Thời gian</th>
                    <th className="px-4 py-4 text-right">Final loss</th>
                    <th className="px-4 py-4">Catalog coverage (%)</th>
                    <th className="px-4 py-4 text-right">Sản phẩm đã học</th>
                    <th className="px-4 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {history.results.map((session) => {
                    const statusMeta = STATUS_META[session.status] || STATUS_META.unknown;
                    const StatusIcon = statusMeta.icon;
                    return (
                      <tr key={session.id} className="transition hover:bg-indigo-50/30">
                        <td className="px-6 py-4">
                          <p className="font-black text-neutral-950">Phiên #{session.id ?? "—"}</p>
                          <p className="mt-0.5 text-xs font-semibold text-neutral-500">{session.model_name}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-neutral-600">
                          {formatDateTime(session.run_date)}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-sm font-black text-neutral-900">
                          {formatNumber(session.final_loss, 6)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex min-w-40 items-center gap-3">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${Math.min(100, Math.max(0, session.catalog_coverage))}%` }}
                              />
                            </div>
                            <span className="w-12 text-right text-xs font-black text-neutral-700">
                              {formatPercent(session.catalog_coverage)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right font-black text-neutral-900">
                          {formatNumber(session.total_items_trained, 0)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ${statusMeta.className}`}>
                              <StatusIcon className="h-3 w-3" /> {statusMeta.label}
                            </span>
                            {session.has_warnings ? (
                              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-800">
                                Cảnh báo
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedSessionId(session.id)}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-800 transition hover:bg-indigo-100"
                          >
                            <Eye className="h-4 w-4" /> Xem chi tiết
                          </button>
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

      <TrainingHistoryDetailModal
        open={selectedSessionId != null}
        sessionId={selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
      />
    </AdminPageShell>
  );
}