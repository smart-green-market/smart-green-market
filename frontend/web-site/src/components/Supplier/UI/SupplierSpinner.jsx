export function ButtonSpinner({ label = "Đang xử lý..." }) {
    return (
        <span>{label}</span>
    );
}

export function InlineSpinner({ className = "" }) {
    return <span className={`text-sm text-neutral-500 ${className}`}>Đang tải...</span>;
}

export function PageSpinner({ message = "Đang tải dữ liệu..." }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
            <p className="text-sm text-neutral-500 font-medium">{message}</p>
        </div>
    );
}
