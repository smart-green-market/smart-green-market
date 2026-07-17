import { useEffect, useMemo } from "react";
import {
  Check,
  ChevronRight,
  Crown,
  Loader2,
  LockKeyhole,
  ShoppingBag,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";

const numberFormat = new Intl.NumberFormat("vi-VN");

function parseBenefits(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(/\r?\n|;|•/)
    .map((item) => item.replace(/^[-–]\s*/, "").trim())
    .filter(Boolean);
}

function getTierTone(index) {
  const tones = [
    "from-stone-100 to-white text-stone-700",
    "from-slate-200 to-white text-slate-700",
    "from-amber-100 to-white text-amber-800",
    "from-emerald-100 to-white text-emerald-800",
  ];
  return tones[Math.min(index, tones.length - 1)];
}

export default function LoyaltyTierModal({
  open,
  onClose,
  score,
  tiers,
  loading,
  error,
  onRetry,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const progress = useMemo(() => {
    const points = Number(score?.loyalty_points ?? 0);
    const currentMin = Number(score?.current_tier?.min_points ?? 0);
    const nextMin = Number(score?.next_tier?.min_points ?? currentMin);
    if (!score?.next_tier || nextMin <= currentMin) return 100;
    return Math.min(100, Math.max(0, ((points - currentMin) / (nextMin - currentMin)) * 100));
  }, [score]);

  if (!open) return null;

  const currentTierId = score?.current_tier?.id;
  const nextTierId = score?.next_tier?.id;
  const points = Number(score?.loyalty_points ?? 0);
  const remaining = Number(score?.remaining_points ?? score?.next_tier?.remaining_points ?? 0);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/60 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loyalty-tier-title"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-[28px] bg-[#f7faf8] shadow-2xl">
        <header className="relative overflow-hidden rounded-t-[28px] bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-600 px-6 py-7 text-white sm:px-9">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[34px] border-white/10" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="absolute right-5 top-5 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative max-w-3xl">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> Chương trình khách hàng thân thiết
            </span>
            <h2 id="loyalty-tier-title" className="text-2xl font-bold sm:text-3xl">
              Mua sắm nhiều hơn, nhận nhiều đặc quyền hơn
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/90">
              Mỗi đơn hàng giúp bạn tích điểm và mở khóa cấp bậc mới. Điểm càng cao,
              quyền lợi mua sắm càng hấp dẫn.
            </p>
          </div>

          <div className="relative mt-6 grid gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold">
                  {score?.current_tier?.name || "Thành viên mới"}
                </span>
                <span className="font-bold">{numberFormat.format(points)} điểm</span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-black/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-lime-300 to-yellow-300 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-emerald-50/80">
                {score?.next_tier
                  ? `Còn ${numberFormat.format(remaining)} điểm để lên ${score.next_tier.name}`
                  : "Bạn đang ở cấp bậc cao nhất. Hãy tiếp tục tận hưởng đặc quyền!"}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-emerald-900">
              <Trophy className="h-5 w-5 text-amber-500" />
              {score?.next_tier ? "Tiếp tục chinh phục" : "Hạng cao nhất"}
            </div>
          </div>
        </header>

        <div className="p-5 sm:p-8">
          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
              <p className="text-sm text-red-700">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 cursor-pointer rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Thử tải lại
              </button>
            </div>
          ) : tiers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
              Cửa hàng chưa công bố hạng thành viên.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {tiers.map((tier, index) => {
                const benefits = parseBenefits(tier.benefits);
                const isCurrent = tier.id === currentTierId;
                const isNext = tier.id === nextTierId;
                const unlocked = points >= Number(tier.min_points ?? 0);

                return (
                  <article
                    key={tier.id ?? tier.code}
                    className={`relative flex min-h-[390px] flex-col overflow-hidden rounded-2xl border bg-white p-5 transition hover:-translate-y-1 hover:shadow-xl ${
                      isCurrent
                        ? "border-emerald-600 ring-2 ring-emerald-600/15"
                        : isNext
                          ? "border-amber-300"
                          : "border-neutral-200"
                    }`}
                  >
                    {(isCurrent || isNext) && (
                      <span
                        className={`absolute right-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                          isCurrent
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isCurrent ? "Hạng hiện tại" : "Mục tiêu tiếp theo"}
                      </span>
                    )}

                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${getTierTone(index)}`}>
                      {unlocked ? <Crown className="h-6 w-6" /> : <LockKeyhole className="h-5 w-5" />}
                    </div>
                    <h3 className="mt-5 pr-20 text-xl font-bold text-neutral-950">{tier.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-emerald-700">
                      Từ {numberFormat.format(Number(tier.min_points ?? 0))} điểm
                    </p>
                    <p className="mt-3 min-h-10 text-sm leading-5 text-neutral-500">
                      {tier.description || "Tích điểm từ các đơn hàng tại cửa hàng."}
                    </p>

                    <div className="my-5 h-px bg-neutral-100" />
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Quyền lợi
                    </p>
                    <ul className="mt-3 flex-1 space-y-3">
                      {(benefits.length ? benefits : ["Tích điểm cho mỗi đơn hàng"]).map((benefit) => (
                        <li key={benefit} className="flex gap-2 text-sm leading-5 text-neutral-700">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    <div
                      className={`mt-5 flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold ${
                        isCurrent
                          ? "bg-emerald-800 text-white"
                          : unlocked
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      <span>
                        {isCurrent
                          ? "Bạn đang ở hạng này"
                          : unlocked
                            ? "Đã mở khóa"
                            : `Cần ${numberFormat.format(Math.max(0, Number(tier.min_points ?? 0) - points))} điểm`}
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 sm:flex-row sm:items-center">
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
                <ShoppingBag className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-emerald-950">Cách lên cấp rất đơn giản</p>
                <p className="mt-1 text-sm text-emerald-800/80">
                  Hoàn tất đơn hàng để nhận điểm. Hệ thống tự động nâng hạng khi bạn đủ mốc.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer whitespace-nowrap rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-900"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
