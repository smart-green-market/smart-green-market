import { Eye, Pencil, Trash2 } from "lucide-react";

export default function AddressRadioCard({
    address,
    checked,
    disabled = false,
    onSetDefault,
    onView,
    onEdit,
    onDelete,
}) {
    return (
        <label
            className={`flex cursor-pointer items-start justify-between rounded-xl px-6 pb-6 pt-6 outline outline-2 transition-colors ${
                checked
                    ? "bg-green-50 outline-teal-800"
                    : "bg-zinc-100 outline-transparent hover:bg-zinc-50"
            } ${disabled ? "opacity-70" : ""}`}
        >
            <div className="flex min-w-0 items-start gap-4">
                <input
                    type="radio"
                    name="shipping-address-default"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => onSetDefault?.(address.id)}
                    className="mt-1 h-5 w-5 shrink-0 accent-teal-800"
                    title="Đặt làm địa chỉ mặc định"
                />
                <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="text-base font-medium text-zinc-900">
                            {address.receiver_name} | {address.receiver_phone}
                        </p>
                        {address.is_default ? (
                            <span className="rounded-full bg-teal-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                                Mặc định
                            </span>
                        ) : null}
                    </div>
                    <p className="text-sm leading-relaxed text-neutral-700">
                        {address.address}
                    </p>
                </div>
            </div>

            <div className="ml-3 flex shrink-0 items-center gap-1">
                <IconButton
                    label="Xem chi tiết"
                    onClick={(event) => {
                        event.preventDefault();
                        onView?.(address);
                    }}
                >
                    <Eye className="h-4 w-4" />
                </IconButton>
                <IconButton
                    label="Chỉnh sửa"
                    onClick={(event) => {
                        event.preventDefault();
                        onEdit?.(address);
                    }}
                >
                    <Pencil className="h-4 w-4" />
                </IconButton>
                <IconButton
                    label="Xóa"
                    onClick={(event) => {
                        event.preventDefault();
                        onDelete?.(address);
                    }}
                    className="hover:text-red-600"
                >
                    <Trash2 className="h-4 w-4" />
                </IconButton>
            </div>
        </label>
    );
}

function IconButton({ children, label, onClick, className = "" }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            className={`cursor-pointer rounded-md p-2 text-neutral-500 hover:bg-white hover:text-teal-800 ${className}`}
        >
            {children}
        </button>
    );
}
