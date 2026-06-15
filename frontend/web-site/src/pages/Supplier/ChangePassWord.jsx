import { useState, useEffect } from "react";
import { KeyRound, Eye, EyeOff, Loader2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { accountService } from "../../services/api/accountService";

function getApiErrorMessage(err, fallback) {
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data?.detail) return String(data.detail);
  if (data?.message) return String(data.message);
  if (data && typeof data === "object") {
    const key = Object.keys(data)[0];
    if (key) {
      const val = data[key];
      return Array.isArray(val) ? String(val[0]) : String(val);
    }
  }
  return fallback;
}

// ─── INLINE TOAST (tự chứa, không cần dependency ngoài) ────────────────────
function Toast({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [toast, onDone]);

  if (!toast) return null;
  const isSuccess = toast.type === "success";

  return (
    <div className="fixed top-5 right-5 z-[70] animate-[fadeIn_0.2s_ease-out]">
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold ${
        isSuccess
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-red-50 border-red-200 text-red-600"
      }`}>
        {isSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
        {toast.message}
      </div>
    </div>
  );
}

// ─── CHANGE PASSWORD MODAL ──────────────────────────────────────────────────
export default function ChangePasswordModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const toggleShow = (field) => () => {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validate = () => {
    const next = {};
    if (!form.oldPassword) next.oldPassword = "Vui lòng nhập mật khẩu hiện tại";
    if (!form.newPassword) {
      next.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (form.newPassword.length < 8) {
      next.newPassword = "Mật khẩu mới phải có ít nhất 8 ký tự";
    } else if (form.oldPassword && form.newPassword === form.oldPassword) {
      next.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại";
    }
    if (!form.confirmPassword) {
      next.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
    } else if (form.confirmPassword !== form.newPassword) {
      next.confirmPassword = "Mật khẩu xác nhận không khớp";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleClose = () => {
    if (loading) return;
    setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setShow({ old: false, new: false, confirm: false });
    setErrors({});
    onClose?.();
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await accountService.updatePassword({
        old_password: form.oldPassword,
        new_password: form.newPassword,
      });
      console.log(localStorage.getItem("token"));
      setToast({ type: "success", message: "Đổi mật khẩu thành công" });
      onSubmit?.();
      handleClose();
    } catch (err) {
      if (err?.response?.status === 400) {
        setErrors((prev) => ({ ...prev, oldPassword: "Mật khẩu hiện tại không đúng" }));
      } else {
        setToast({ type: "error", message: getApiErrorMessage(err, "Đổi mật khẩu thất bại. Vui lòng thử lại.") });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <>
      {/* Toast luôn render độc lập, không bị unmount khi modal đóng */}
      <Toast toast={toast} onDone={() => setToast(null)} />

      {isOpen && (
        <Overlay onClose={handleClose}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <KeyRound size={16} className="text-emerald-700" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-sm">Đổi mật khẩu</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Cập nhật mật khẩu đăng nhập của bạn</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <div className="px-6 py-5 flex flex-col gap-4">
              <PasswordField
                label="Mật khẩu hiện tại"
                value={form.oldPassword}
                onChange={handleChange("oldPassword")}
                onKeyDown={handleKeyDown}
                show={show.old}
                onToggleShow={toggleShow("old")}
                error={errors.oldPassword}
                placeholder="Nhập mật khẩu hiện tại"
                autoFocus
              />
              <PasswordField
                label="Mật khẩu mới"
                value={form.newPassword}
                onChange={handleChange("newPassword")}
                onKeyDown={handleKeyDown}
                show={show.new}
                onToggleShow={toggleShow("new")}
                error={errors.newPassword}
                placeholder="Ít nhất 8 ký tự"
              />
              <PasswordField
                label="Xác nhận mật khẩu mới"
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
                onKeyDown={handleKeyDown}
                show={show.confirm}
                onToggleShow={toggleShow("confirm")}
                error={errors.confirmPassword}
                placeholder="Nhập lại mật khẩu mới"
              />

              {/* Match indicator */}
              {form.newPassword && form.confirmPassword && form.newPassword === form.confirmPassword && !errors.confirmPassword && (
                <p className="flex items-center gap-1.5 text-xs text-emerald-700 -mt-1">
                  <CheckCircle2 size={13} /> Mật khẩu khớp
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-800 text-white text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Đang lưu...
                  </>
                ) : (
                  "Đổi mật khẩu"
                )}
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </>
  );
}

// ─── PASSWORD FIELD ─────────────────────────────────────────────────────────
function PasswordField({ label, value, onChange, onKeyDown, show, onToggleShow, error, placeholder, autoFocus }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-neutral-700">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full px-3 py-2.5 pr-10 text-sm border rounded-xl outline-none transition-colors ${
            error ? "border-red-400" : "border-neutral-200 focus:border-emerald-600"
          }`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── SHARED OVERLAY ─────────────────────────────────────────────────────────
function Overlay({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}