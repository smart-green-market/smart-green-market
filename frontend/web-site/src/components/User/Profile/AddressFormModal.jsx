import { useEffect, useState } from "react";
import { Loader2, MapPin, X } from "lucide-react";
import { buildAddressForm, formatAddressDate } from "../../../utils/buyerAddressUtils";
import { appToast } from "../../common/toast";

const TITLES = {
    create: "Thêm địa chỉ mới",
    edit: "Cập nhật địa chỉ",
    view: "Chi tiết địa chỉ",
};

export default function AddressFormModal({
    open,
    mode = "create",
    address = null,
    saving = false,
    onClose,
    onSubmit,
}) {
    const [form, setForm] = useState(() => buildAddressForm(address));
    const isView = mode === "view";

    useEffect(() => {
        if (!open) return;
        setForm(buildAddressForm(address));
    }, [open, address, mode]);

    if (!open) return null;

    const setField = (key) => (event) => {
        const value =
            key === "is_default" ? event.target.checked : event.target.value;
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isView) return;

        const result = await onSubmit?.(form);
        if (!result?.success) {
            appToast.warning(result?.message || "Không thể lưu địa chỉ");
            return;
        }

        appToast.success(
            mode === "create" ? "Thêm địa chỉ thành công" : "Cập nhật địa chỉ thành công",
        );
        onClose?.();
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
            <form
                onSubmit={handleSubmit}
                className="max-h-[90vh] w-full max-w-[672px] overflow-hidden rounded-xl bg-white shadow-2xl"
            >
                <div className="flex items-center justify-between border-b border-stone-300 bg-zinc-100 px-8 py-6">
                    <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-teal-800" />
                        <h3 className="text-2xl font-semibold text-emerald-950">
                            {TITLES[mode] || TITLES.create}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-full p-2 hover:bg-zinc-200"
                    >
                        <X className="h-4 w-4 text-zinc-900" />
                    </button>
                </div>

                <div className="max-h-[62vh] space-y-6 overflow-y-auto p-8">
                    {isView ? (
                        <>
                            <ViewField
                                label="Tên người nhận"
                                value={address?.receiver_name}
                            />
                            <ViewField
                                label="Số điện thoại"
                                value={address?.receiver_phone}
                            />
                            <ViewField label="Địa chỉ" value={address?.address} />
                            <ViewField
                                label="Địa chỉ mặc định"
                                value={address?.is_default ? "Có" : "Không"}
                            />
                            <ViewField
                                label="Ngày tạo"
                                value={formatAddressDate(address?.created_at)}
                            />
                            <ViewField
                                label="Cập nhật lần cuối"
                                value={formatAddressDate(address?.updated_at)}
                            />
                        </>
                    ) : (
                        <>
                            <Field label="Tên người nhận" required>
                                <input
                                    type="text"
                                    value={form.receiver_name}
                                    onChange={setField("receiver_name")}
                                    placeholder="Nhập họ và tên"
                                    className={inputClass}
                                    required
                                />
                            </Field>

                            <Field label="Số điện thoại" required>
                                <input
                                    type="tel"
                                    value={form.receiver_phone}
                                    onChange={setField("receiver_phone")}
                                    placeholder="Nhập số điện thoại"
                                    className={inputClass}
                                    required
                                />
                            </Field>

                            <Field label="Địa chỉ nhận hàng" required>
                                <textarea
                                    rows={4}
                                    value={form.address}
                                    onChange={setField("address")}
                                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                                    className={`${inputClass} resize-none`}
                                    required
                                />
                            </Field>

                            <label className="inline-flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={form.is_default}
                                    onChange={setField("is_default")}
                                    className="h-5 w-5 rounded border border-stone-300 accent-teal-800"
                                />
                                <span className="text-base text-zinc-900">
                                    Đặt làm địa chỉ mặc định
                                </span>
                            </label>
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-4 border-t border-stone-300 bg-zinc-100 p-8">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="cursor-pointer rounded-lg px-8 py-3 text-base text-neutral-700 outline outline-1 outline-neutral-500 disabled:opacity-60"
                    >
                        {isView ? "Đóng" : "Hủy"}
                    </button>
                    {!isView ? (
                        <button
                            type="submit"
                            disabled={saving}
                            className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-teal-800 px-8 py-3 text-base text-white hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                "Lưu địa chỉ"
                            )}
                        </button>
                    ) : null}
                </div>
            </form>
        </div>
    );
}

const inputClass =
    "w-full rounded-lg bg-gray-50 px-4 py-3.5 text-base text-zinc-900 outline outline-1 outline-stone-300 focus:outline-teal-800";

function Field({ label, children, required = false }) {
    return (
        <div className="space-y-2">
            <p className="text-sm font-semibold tracking-wide text-neutral-700">
                {label}
                {required ? <span className="text-red-500"> *</span> : null}
            </p>
            {children}
        </div>
    );
}

function ViewField({ label, value }) {
    return (
        <div className="space-y-2">
            <p className="text-sm font-semibold tracking-wide text-neutral-700">{label}</p>
            <div className="rounded-lg bg-gray-50 px-4 py-3.5 text-base text-zinc-900 outline outline-1 outline-stone-300">
                {value || "—"}
            </div>
        </div>
    );
}
