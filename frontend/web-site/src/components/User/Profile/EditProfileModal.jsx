import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { buildBuyerProfileForm } from "../../../utils/buyerProfileUtils";
import { appToast } from "../../common/toast";

export default function EditProfileModal({
    open,
    profile,
    categories = [],
    onClose,
    onSave,
    saving = false,
}) {
    const fileInputRef = useRef(null);
    const [form, setForm] = useState(() => buildBuyerProfileForm(profile));
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);

    useEffect(() => {
        if (!open) return;
        setForm(buildBuyerProfileForm(profile));
        setAvatarPreview(null);
        setAvatarFile(null);
    }, [open, profile]);

    if (!open || !profile) return null;

    const currentAvatar =
        avatarPreview ||
        profile.user?.avatar_url ||
        "https://placehold.co/128x128?text=Avatar";

    const setField = (key) => (event) => {
        setForm((prev) => ({
            ...prev,
            [key]: event.target.value,
        }));
    };

    const handlePickAvatar = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            appToast.warning("Vui lòng chọn file ảnh hợp lệ.");
            event.target.value = "";
            return;
        }

        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
        }

        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
        event.target.value = "";
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const result = await onSave?.(form, avatarFile);
        if (!result?.success) {
            appToast.warning(result?.message || "Cập nhật thông tin thất bại");
            return;
        }

        appToast.success(
            avatarFile
                ? "Cập nhật thông tin và ảnh đại diện thành công"
                : "Cập nhật thông tin thành công",
        );
        onClose?.();
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
            <form
                onSubmit={handleSubmit}
                className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
                <div className="flex items-center justify-between border-b border-zinc-100 p-6">
                    <h3 className="text-2xl font-semibold text-emerald-950">
                        Chỉnh sửa thông tin
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-full p-2 hover:bg-zinc-100"
                    >
                        <X className="h-4 w-4 text-zinc-900" />
                    </button>
                </div>

                <div className="space-y-6 p-8">
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                            <img
                                src={currentAvatar}
                                alt={form.full_name || "Avatar"}
                                className="h-24 w-24 rounded-full border-2 border-emerald-200 object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="cursor-pointer absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-white shadow-md hover:bg-emerald-900"
                                aria-label="Chọn ảnh đại diện"
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePickAvatar}
                        />
                        <p className="text-xs font-medium text-neutral-500">
                            Chọn ảnh mới để cập nhật avatar
                        </p>
                    </div>

                    <Field label="Họ tên" required>
                        <input
                            type="text"
                            value={form.full_name}
                            onChange={setField("full_name")}
                            className={inputClass}
                            placeholder="Nguyễn Văn A"
                            required
                        />
                    </Field>

                    <Field label="Email">
                        <input
                            type="email"
                            value={profile.user?.email || ""}
                            disabled
                            className={`${inputClass} bg-zinc-100 text-neutral-500`}
                        />
                    </Field>

                    <Field label="Số điện thoại" required>
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={setField("phone")}
                            className={inputClass}
                            placeholder="0901234567"
                            required
                        />
                    </Field>

                    <Field label="Danh mục yêu thích">
                        <select
                            value={form.favorite_category}
                            onChange={setField("favorite_category")}
                            className={inputClass}
                        >
                            <option value="">Không chọn</option>
                            {categories.map((category) => (
                                <option key={category.id} value={String(category.id)}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Ghi chú">
                        <textarea
                            value={form.note}
                            onChange={setField("note")}
                            rows={3}
                            className={`${inputClass} resize-none`}
                            placeholder="Ghi chú cá nhân (nếu có)"
                        />
                    </Field>
                </div>

                <div className="flex justify-end gap-3 bg-zinc-100 p-6">
                    <button
                        type="submit"
                        disabled={saving}
                        className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-teal-800 px-6 py-2 text-base text-white hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            "Lưu thay đổi"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

const inputClass =
    "w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-base text-zinc-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

function Field({ label, children, required = false }) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-medium text-neutral-500">
                {label}
                {required ? <span className="text-red-500"> *</span> : null}
            </p>
            {children}
        </div>
    );
}
