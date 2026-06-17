import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, Store } from "lucide-react";
import UserRegisterLeftPanel from "../../components/User/Auth/UserRegisterLeftPanel";
import {
    getStoredDealerSlug,
    normalizeDealerSlugInput,
    STORE_DEALER_SLUG_KEY,
} from "../../utils/buyerAuthUtils";

export default function DealerSlugEntryPage() {
    const navigate = useNavigate();
    const storedSlug = getStoredDealerSlug();
    const [slugInput, setSlugInput] = useState(storedSlug);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const goToStorefront = (slug) => {
        const normalized = normalizeDealerSlugInput(slug);
        if (!normalized) {
            setError("Vui lòng nhập địa chỉ cửa hàng đại lý hợp lệ.");
            return false;
        }

        localStorage.setItem(STORE_DEALER_SLUG_KEY, normalized);
        navigate(`/cua-hang/${encodeURIComponent(normalized)}/trang-chu`, {
            replace: true,
        });
        return true;
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        if (!goToStorefront(slugInput)) {
            setLoading(false);
            return;
        }

        setLoading(false);
    };

    const handleContinueRecent = () => {
        if (!storedSlug) return;
        setError("");
        goToStorefront(storedSlug);
    };

    return (
        <div className="flex min-h-screen flex-col lg:flex-row">
            <UserRegisterLeftPanel />

            <div className="flex flex-1 items-center justify-center bg-[#f8faf9] px-6 py-12 sm:px-10">
                <div className="w-full max-w-[480px]">
                    <div className="mb-8">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
                            <Store className="h-6 w-6 text-emerald-800" />
                        </div>
                        <h2 className="text-[28px] font-bold tracking-tight text-emerald-950">
                            Vào cửa hàng đại lý
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                            Nhập địa chỉ cửa hàng đại lý để mua sắm. Ví dụ:{" "}
                            <span className="font-medium text-emerald-900">green-market</span>{" "}
                            hoặc dán link{" "}
                            <span className="font-medium text-emerald-900">
                                /cua-hang/green-market
                            </span>
                            .
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label
                                htmlFor="dealer-slug"
                                className="mb-2 block text-sm font-semibold text-neutral-700"
                            >
                                Địa chỉ cửa hàng đại lý
                            </label>
                            <input
                                id="dealer-slug"
                                type="text"
                                value={slugInput}
                                onChange={(event) => {
                                    setSlugInput(event.target.value);
                                    if (error) setError("");
                                }}
                                placeholder="Nhập slug hoặc dán link cửa hàng"
                                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3.5 text-base text-zinc-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"
                                autoComplete="off"
                            />
                            {error ? (
                                <p className="mt-2 text-sm text-red-600">{error}</p>
                            ) : null}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#006c49] py-3.5 text-base font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang chuyển hướng...
                                </>
                            ) : (
                                <>
                                    Vào cửa hàng
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {storedSlug ? (
                        <button
                            type="button"
                            onClick={handleContinueRecent}
                            className="mt-4 w-full rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
                        >
                            Tiếp tục cửa hàng gần đây: {storedSlug}
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
