import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supplierService } from "../../services/api/suppilerService";
import { accountService } from "../../services/api/accountService";
import { bankService } from "../../services/api/bankService";
import SupplierPageHeader, { SUPPLIER_PAGE_CLASS } from "../../components/Supplier/UI/SupplierPageHeader";
import { extractSupplierApiMessage } from "../../utils/supplierValidation";
import ChangePasswordModal from "./ChangePassWord"

// ---- Helpers ----
const verificationLabel = {
  approved: "Đã xác minh",
  pending: "Chờ xét duyệt",
  rejected: "Từ chối",
};
const statusLabel = { active: "Đang hoạt động", inactive: "Ngừng hoạt động" };

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}
function formatPhone(phone) {
  if (!phone) return "—";
  return phone.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");
}

function getChangedFields(initial, current) {
  const changed = {};
  Object.keys(initial).forEach((key) => {
    if (current[key] !== initial[key]) {
      changed[key] = current[key];
    }
  });
  return changed;
}

const SUPPLIER_BANK_KEYS = ["bank_name", "bank_bin", "account_number", "account_name"];

function normalizeSupplierForm(data = {}) {
  return {
    company_name: data.company_name || "",
    tax_code: data.tax_code || "",
    phone: data.phone || "",
    address: data.address || "",
    description: data.description || "",
    bank_name: data.bank_name || "",
    bank_bin: String(data.bank_bin || ""),
    account_number: data.account_number || "",
    account_name: data.account_name || "",
  };
}

function buildSupplierUpdatePayload(supplier, form) {
  const initial = normalizeSupplierForm(supplier);
  const current = normalizeSupplierForm(form);
  const changed = getChangedFields(initial, current);

  const bankChanged = SUPPLIER_BANK_KEYS.some((key) => key in changed);
  if (bankChanged) {
    SUPPLIER_BANK_KEYS.forEach((key) => {
      changed[key] = current[key];
    });
  }

  return changed;
}

function extractSupplierErrorMessage(error, fallback = "Cập nhật thất bại. Vui lòng thử lại!") {
  return extractSupplierApiMessage(error, fallback);
}

function toNumberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getLoggedInUser() {
  try {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

function normalizeSupplierDetail(raw, fallbackUser = null) {
  if (!raw) return null;

  const apiAccount = raw.account && typeof raw.account === "object" ? raw.account : null;
  const userAccount = fallbackUser || {};

  const account = {
    id: apiAccount?.id ?? userAccount.id ?? null,
    username: apiAccount?.username ?? userAccount.username ?? "",
    email: apiAccount?.email ?? userAccount.email ?? "",
    full_name:
      apiAccount?.full_name ??
      userAccount.full_name ??
      userAccount.username ??
      "",
    phone: apiAccount?.phone ?? userAccount.phone ?? "",
    avatar_url:
      apiAccount?.avatar_url ??
      apiAccount?.avatar ??
      userAccount.avatar_url ??
      userAccount.avatar ??
      null,
    role: apiAccount?.role ?? userAccount.role ?? "supplier",
    status: apiAccount?.status ?? userAccount.status ?? "active",
    created_at: apiAccount?.created_at ?? userAccount.created_at ?? null,
    updated_at: apiAccount?.updated_at ?? userAccount.updated_at ?? null,
  };

  return {
    ...raw,
    account,
    company_name: raw.company_name ?? "",
    tax_code: raw.tax_code ?? "",
    phone: raw.phone ?? "",
    address: raw.address ?? "",
    description: raw.description ?? "",
    bank_name: raw.bank_name ?? "",
    bank_bin: raw.bank_bin != null ? String(raw.bank_bin) : "",
    account_number: raw.account_number ?? "",
    account_name: raw.account_name ?? "",
    verification_status: raw.verification_status ?? "pending",
    verified_by_username: raw.verified_by_username ?? "",
    rejection_reason: raw.rejection_reason ?? "",
  };
}

async function fetchCurrentSupplierProfile() {
  const user = getLoggedInUser();
  const userId = toNumberOrNull(user?.id);

  if (!userId) {
    throw new Error("Không tìm thấy thông tin tài khoản đăng nhập.");
  }

  const directSupplierId =
    toNumberOrNull(user?.supplier_id) ??
    toNumberOrNull(user?.supplier?.id) ??
    toNumberOrNull(user?.supplier);

  if (directSupplierId) {
    const supplierDetail = await supplierService.getById(directSupplierId);
    return normalizeSupplierDetail(supplierDetail, user);
  }

  const suppliers = await supplierService.getAll();
  const list = Array.isArray(suppliers) ? suppliers : [];

  const supplierSummary = list.find((item) => {
    const accountId =
      toNumberOrNull(item?.account) ??
      toNumberOrNull(item?.account_id) ??
      toNumberOrNull(item?.account?.id);

    if (accountId && accountId === userId) return true;

    const usernameMatches =
      item?.account?.username &&
      user?.username &&
      item.account.username === user.username;

    const emailMatches =
      item?.account?.email &&
      user?.email &&
      item.account.email === user.email;

    return usernameMatches || emailMatches;
  });

  if (supplierSummary?.id) {
    const supplierDetail = await supplierService.getById(supplierSummary.id);
    return normalizeSupplierDetail(supplierDetail, user);
  }

  if (list.length === 1 && list[0]?.id) {
    const supplierDetail = await supplierService.getById(list[0].id);
    return normalizeSupplierDetail(supplierDetail, user);
  }

  throw new Error("Không tìm thấy hồ sơ nhà cung cấp của tài khoản này.");
}

// ---- Sub-components ----
function Avatar({ name, url }) {
  const initials = name
    ? name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase()
    : "?";
  if (url)
    return <img src={url} alt={name} className="w-32 h-32 rounded-xl object-cover" />;
  return (
    <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-[#2D6A4F] to-[#52B788] flex items-center justify-center text-white font-bold text-xl select-none">
      {initials}
    </div>
  );
}

// ---- Modal xác nhận đổi ảnh đại diện ----
function AvatarConfirmModal({ previewUrl, onConfirm, onCancel, isSaving }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={!isSaving ? onCancel : undefined} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 z-10">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Xác nhận cập nhật ảnh</h3>
        <p className="text-xs text-gray-400 mb-5">Ảnh đại diện mới của bạn sẽ được lưu sau khi xác nhận.</p>

        {/* Preview */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-[#D8F3DC] shadow-md"
            />
            <span className="absolute -bottom-2 -right-2 bg-[#2D6A4F] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow">
              Mới
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isSaving}
            className={`flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              isSaving ? "bg-[#52B788] cursor-not-allowed" : "bg-[#2D6A4F] hover:bg-[#1B4332]"
            }`}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang lưu...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Xác nhận
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Badge({ label, variant = "default" }) {
  const styles = {
    green: "bg-[#D8F3DC] text-[#1B4332] border border-[#B7E4C7]",
    yellow: "bg-yellow-50 text-yellow-800 border border-yellow-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    gray: "bg-gray-100 text-gray-600 border border-gray-200",
    default: "bg-gray-100 text-gray-600 border border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[variant]}`}>
      {label}
    </span>
  );
}

function InfoField({ label, value, wide = false }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || "—"}</p>
    </div>
  );
}

// ---- Section: Thông tin cá nhân ----
function PersonalSection({ supplier, onEdit, onPickAvatar, onOpenChangePassword }) {
  const { account } = supplier;
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="font-semibold text-gray-900">Thông tin cá nhân</h2>
          <p className="text-xs text-gray-400 mt-0.5">Thông tin tài khoản đăng nhập</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenChangePassword}
            className="flex items-center gap-2 px-4 py-2 border border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC] text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Đổi mật khẩu
          </button>
          <label className="flex items-center gap-2 px-4 py-2 border border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC] text-sm font-medium rounded-lg transition-colors cursor-pointer">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Cập nhật ảnh
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={onPickAvatar}
            />
          </label>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Chỉnh sửa
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Avatar row */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="relative">
            <Avatar name={account.full_name} url={account.avatar_url} />
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${account.status === "active" ? "bg-[#52B788]" : "bg-gray-300"}`}
            />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{account.full_name}</p>
            <p className="text-sm text-gray-500 mb-2">@{account.username}</p>
            <div className="flex gap-2 flex-wrap">
              <Badge label="Nhà cung cấp" variant="blue" />
              <Badge
                label={statusLabel[account.status] || account.status}
                variant={account.status === "active" ? "green" : "gray"}
              />
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          <InfoField label="Họ và tên" value={account.full_name} />
          <InfoField label="Email" value={account.email} />
          <InfoField label="Số điện thoại" value={formatPhone(account.phone)} />
          <InfoField label="Tên đăng nhập" value={account.username} />
          <InfoField label="Ngày tạo tài khoản" value={formatDate(account.created_at)} />
          <InfoField label="Cập nhật lần cuối" value={formatDate(account.updated_at)} />
        </div>
      </div>
    </div>
  );
}

// ---- Section: Thông tin doanh nghiệp ----
function CompanySection({ supplier, onEdit }) {
  const vs = supplier.verification_status;
  const vsBanner = {
    approved: { bg: "bg-[#D8F3DC] border-[#B7E4C7]", text: "text-[#1B4332]", sub: "text-[#2D6A4F]", icon: "✅" },
    pending:  { bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-800", sub: "text-yellow-600", icon: "⏳" },
    rejected: { bg: "bg-red-50 border-red-200", text: "text-red-800", sub: "text-red-600", icon: "❌" },
  }[vs] || { bg: "bg-gray-50 border-gray-200", text: "text-gray-700", sub: "text-gray-500", icon: "❓" };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="font-semibold text-gray-900">Thông tin doanh nghiệp</h2>
          <p className="text-xs text-gray-400 mt-0.5">Thông tin pháp lý và liên hệ công ty</p>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Chỉnh sửa
        </button>
      </div>

      <div className="p-6">
        {/* Fields */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          <InfoField label="Mã nhà cung cấp" value={`#${supplier.id}`} />
          <InfoField label="Tên công ty" value={supplier.company_name} />
          <InfoField label="Mã số thuế" value={supplier.tax_code} />
          <InfoField label="Số điện thoại doanh nghiệp" value={formatPhone(supplier.phone)} />
          <InfoField label="Địa chỉ" value={supplier.address} wide />
          <InfoField label="Mô tả" value={supplier.description} wide />

          <div className="col-span-2 border-t border-dashed border-gray-200 pt-1">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Thông tin ngân hàng</p>
          </div>

          <InfoField label="Tên ngân hàng" value={supplier.bank_name} />
          <InfoField label="Mã BIN ngân hàng" value={supplier.bank_bin} />
          <InfoField label="Số tài khoản" value={supplier.account_number} />
          <InfoField label="Tên chủ tài khoản" value={supplier.account_name} />

          <div className="col-span-2 border-t border-dashed border-gray-200 pt-1">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Thông tin xác minh</p>
          </div>

          <InfoField
            label="Trạng thái xác minh"
            value={verificationLabel[supplier.verification_status] || supplier.verification_status}
          />
          <InfoField label="Thời điểm xác minh" value={formatDate(supplier.verified_at)} />
          {supplier.rejection_reason ? (
            <InfoField label="Lý do từ chối" value={supplier.rejection_reason} />
          ) : (
            <InfoField label="Lý do từ chối" value="Không có" />
          )}

          <div className="col-span-2 border-t border-dashed border-gray-200 pt-1">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Thời gian</p>
          </div>

          <InfoField label="Ngày đăng ký" value={formatDate(supplier.created_at)} />
          <InfoField label="Cập nhật lần cuối" value={formatDate(supplier.updated_at)} />
        </div>
      </div>
    </div>
  );
}

// ---- Modal chỉnh sửa thông tin cá nhân ----
function EditPersonalModal({ account, onClose, onSave, isSaving }) {
  const initial = {
    full_name: account.full_name,
    email: account.email,
    phone: account.phone,
  };

  const [form, setForm] = useState(initial);

  const isDirty = Object.keys(initial).some((key) => form[key] !== initial[key]);

  const fields = [
    { label: "Họ và tên", key: "full_name", type: "text" },
    { label: "Email", key: "email", type: "email" },
    { label: "Số điện thoại", key: "phone", type: "tel" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={!isSaving ? onClose : undefined} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 z-10">
        <h3 className="text-base font-semibold text-gray-900 mb-5">Chỉnh sửa thông tin cá nhân</h3>
        <div className="flex flex-col gap-4">
          {fields.map(({ label, key, type }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                disabled={isSaving}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#D8F3DC] transition-all ${
                  form[key] !== initial[key]
                    ? "border-[#2D6A4F] focus:border-[#2D6A4F]"
                    : "border-gray-200 focus:border-[#52B788]"
                }`}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            Hủy
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={isSaving || !isDirty}
            className={`flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center ${
              isSaving
                ? "bg-[#52B788] cursor-not-allowed"
                : isDirty
                ? "bg-[#2D6A4F] hover:bg-[#1B4332] cursor-pointer"
                : "bg-[#B7E4C7] cursor-not-allowed opacity-70"
            }`}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang lưu...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Modal chỉnh sửa thông tin doanh nghiệp ----
function EditCompanyModal({ supplier, onClose, onSave, isSaving }) {
  const initial = normalizeSupplierForm(supplier);

  const [form, setForm] = useState(initial);
  const [banks, setBanks] = useState([]);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await bankService.getAll();
        setBanks(response);
      } catch (error) {
        console.error("Lỗi khi tải danh sách ngân hàng:", error);
      }
    };
    fetchBanks();
  }, []);

  const isDirty = Object.keys(initial).some((key) => form[key] !== initial[key]);

  const fields = [
    { label: "Tên công ty", key: "company_name", type: "text" },
    { label: "Mã số thuế", key: "tax_code", type: "text" },
    { label: "Số điện thoại doanh nghiệp", key: "phone", type: "tel" },
    { label: "Địa chỉ", key: "address", type: "text" },
  ];

  const bankFields = [
    { label: "Số tài khoản", key: "account_number", type: "text" },
    { label: "Tên chủ tài khoản", key: "account_name", type: "text" },
  ];

  const handleBankChange = (bankBin) => {
    const bank = banks.find((item) => String(item.bin) === String(bankBin));
    setForm((prev) => ({
      ...prev,
      bank_bin: String(bank?.bin || bankBin),
      bank_name: bank?.name || "",
    }));
  };

  const inputClass = (key) =>
    `w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#D8F3DC] transition-all disabled:bg-gray-100 disabled:text-gray-500 ${
      form[key] !== initial[key]
        ? "border-[#2D6A4F] focus:border-[#2D6A4F]"
        : "border-gray-200 focus:border-[#52B788]"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={!isSaving ? onClose : undefined} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 z-10 max-h-[90vh] overflow-y-auto">
        <h3 className="text-base font-semibold text-gray-900 mb-5">Chỉnh sửa thông tin doanh nghiệp</h3>
        <div className="flex flex-col gap-4">
          {fields.map(({ label, key, type }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                disabled={isSaving}
                className={inputClass(key)}
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Mô tả</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              disabled={isSaving}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#D8F3DC] transition-all resize-none disabled:bg-gray-100 disabled:text-gray-500 ${
                form.description !== initial.description
                  ? "border-[#2D6A4F] focus:border-[#2D6A4F]"
                  : "border-gray-200 focus:border-[#52B788]"
              }`}
            />
          </div>

          <div className="border-t border-dashed border-gray-200 pt-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Thông tin ngân hàng</p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Ngân hàng</label>
                <select
                  value={form.bank_bin}
                  onChange={(e) => handleBankChange(e.target.value)}
                  disabled={isSaving}
                  className={inputClass("bank_bin")}
                >
                  <option value="">-- Chọn ngân hàng --</option>
                  {banks.map((bank) => (
                    <option key={bank.bin} value={String(bank.bin)}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>
              {bankFields.map(({ label, key, type }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    disabled={isSaving}
                    className={inputClass(key)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={isSaving || !isDirty}
            className={`flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center ${
              isSaving
                ? "bg-[#52B788] cursor-not-allowed"
                : isDirty
                ? "bg-[#2D6A4F] hover:bg-[#1B4332] cursor-pointer"
                : "bg-[#B7E4C7] cursor-not-allowed opacity-70"
            }`}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang lưu...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SupplierInfoPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [isLoadingSupplier, setIsLoadingSupplier] = useState(true);
  const [supplierError, setSupplierError] = useState("");
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(false);
  const [isUpdatingPersonal, setIsUpdatingPersonal] = useState(false);
  const [isUpdatingCompany, setIsUpdatingCompany] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Avatar confirm flow
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const loadSupplierProfile = async () => {
      try {
        setIsLoadingSupplier(true);
        setSupplierError("");
        const profile = await fetchCurrentSupplierProfile();
        setSupplier(profile);
      } catch (error) {
        console.error("Lỗi tải thông tin nhà cung cấp:", error);
        setSupplierError(
          error?.response?.data?.message ||
            error?.response?.data?.detail ||
            error?.message ||
            "Không thể tải thông tin nhà cung cấp."
        );
      } finally {
        setIsLoadingSupplier(false);
      }
    };

    loadSupplierProfile();
  }, []);

  useEffect(() => {
    if (location.state?.openChangePassword) {
      setShowChangePassword(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const handlePickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleConfirmAvatar = async () => {
    if (!avatarFile) return;
    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const data = await accountService.updateAvatar(formData);
      const nextAvatarUrl = data?.avatar_url || data?.data?.avatar_url || avatarPreview;

      setSupplier((s) => ({ ...s, account: { ...s.account, avatar_url: nextAvatarUrl } }));
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
      setAvatarFile(null);
      alert("Cập nhật ảnh đại diện thành công!");
    } catch (err) {
      console.error("Lỗi upload avatar:", err);
      alert(extractSupplierErrorMessage(err, "Tải ảnh đại diện thất bại. Vui lòng chọn ảnh khác và thử lại."));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCancelAvatar = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  const handleSavePersonal = async (form) => {
    if (!supplier) return;

    const changedFields = getChangedFields(
      {
        full_name: supplier.account.full_name,
        email: supplier.account.email,
        phone: supplier.account.phone,
      },
      form
    );

    if (!Object.keys(changedFields).length) {
      setEditingPersonal(false);
      return;
    }

    try {
      setIsUpdatingPersonal(true);
      await accountService.update(changedFields);
      const nextAccount = { ...supplier.account, ...changedFields };
      setSupplier((s) => ({ ...s, account: nextAccount }));

      const savedUser = getLoggedInUser();
      if (savedUser) {
        localStorage.setItem("user", JSON.stringify({ ...savedUser, ...changedFields }));
      }
      setEditingPersonal(false);
      alert("Cập nhật thông tin cá nhân thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật tài khoản:", error);
      alert(extractSupplierErrorMessage(error, "Cập nhật thông tin cá nhân thất bại. Vui lòng kiểm tra lại thông tin."));
    } finally {
      setIsUpdatingPersonal(false);
    }
  };

  const handleSaveCompany = async (form) => {
    if (!supplier) return;

    const changedFields = buildSupplierUpdatePayload(supplier, form);

    if (!Object.keys(changedFields).length) {
      setEditingCompany(false);
      return;
    }

    const bankTouched = SUPPLIER_BANK_KEYS.some((key) => key in changedFields);
    if (bankTouched) {
      const missingBankField = SUPPLIER_BANK_KEYS.find((key) => !String(changedFields[key] || "").trim());
      if (missingBankField) {
        const bankFieldLabels = {
          bank_name: "Tên ngân hàng",
          bank_bin: "Mã ngân hàng",
          account_number: "Số tài khoản",
          account_name: "Tên chủ tài khoản",
        };
        alert(`${bankFieldLabels[missingBankField] || "Thông tin ngân hàng"}: Không được để trống.`);
        return;
      }
    }

    try {
      setIsUpdatingCompany(true);
      await supplierService.update(supplier.id, changedFields);
      setSupplier((s) => ({ ...s, ...changedFields }));
      setEditingCompany(false);
      alert("Cập nhật thông tin doanh nghiệp thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin doanh nghiệp:", error);
      alert(extractSupplierErrorMessage(error, "Cập nhật thông tin doanh nghiệp thất bại. Vui lòng kiểm tra lại thông tin."));
    } finally {
      setIsUpdatingCompany(false);
    }
  };

  // ChangePasswordModal đã tự gọi accountService.updatePassword bên trong,
  // nên ở đây không cần gọi API nữa — chỉ dùng làm callback sau khi đổi thành công (nếu cần).
  const handleChangePassword = () => {};

  if (isLoadingSupplier) {
    return (
      <div className={SUPPLIER_PAGE_CLASS}>
        <SupplierPageHeader
          title="Thông tin nhà cung cấp"
          description="Quản lý thông tin tài khoản và doanh nghiệp của bạn"
        />
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-500">
          Đang tải thông tin nhà cung cấp...
        </div>
      </div>
    );
  }

  if (supplierError) {
    return (
      <div className={SUPPLIER_PAGE_CLASS}>
        <SupplierPageHeader
          title="Thông tin nhà cung cấp"
          description="Quản lý thông tin tài khoản và doanh nghiệp của bạn"
        />
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {supplierError}
        </div>
      </div>
    );
  }

  if (!supplier) return null;

  return (
    <div className={SUPPLIER_PAGE_CLASS}>
      <SupplierPageHeader
        title="Thông tin nhà cung cấp"
        description="Quản lý thông tin tài khoản và doanh nghiệp của bạn"
      />

      <div className="flex flex-col gap-4">
        <PersonalSection
          supplier={supplier}
          onEdit={() => setEditingPersonal(true)}
          onPickAvatar={handlePickAvatar}
          onOpenChangePassword={() => setShowChangePassword(true)}
        />
        <CompanySection supplier={supplier} onEdit={() => setEditingCompany(true)} />
      </div>

      {editingPersonal && (
        <EditPersonalModal
          account={supplier.account}
          onClose={() => setEditingPersonal(false)}
          onSave={handleSavePersonal}
          isSaving={isUpdatingPersonal}
        />
      )}

      {editingCompany && (
        <EditCompanyModal
          supplier={supplier}
          onClose={() => setEditingCompany(false)}
          onSave={handleSaveCompany}
          isSaving={isUpdatingCompany}
        />
      )}

      {avatarPreview && (
        <AvatarConfirmModal
          previewUrl={avatarPreview}
          onConfirm={handleConfirmAvatar}
          onCancel={handleCancelAvatar}
          isSaving={uploadingAvatar}
        />
      )}

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSubmit={handleChangePassword}
      />
    </div>
  );
}