import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { appToast } from "../../common/toast";

function PasswordField({ id, label, value, onChange, placeholder }) {
    const [visible, setVisible] = useState(false);

    return (
        <div>
            <label htmlFor={id} className="text-sm font-medium text-neutral-600">
                {label}
            </label>
            <div className="relative mt-2">
                <input
                    id={id}
                    type={visible ? "text" : "password"}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete={id === "current-password" ? "current-password" : "new-password"}
                    className="h-11 w-full rounded-lg border border-stone-200 bg-white px-4 pr-11 text-sm text-zinc-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                    required
                />
                <button
                    type="button"
                    onClick={() => setVisible((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                    {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
        </div>
    );
}

export default function ChangePasswordForm() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (newPassword.length < 8) {
            setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp.");
            return;
        }

        setLoading(true);

        // Tạm mock — sẽ thay bằng API đổi mật khẩu khi backend sẵn sàng.
        await new Promise((resolve) => setTimeout(resolve, 700));

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setLoading(false);
        appToast.success("Đổi mật khẩu thành công.");
    };

    return (
        <section className="rounded-xl bg-white p-8 shadow-sm outline outline-1 outline-zinc-100">
            <div className="mb-8">
                <h2 className="text-2xl font-semibold text-emerald-950">Đổi mật khẩu</h2>
                <p className="mt-2 text-sm text-neutral-600">
                    Cập nhật mật khẩu đăng nhập để bảo vệ tài khoản của bạn.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
                <PasswordField
                    id="current-password"
                    label="Mật khẩu hiện tại"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                />
                <PasswordField
                    id="new-password"
                    label="Mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                />
                <PasswordField
                    id="confirm-password"
                    label="Xác nhận mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                />

                {error ? (
                    <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                <div className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-neutral-600">
                    Mật khẩu nên có ít nhất 8 ký tự, kết hợp chữ và số để an toàn hơn.
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-teal-800 px-6 text-sm font-semibold text-white transition-colors hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang lưu...
                        </>
                    ) : (
                        "Cập nhật mật khẩu"
                    )}
                </button>
            </form>
        </section>
    );
}
