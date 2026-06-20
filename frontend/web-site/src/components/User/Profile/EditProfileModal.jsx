import { useEffect, useRef, useState } from "react";
import {
    Camera,
    ImagePlus,
    Loader2,
    Lock,
    Mail,
    Phone,
    User,
    UserPen,
    X,
} from "lucide-react";
import { buildBuyerProfileForm } from "../../../utils/buyerProfileUtils";
import { appToast } from "../../common/toast";

export default function EditProfileModal({
    open,
    profile,
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

    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    if (!open || !profile) return null;

    const currentAvatar =
        avatarPreview ||
        profile.user?.avatar_url ||
        "https://placehold.co/160x160/e8f5ef/006c49?text=Avatar";

    const email = profile.user?.email || "";

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
            appToast.warning("Vui lòng chọn file ảnh hợp lệ (JPG, PNG, WEBP).");
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

    const handleRemoveAvatarSelection = () => {
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
        }
        setAvatarPreview(null);
        setAvatarFile(null);
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
                className="flex max-h-[92vh] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
                <div className="relative overflow-hidden border-b border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6 pb-5 pt-6">
                    <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-100/60 blur-2xl" />
                    <div className="absolute -left-6 top-10 h-20 w-20 rounded-full bg-teal-100/50 blur-2xl" />

                    <div className="relative flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-sm">
                                <UserPen className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-emerald-950">
                                    Chỉnh sửa hồ sơ
                                </h3>
                                <p className="mt-0.5 text-sm text-neutral-500">
                                    Cập nhật ảnh đại diện và thông tin liên hệ
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="hover:scale-105 cursor-pointer rounded-full p-2 text-neutral-500 transition hover:bg-white/80 hover:text-zinc-900 disabled:opacity-50"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                    <section className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/80 to-white p-5">
                        <div className="flex flex-col items-center">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="cursor-pointer relative group"
                                aria-label="Chọn ảnh đại diện"
                            >
                                <div className="rounded-full bg-gradient-to-br from-emerald-200 to-teal-300 p-1 shadow-md">
                                    <img
                                        src={currentAvatar}
                                        alt={form.full_name || "Avatar"}
                                        className="h-28 w-28 rounded-full border-4 border-white object-cover"
                                    />
                                </div>

                                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-emerald-950/0 transition group-hover:bg-emerald-950/45">
                                    <span className="flex h-10 w-10 scale-90 items-center justify-center rounded-full bg-white/95 text-emerald-800 opacity-0 shadow transition group-hover:scale-100 group-hover:opacity-100">
                                        <Camera className="h-4 w-4" />
                                    </span>
                                </div>
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/*"
                                className="hidden"
                                onChange={handlePickAvatar}
                            />

                            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                                >
                                    <ImagePlus className="h-4 w-4" />
                                    {avatarFile ? "Đổi ảnh khác" : "Chọn ảnh đại diện"}
                                </button>

                                {avatarFile ? (
                                    <button
                                        type="button"
                                        onClick={handleRemoveAvatarSelection}
                                        className="hover:scale-105 cursor-pointer rounded-full px-3 py-2 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700"
                                    >
                                        Hủy chọn
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </section>

                    <div className="space-y-4">
                        <Field label="Họ và tên" icon={User} required>
                            <input
                                type="text"
                                value={form.full_name}
                                onChange={setField("full_name")}
                                className={inputClass}
                                placeholder="Nhập họ và tên"
                                required
                            />
                        </Field>

                        <Field
                            label="Email"
                            icon={Mail}
                            hint="Email đăng nhập không thể thay đổi"
                        >
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    disabled
                                    className={`${inputClass} cursor-not-allowed bg-neutral-50 pr-10 text-neutral-500`}
                                />
                                <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                            </div>
                        </Field>

                        <Field label="Số điện thoại" icon={Phone} required>
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={setField("phone")}
                                className={inputClass}
                                placeholder="0901234567"
                                required
                            />
                        </Field>
                    </div>
                </div>

                <div className="flex gap-3 border-t border-stone-200 bg-neutral-50 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="hover:scale-105 cursor-pointer flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50"
                    >
                        Hủy
                    </button>

                    <button
                        type="submit"
                        disabled={saving}
                        className="hover:scale-105 cursor-pointer inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-70"
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
    "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-neutral-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-neutral-50";

function Field({ label, icon: Icon, children, required = false, hint }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                    {Icon ? <Icon className="h-4 w-4 text-emerald-700" /> : null}
                    {label}
                    {required ? <span className="text-red-500">*</span> : null}
                </label>
                {hint ? (
                    <span className="text-[11px] text-neutral-400">{hint}</span>
                ) : null}
            </div>
            {children}
        </div>
    );
}
