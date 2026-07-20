import { useCallback, useEffect, useMemo, useState } from "react";
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
    return { label: "Chấp nhận được", className: "bg-sky-100 text-sky-800", icon: Activity };
  }
  return { label: "Độ tin cậy tốt", className: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 };
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
  const validScores = useMemo(
    () => history.results.map((item) => item.silhouette_score).filter((score) => score != null),
    [history.results],
  );
  const averageScore = validScores.length
    ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
    : null;
  const lowScoreCount = validScores.filter((score) => score < 0.4).length;
  const latestScore = history.results[0]?.silhouette_score ?? null;

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

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={Activity}
          label="SC trung bình (trang này)"
          value={averageScore == null ? "—" : averageScore.toFixed(3)}
          description="SC càng gần 1, các phân khúc càng tách biệt rõ."
          tone="violet"
        />
        <MetricCard
          icon={BrainCircuit}
          label="Tổng phiên phân loại"
          value={history.count.toLocaleString("vi-VN")}
          description="Số lần chạy mô hình trên toàn hệ thống."
          tone="emerald"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Phiên SC < 0.4 (trang này)"
          value={lowScoreCount.toLocaleString("vi-VN")}
          description="Nên thu thập thêm dữ liệu trước khi ra quyết định."
          tone={lowScoreCount > 0 ? "amber" : "emerald"}
        />
      </section>

      {latestScore != null && latestScore < 0.4 ? (
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            <strong>Phiên gần nhất có độ tin cậy thấp (SC {latestScore.toFixed(3)}).</strong>{" "}
            Khuyến khích tăng số khách hàng, kéo dài khoảng dữ liệu hoặc thu thập thêm đơn hàng trước lần phân loại tiếp theo.
          </p>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-black text-neutral-900">Lịch sử phân loại toàn hệ thống</h2>
          </div>
          <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-600">
            {history.count.toLocaleString("vi-VN")} phiên
          </span>
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
                                {item.dealer_name || `Đại lý #${item.dealer_id ?? "—"}`}
                              </p>
                              <p className="text-xs text-neutral-400">ID: {item.dealer_id ?? "—"}</p>
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

function MetricCard({ icon: Icon, label, value, description, tone }) {
  const tones = {
    violet: "border-violet-100 bg-violet-50 text-violet-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
  };
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-[11px] font-black uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-3xl font-black text-neutral-950">{value}</p>
      <p className="mt-3 text-xs leading-5 text-neutral-500">{description}</p>
    </article>
  );
}
