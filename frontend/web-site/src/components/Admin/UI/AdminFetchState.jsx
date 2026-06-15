import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

export function AdminPageShell({ children, className = "" }) {
    return (
        <div className={`flex flex-col gap-6 px-8 pt-6 pb-10 ${className}`.trim()}>
            {children}
        </div>
    );
}

export function AdminPageLoading({ message = "Đang tải dữ liệu..." }) {
    return (
        <div className="flex h-64 w-full flex-col items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-white text-neutral-500 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
            <span className="text-sm font-medium">{message}</span>
        </div>
    );
}

export function AdminPageLoadError({ message, onRetry }) {
    return (
        <div className="flex w-full flex-col items-center justify-center gap-4 rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="h-5 w-5" />
                {message}
            </div>
            <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-950"
            >
                <RefreshCw className="h-4 w-4" />
                Thử lại
            </button>
        </div>
    );
}

export function AdminInitialLoadGate({
    isFetching,
    loadError,
    onRetry,
    loadingMessage,
    children,
}) {
    if (isFetching) {
        return (
            <AdminPageShell>
                <AdminPageLoading message={loadingMessage} />
            </AdminPageShell>
        );
    }

    if (loadError) {
        return (
            <AdminPageShell>
                <AdminPageLoadError message={loadError} onRetry={onRetry} />
            </AdminPageShell>
        );
    }

    return children;
}
