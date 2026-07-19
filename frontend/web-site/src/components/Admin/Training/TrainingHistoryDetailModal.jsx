import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Database,
  Gauge,
  Layers3,
  Loader2,
  RefreshCw,
  Store,
  X,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDateTime } from "../../common/formatDateTime";
import {
  aiTrainingServicer,
  handleApiError,
} from "../../../services/api/Admin/aiTrainingServicer";

const STATUS_META = {
  success: { label: "Thành công", className: "bg-emerald-100 text-emerald-800" },
  completed: { label: "Hoàn tất", className: "bg-emerald-100 text-emerald-800" },
  running: { label: "Đang chạy", className: "bg-sky-100 text-sky-800" },
  training: { label: "Đang huấn luyện", className: "bg-sky-100 text-sky-800" },
  failed: { label: "Thất bại", className: "bg-red-100 text-red-800" },
  error: { label: "Có lỗi", className: "bg-red-100 text-red-800" },
  unknown: { label: "Chưa xác định", className: "bg-neutral-100 text-neutral-700" },
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

export default function TrainingHistoryDetailModal({ open, sessionId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDetail = useCallback(async () => {
    if (sessionId == null) return;
    setLoading(true);
    setError("");
    setDetail(null);
    try {
      const data = await aiTrainingServicer.getTrainRelatedProductDetail(sessionId);
      setDetail(data);
    } catch (requestError) {
      setError(handleApiError(requestError, "Không thể tải chi tiết phiên huấn luyện."));
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!open) return;
    // Đồng bộ chi tiết đúng phiên khi modal được mở.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDetail();
  }, [fetchDetail, open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  const dealers = useMemo(
    () =>
      [...(detail?.dealer_coverage_detail || [])].sort(
        (left, right) =>
          Number(right.has_warning) - Number(left.has_warning) ||
          left.coverage - right.coverage,
      ),
    [detail?.dealer_coverage_detail],
  );

  if (!open) return null;

  const statusMeta = STATUS_META[detail?.status] || STATUS_META.unknown;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-neutral-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="training-detail-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <header className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-emerald-800 px-6 py-6 text-white sm:px-8">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[34px] border-white/5" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative flex items-start gap-4 pr-12">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <BrainCircuit className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-100">
                Item2Vec training run
              </p>
              <h2 id="training-detail-title" className="mt-1 text-xl font-black sm:text-2xl">
                Chi tiết phiên huấn luyện #{sessionId}
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Theo dõi độ hội tụ của mô hình và phạm vi sản phẩm được tạo gợi ý.
              </p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex min-h-[460px] flex-col items-center justify-center gap-3 text-neutral-500">
            <Loader2 className="h-9 w-9 animate-spin text-indigo-700" />
            <p className="text-sm font-semibold">Đang tải chi tiết phiên huấn luyện...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
            <AlertTriangle className="h-10 w-10 text-red-500" />
            <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>
            <button
              type="button"
              onClick={fetchDetail}
              className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-800"
            >
              <RefreshCw className="h-4 w-4" /> Thử lại
            </button>
          </div>
        ) : detail ? (
          <div className="space-y-6 p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-black text-neutral-950">{detail.model_name}</p>
                <p className="mt-1 text-sm text-neutral-500">
                  Chạy lúc {formatDateTime(detail.run_date)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {detail.has_warnings ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5" /> Có cảnh báo
                  </span>
                ) : null}
                <span className={`rounded-full px-3 py-1.5 text-xs font-black ${statusMeta.className}`}>
                  {statusMeta.label}
                </span>
              </div>
            </div>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric icon={Layers3} label="Số epoch" value={formatNumber(detail.epochs_run, 0)} />
              <Metric icon={Gauge} label="Final loss" value={formatNumber(detail.final_loss, 6)} />
              <Metric icon={CheckCircle2} label="Catalog coverage" value={formatPercent(detail.catalog_coverage)} />
              <Metric icon={Database} label="Sản phẩm đã học" value={formatNumber(detail.total_items_trained, 0)} />
            </section>

            <section className="rounded-2xl border border-neutral-200 p-5">
              <div>
                <h3 className="font-black text-neutral-950">Loss qua từng epoch</h3>
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  Đường loss giúp nhận biết mô hình có đang hội tụ ổn định trong quá trình huấn luyện hay không.
                </p>
              </div>
              {detail.loss_history.length > 0 ? (
                <div className="mt-5 h-72 w-full" role="img" aria-label="Biểu đồ loss theo epoch">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={detail.loss_history} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} domain={["auto", "auto"]} />
                      <Tooltip
                        labelFormatter={(epoch) => `Epoch ${epoch}`}
                        formatter={(value) => [formatNumber(value, 6), "Loss"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="loss"
                        name="Loss"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="mt-5 flex h-40 items-center justify-center rounded-xl bg-neutral-50 text-sm font-medium text-neutral-400">
                  API chưa trả lịch sử loss theo epoch.
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-neutral-200">
              <div className="border-b border-neutral-100 px-5 py-4">
                <h3 className="font-black text-neutral-950">Coverage theo Đại lý</h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Đại lý có cảnh báo được đưa lên đầu để Admin xử lý nhanh.
                </p>
              </div>
              {dealers.length > 0 ? (
                <div className="divide-y divide-neutral-100">
                  {dealers.map((dealer) => (
                    <div key={dealer.id} className="grid gap-4 px-5 py-4 sm:grid-cols-[minmax(180px,1fr)_minmax(220px,1.5fr)_auto] sm:items-center">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${dealer.has_warning ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                          <Store className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-neutral-900">{dealer.dealer_name}</p>
                          <p className="text-xs text-neutral-400">ID: {dealer.dealer_id ?? "—"}</p>
                        </div>
                      </div>
                      <div>
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                          <span className="text-neutral-500">
                            {dealer.covered_items || dealer.total_items
                              ? `${formatNumber(dealer.covered_items, 0)}/${formatNumber(dealer.total_items, 0)} sản phẩm`
                              : "Phạm vi catalog"}
                          </span>
                          <span className="font-black text-neutral-800">{formatPercent(dealer.coverage)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                          <div
                            className={`h-full rounded-full ${dealer.has_warning ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${Math.min(100, Math.max(0, dealer.coverage))}%` }}
                          />
                        </div>
                      </div>
                      <div className="sm:text-right">
                        {dealer.has_warning ? (
                          <span className="inline-flex max-w-64 items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            {dealer.warning_message || "Thiếu dữ liệu gợi ý"}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700">Ổn định</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-10 text-center text-sm text-neutral-400">
                  API chưa trả coverage chi tiết theo Đại lý.
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <article className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4">
      <Icon className="h-5 w-5 text-indigo-700" />
      <p className="mt-3 text-[10px] font-black uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-1 text-xl font-black text-neutral-950">{value}</p>
    </article>
  );
}
