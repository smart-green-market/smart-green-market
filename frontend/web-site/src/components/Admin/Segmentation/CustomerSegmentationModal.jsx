import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Loader2,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { dealerService } from "../../../services/api/dealerService";
import {
  adminSegmentAiService,
  handleSegmentAiError,
} from "../../../services/api/Admin/adminSegmentAiService";

const DAY_OPTIONS = [30, 60, 90, 180];

function ScoreBadge({ score }) {
  if (score == null) return <span className="text-neutral-400">Chưa có SC</span>;
  const low = score < 0.4;
  return (
    <span className={`text-3xl font-black ${low ? "text-amber-600" : "text-emerald-700"}`}>
      {score.toFixed(3)}
    </span>
  );
}

export default function CustomerSegmentationModal({ open, onClose }) {
  const [dealers, setDealers] = useState([]);
  const [dealerId, setDealerId] = useState("");
  const [tDays, setTDays] = useState(60);
  const [loadingDealers, setLoadingDealers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const loadDealers = useCallback(async () => {
    setLoadingDealers(true);
    setError("");
    try {
      const data = await dealerService.getList({ page: 1, page_size: 100 });
      const rows = Array.isArray(data?.results) ? data.results : [];
      setDealers(rows);
      setDealerId((current) => current || String(rows[0]?.id ?? ""));
    } catch (requestError) {
      setError(handleSegmentAiError(requestError, "Không thể tải danh sách đại lý."));
    } finally {
      setLoadingDealers(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    // Tải dữ liệu ngoài hệ thống khi modal được mở.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDealers();
  }, [loadDealers, open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open, submitting]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!dealerId) {
      setError("Vui lòng chọn đại lý cần phân loại.");
      return;
    }

    setSubmitting(true);
    setError("");
    setResult(null);
    try {
      const response = await adminSegmentAiService.customerSegmentation({
        dealer_id: dealerId,
        t_days: tDays,
      });
      if (!response.success) {
        setError(response.message || "Phân loại khách hàng không thành công.");
        return;
      }
      setResult(response);
    } catch (requestError) {
      setError(handleSegmentAiError(requestError, "Không thể phân loại khách hàng."));
    } finally {
      setSubmitting(false);
    }
  };

  const lowConfidence = result?.silhouette_score != null && result.silhouette_score < 0.4;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="segment-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <header className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-violet-950 via-violet-800 to-emerald-700 px-6 py-6 text-white">
          <div className="absolute -right-14 -top-14 h-48 w-48 rounded-full border-[28px] border-white/10" />
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="absolute right-5 top-5 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative flex items-start gap-4 pr-12">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <BrainCircuit className="h-6 w-6" />
            </span>
            <div>
              <h2 id="segment-modal-title" className="text-xl font-black">
                Phân loại khách hàng
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-violet-50/85">
                Phân loại khách hàng một Đại lý và đánh giá chất lượng.
              </p>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wide text-neutral-600">
                Đại lý cần phân loại
              </span>
              <select
                value={dealerId}
                onChange={(event) => setDealerId(event.target.value)}
                disabled={loadingDealers || submitting}
                className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              >
                {loadingDealers ? <option value="">Đang tải đại lý...</option> : null}
                {!loadingDealers && dealers.length === 0 ? (
                  <option value="">Không có đại lý</option>
                ) : null}
                {dealers.map((dealer) => (
                  <option key={dealer.id} value={dealer.id}>
                    {dealer.store_name || `Đại lý #${dealer.id}`}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wide text-neutral-600">
                Khoảng dữ liệu
              </span>
              <select
                value={tDays}
                onChange={(event) => setTDays(Number(event.target.value))}
                disabled={submitting}
                className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              >
                {DAY_OPTIONS.map((days) => (
                  <option key={days} value={days}>{days} ngày gần nhất</option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {result ? (
            <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-black text-emerald-950">Phân loại hoàn tất</p>
                    <p className="mt-0.5 text-xs text-emerald-800/70">{result.message}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
                    Silhouette Score
                  </p>
                  <ScoreBadge score={result.silhouette_score} />
                </div>
              </div>

              {lowConfidence ? (
                <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-900">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <p>
                    <strong>Độ tin cậy thấp (SC &lt; 0.4).</strong> Nên thu thập thêm dữ liệu đơn hàng hoặc tăng số khách hàng trước khi dùng kết quả để ra quyết định.
                  </p>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {result.segment_counts.map((segment) => (
                  <div key={segment.code} className="rounded-xl border border-white bg-white px-3 py-3 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                      {segment.label}
                    </p>
                    <p className="mt-1 text-2xl font-black text-neutral-900">
                      {segment.count.toLocaleString("vi-VN")}
                    </p>
                    <p className="text-[11px] text-neutral-400">khách hàng</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-600">
                <Users className="h-4 w-4 text-violet-600" />
                Tổng dữ liệu: {result.total_customers.toLocaleString("vi-VN")} khách hàng
              </div>
            </div>
          ) : null}

          <div className="flex flex-col-reverse justify-end gap-3 border-t border-neutral-100 pt-5 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="cursor-pointer rounded-xl border border-neutral-200 px-5 py-3 text-sm font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={submitting || loadingDealers || !dealerId}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {submitting ? "Đang phân loại..." : "Bắt đầu phân loại"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
