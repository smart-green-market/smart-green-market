import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supplierService } from "../../services/api/suppilerService";
import { accountService } from "../../services/api/accountService";
import { bankService } from "../../services/api/bankService";
import SupplierPageHeader, { SUPPLIER_PAGE_CLASS } from "../../components/Supplier/UI/SupplierPageHeader";
import { extractSupplierApiMessage } from "../../utils/supplierValidation";
import ChangePasswordModal from "./ChangePassWord";

// ══════════════════════════════════════
// DESIGN TOKENS — khớp với HTML mẫu GreenMarket
// ══════════════════════════════════════
const T = {
  bg:      "#f3f4f6",
  surface: "#ffffff",
  surface2:"#f9fafb",
  border:  "#e5e7eb",
  border2: "#d1d5db",
  text1:   "#111827",
  text2:   "#565f6b",
  text3:   "#80899a",
  green9:  "#0f3d20",
  green8:  "#1a5c2a",
  green7:  "#166534",
  green3:  "#6ee7b7",
  green1:  "#d1fae5",
  green0:  "#EAF3DE",
  green0t: "#3B6D11",
  amber0:  "#FAEEDA",
  amber8:  "#854F0B",
  blue0:   "#E6F1FB",
  blue8:   "#185FA5",
  purple0: "#EEEDFE",
  purple8: "#534AB7",
  red0:    "#FCEBEB",
  red8:    "#A32D2D",
};

// ══════════════════════════════════════
// HELPERS
// ══════════════════════════════════════
const verificationLabel = {
  approved: "Đã xác minh",
  pending:  "Chờ xét duyệt",
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
    if (current[key] !== initial[key]) changed[key] = current[key];
  });
  return changed;
}
const SUPPLIER_BANK_KEYS = ["bank_name", "bank_bin", "account_number", "account_name"];

function normalizeSupplierForm(data = {}) {
  return {
    company_name:   data.company_name   || "",
    tax_code:       data.tax_code       || "",
    phone:          data.phone          || "",
    address:        data.address        || "",
    description:    data.description    || "",
    bank_name:      data.bank_name      || "",
    bank_bin:       String(data.bank_bin || ""),
    account_number: data.account_number || "",
    account_name:   data.account_name   || "",
  };
}
function buildSupplierUpdatePayload(supplier, form) {
  const initial = normalizeSupplierForm(supplier);
  const current = normalizeSupplierForm(form);
  const changed = getChangedFields(initial, current);
  const bankChanged = SUPPLIER_BANK_KEYS.some((key) => key in changed);
  if (bankChanged) SUPPLIER_BANK_KEYS.forEach((key) => { changed[key] = current[key]; });
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
    const s = localStorage.getItem("user");
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}
function normalizeSupplierDetail(raw, fallbackUser = null) {
  if (!raw) return null;
  const apiAccount = raw.account && typeof raw.account === "object" ? raw.account : null;
  const userAccount = fallbackUser || {};
  const account = {
    id:         apiAccount?.id         ?? userAccount.id         ?? null,
    username:   apiAccount?.username   ?? userAccount.username   ?? "",
    email:      apiAccount?.email      ?? userAccount.email      ?? "",
    full_name:  apiAccount?.full_name  ?? userAccount.full_name  ?? userAccount.username ?? "",
    phone:      apiAccount?.phone      ?? userAccount.phone      ?? "",
    avatar_url: apiAccount?.avatar_url ?? apiAccount?.avatar    ?? userAccount.avatar_url ?? userAccount.avatar ?? null,
    role:       apiAccount?.role       ?? userAccount.role       ?? "supplier",
    status:     apiAccount?.status     ?? userAccount.status     ?? "active",
    created_at: apiAccount?.created_at ?? userAccount.created_at ?? null,
    updated_at: apiAccount?.updated_at ?? userAccount.updated_at ?? null,
  };
  return {
    ...raw, account,
    company_name:        raw.company_name        ?? "",
    tax_code:            raw.tax_code            ?? "",
    phone:               raw.phone               ?? "",
    address:             raw.address             ?? "",
    description:         raw.description         ?? "",
    bank_name:           raw.bank_name           ?? "",
    bank_bin:            raw.bank_bin != null ? String(raw.bank_bin) : "",
    account_number:      raw.account_number      ?? "",
    account_name:        raw.account_name        ?? "",
    verification_status: raw.verification_status ?? "pending",
    verified_by_username:raw.verified_by_username ?? "",
    rejection_reason:    raw.rejection_reason    ?? "",
  };
}
async function fetchCurrentSupplierProfile() {
  const user = getLoggedInUser();
  const userId = toNumberOrNull(user?.id);
  if (!userId) throw new Error("Không tìm thấy thông tin tài khoản đăng nhập.");
  const directSupplierId =
    toNumberOrNull(user?.supplier_id) ??
    toNumberOrNull(user?.supplier?.id) ??
    toNumberOrNull(user?.supplier);
  if (directSupplierId) {
    return normalizeSupplierDetail(await supplierService.getById(directSupplierId), user);
  }
  const suppliers = await supplierService.getAll();
  const list = Array.isArray(suppliers) ? suppliers : [];
  const found = list.find((item) => {
    const accountId = toNumberOrNull(item?.account) ?? toNumberOrNull(item?.account_id) ?? toNumberOrNull(item?.account?.id);
    if (accountId && accountId === userId) return true;
    return (item?.account?.username && item.account.username === user?.username) ||
           (item?.account?.email    && item.account.email    === user?.email);
  });
  if (found?.id) return normalizeSupplierDetail(await supplierService.getById(found.id), user);
  if (list.length === 1 && list[0]?.id) return normalizeSupplierDetail(await supplierService.getById(list[0].id), user);
  throw new Error("Không tìm thấy hồ sơ nhà cung cấp của tài khoản này.");
}

// ══════════════════════════════════════
// REUSABLE ATOMS
// ══════════════════════════════════════

/** Badge pill nhỏ */
function Pill({ children, color = "g" }) {
  const map = {
    g:  { bg: T.green0,  text: T.green0t },
    a:  { bg: T.amber0,  text: T.amber8  },
    b:  { bg: T.blue0,   text: T.blue8   },
    p:  { bg: T.purple0, text: T.purple8 },
    gr: { bg: "#f3f4f6", text: T.text2   },
    r:  { bg: T.red0,    text: T.red8    },
  };
  const { bg, text } = map[color] || map.gr;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      background: bg, color: text,
    }}>
      {children}
    </span>
  );
}

/** Icon tròn nhỏ */
function InfoIco({ icon, color = "gr" }) {
  const map = {
    g:  { bg: T.green0,   text: T.green0t },
    a:  { bg: T.amber0,   text: T.amber8  },
    b:  { bg: T.blue0,    text: T.blue8   },
    gr: { bg: T.surface2, text: T.text2   },
  };
  const { bg, text } = map[color] || map.gr;
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 8, background: bg, color: text,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, flexShrink: 0,
    }}>
      <i className={`ti ${icon}`} />
    </div>
  );
}

/** Một dòng thông tin (icon + label + value) */
function InfoRow({ icon, label, value, iconColor }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "9px 0", borderBottom: `0.5px solid ${T.border}`,
    }}>
      <InfoIco icon={icon} color={iconColor} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, color: T.text3 }}>{label}</div>
        <div style={{ fontSize: 12, color: T.text1, fontWeight: 500, marginTop: 2, wordBreak: "break-word" }}>
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

/** Card wrapper */
function Card({ children, style }) {
  return (
    <div style={{
      background: T.surface, border: `0.5px solid ${T.border}`,
      borderRadius: 12, overflow: "hidden", ...style,
    }}>
      {children}
    </div>
  );
}

/** Card Header */
function CardHead({ iconClass, iconColor = "g", title, right }) {
  const map = {
    g:  { bg: T.green0,  text: T.green0t },
    a:  { bg: T.amber0,  text: T.amber8  },
    b:  { bg: T.blue0,   text: T.blue8   },
    gr: { bg: T.surface2,text: T.text2   },
  };
  const { bg, text } = map[iconColor] || map.g;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 16px", borderBottom: `0.5px solid ${T.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, background: bg, color: text,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
        }}>
          <i className={`ti ${iconClass}`} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, color: T.text1 }}>{title}</span>
      </div>
      {right}
    </div>
  );
}

/** Nút chỉnh sửa nhỏ */
function EditBtn({ onClick, label = "Chỉnh sửa" }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "0 12px", height: 30, borderRadius: 8,
        background: T.green8, color: "#fff",
        fontSize: 11, fontWeight: 500, cursor: "pointer", border: "none",
      }}
      onMouseOver={e => e.currentTarget.style.background = T.green7}
      onMouseOut={e => e.currentTarget.style.background = T.green8}
    >
      <i className="ti ti-edit" style={{ fontSize: 13 }} />
      {label}
    </button>
  );
}

/** Nút ghost nhỏ */
function GhostBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "0 12px", height: 30, borderRadius: 8,
        background: T.surface, color: T.text2,
        fontSize: 11, fontWeight: 500, cursor: "pointer",
        border: `0.5px solid ${T.border}`,
      }}
      onMouseOver={e => e.currentTarget.style.background = T.surface2}
      onMouseOut={e => e.currentTarget.style.background = T.surface}
    >
      {children}
    </button>
  );
}

// ══════════════════════════════════════
// AVATAR
// ══════════════════════════════════════
function Avatar({ name, url }) {
  const initials = name
    ? name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase()
    : "?";
  if (url) {
    return (
      <img
        src={url} alt={name}
        style={{ width: 64, height: 64, borderRadius: 16, objectFit: "cover" }}
      />
    );
  }
  return (
    <div style={{
      width: 64, height: 64, borderRadius: 16,
      background: T.green8, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#fff",
      userSelect: "none",
    }}>
      {initials}
    </div>
  );
}

// ══════════════════════════════════════
// MODAL — Confirm Avatar
// ══════════════════════════════════════
function AvatarConfirmModal({ previewUrl, onConfirm, onCancel, isSaving }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={!isSaving ? onCancel : undefined} />
      <div style={{ position: "relative", background: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,.2)", width: "100%", maxWidth: 360, padding: 24, zIndex: 10 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: T.text1, marginBottom: 4 }}>Xác nhận cập nhật ảnh</h3>
        <p style={{ fontSize: 11, color: T.text3, marginBottom: 20 }}>Ảnh đại diện mới sẽ được lưu sau khi xác nhận.</p>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={{ position: "relative" }}>
            <img src={previewUrl} alt="Preview" style={{ width: 80, height: 80, borderRadius: 16, objectFit: "cover", outline: `3px solid ${T.green1}` }} />
            <span style={{
              position: "absolute", bottom: -8, right: -8,
              background: T.green8, color: "#fff", fontSize: 9,
              fontWeight: 700, padding: "2px 8px", borderRadius: 20,
            }}>Mới</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} disabled={isSaving} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: `0.5px solid ${T.border}`, background: T.surface, color: T.text2, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Hủy</button>
          <button onClick={onConfirm} disabled={isSaving} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "none", background: isSaving ? "#52B788" : T.green8, color: "#fff", fontSize: 12, fontWeight: 500, cursor: isSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {isSaving ? (<><SpinIcon />Đang lưu...</>) : (<><i className="ti ti-check" />Xác nhận</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

function SpinIcon() {
  return (
    <svg style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
      <circle style={{ opacity: .25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// ══════════════════════════════════════
// MODAL — Shared input style
// ══════════════════════════════════════
const inputStyle = (changed) => ({
  width: "100%", padding: "8px 12px", borderRadius: 9,
  border: `0.5px solid ${changed ? T.green8 : T.border}`,
  fontSize: 12, color: T.text1, background: T.surface,
  outline: "none", fontFamily: "inherit",
  transition: "border-color .15s",
});

function ModalWrap({ title, onClose, isSaving, onSave, isDirty, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={!isSaving ? onClose : undefined} />
      <div style={{ position: "relative", background: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,.2)", width: "100%", maxWidth: 440, padding: 24, zIndex: 10, maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: T.text1, marginBottom: 18 }}>{title}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} disabled={isSaving} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: `0.5px solid ${T.border}`, background: T.surface, color: T.text2, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Hủy</button>
          <button
            onClick={onSave}
            disabled={isSaving || !isDirty}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 9, border: "none",
              background: isSaving ? "#52B788" : isDirty ? T.green8 : T.green1,
              color: "#fff", fontSize: 12, fontWeight: 500,
              cursor: (isSaving || !isDirty) ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {isSaving ? (<><SpinIcon />Đang lưu...</>) : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: ".6px", display: "block", marginBottom: 6, fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

// ══════════════════════════════════════
// MODAL — Chỉnh sửa thông tin cá nhân
// ══════════════════════════════════════
function EditPersonalModal({ account, onClose, onSave, isSaving }) {
  const initial = { full_name: account.full_name, email: account.email, phone: account.phone };
  const [form, setForm] = useState(initial);
  const isDirty = Object.keys(initial).some((k) => form[k] !== initial[k]);
  const fields = [
    { label: "Họ và tên", key: "full_name", type: "text" },
    { label: "Email",     key: "email",     type: "email" },
    { label: "Số điện thoại", key: "phone", type: "tel" },
  ];
  return (
    <ModalWrap title="Chỉnh sửa thông tin cá nhân" onClose={onClose} isSaving={isSaving} onSave={() => onSave(form)} isDirty={isDirty}>
      {fields.map(({ label, key, type }) => (
        <FieldGroup key={key} label={label}>
          <input
            type={type} value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            disabled={isSaving}
            style={inputStyle(form[key] !== initial[key])}
          />
        </FieldGroup>
      ))}
    </ModalWrap>
  );
}

// ══════════════════════════════════════
// MODAL — Chỉnh sửa thông tin doanh nghiệp
// ══════════════════════════════════════
function EditCompanyModal({ supplier, onClose, onSave, isSaving }) {
  const initial = normalizeSupplierForm(supplier);
  const [form, setForm] = useState(initial);
  const [banks, setBanks] = useState([]);
  useEffect(() => {
    bankService.getAll().then(setBanks).catch(console.error);
  }, []);
  const isDirty = Object.keys(initial).some((k) => form[k] !== initial[k]);
  const fields = [
    { label: "Tên công ty",             key: "company_name", type: "text" },
    { label: "Mã số thuế",              key: "tax_code",     type: "text" },
    { label: "SĐT doanh nghiệp",        key: "phone",        type: "tel"  },
    { label: "Địa chỉ",                 key: "address",      type: "text" },
  ];
  const bankFields = [
    { label: "Số tài khoản",        key: "account_number", type: "text" },
    { label: "Tên chủ tài khoản",   key: "account_name",   type: "text" },
  ];
  const handleBankChange = (bin) => {
    const bank = banks.find((b) => String(b.bin) === String(bin));
    setForm((p) => ({ ...p, bank_bin: String(bank?.bin || bin), bank_name: bank?.name || "" }));
  };
  return (
    <ModalWrap title="Chỉnh sửa thông tin doanh nghiệp" onClose={onClose} isSaving={isSaving} onSave={() => onSave(form)} isDirty={isDirty}>
      {fields.map(({ label, key, type }) => (
        <FieldGroup key={key} label={label}>
          <input type={type} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} disabled={isSaving} style={inputStyle(form[key] !== initial[key])} />
        </FieldGroup>
      ))}
      <FieldGroup label="Mô tả">
        <textarea
          rows={3} value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          disabled={isSaving}
          style={{ ...inputStyle(form.description !== initial.description), resize: "none" }}
        />
      </FieldGroup>

      {/* Ngân hàng */}
      <div style={{ borderTop: `0.5px dashed ${T.border}`, paddingTop: 12 }}>
        <p style={{ fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: ".6px", fontWeight: 500, marginBottom: 12 }}>Thông tin ngân hàng</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <FieldGroup label="Ngân hàng">
            <select value={form.bank_bin} onChange={(e) => handleBankChange(e.target.value)} disabled={isSaving} style={inputStyle(form.bank_bin !== initial.bank_bin)}>
              <option value="">-- Chọn ngân hàng --</option>
              {banks.map((b) => <option key={b.bin} value={String(b.bin)}>{b.name}</option>)}
            </select>
          </FieldGroup>
          {bankFields.map(({ label, key, type }) => (
            <FieldGroup key={key} label={label}>
              <input type={type} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} disabled={isSaving} style={inputStyle(form[key] !== initial[key])} />
            </FieldGroup>
          ))}
        </div>
      </div>
    </ModalWrap>
  );
}

// ══════════════════════════════════════
// SECTION — Profile Hero (giống profile-hero trong HTML mẫu)
// ══════════════════════════════════════
function ProfileHero({ supplier, onEditPersonal, onPickAvatar, onOpenChangePassword }) {
  const { account } = supplier;
  const vs = supplier.verification_status;
  const vsColor = vs === "approved" ? "g" : vs === "pending" ? "a" : "r";
  const vsLabel = verificationLabel[vs] || vs;
  const initials = account.full_name
    ? account.full_name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase()
    : "?";

  return (
    <div style={{ background: T.surface, border: `0.5px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
      {/* Cover */}
      <div style={{ height: 72, background: `linear-gradient(135deg, ${T.green9}, ${T.green8})`, position: "relative" }}>
        {/* Decorative dots */}
        <div style={{ position: "absolute", right: 24, top: 16, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
        <div style={{ position: "absolute", right: 48, top: 8, width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,.04)" }} />
      </div>

      {/* Body */}
      <div style={{ padding: "0 20px 20px" }}>
        {/* Avatar */}
        <div style={{ position: "relative", display: "inline-block" }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18,
            background: T.green8, border: `3px solid ${T.surface}`,
            marginTop: -32, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 700, color: "#fff", overflow: "hidden", flexShrink: 0,
          }}>
            {account.avatar_url
              ? <img src={account.avatar_url} alt={account.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials
            }
          </div>
          {/* Online dot */}
          <span style={{
            position: "absolute", bottom: 2, right: 2,
            width: 12, height: 12, borderRadius: "50%",
            background: account.status === "active" ? "#22c55e" : T.border2,
            border: `2px solid ${T.surface}`,
          }} />
        </div>

        {/* Name + actions row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", paddingTop: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: T.text1 }}>
                {account.full_name || account.username}
              </span>
              {vs === "approved" && (
                <i className="ti ti-rosette-discount-check" style={{ fontSize: 17, color: T.blue8 }} title="Đã xác minh" />
              )}
            </div>
            <div style={{ fontSize: 12, color: T.text2, marginTop: 2 }}>
              @{account.username} · {account.email}
            </div>
            {/* Tags */}
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              <Pill color="b">Nhà cung cấp</Pill>
              <Pill color={vsColor}>{vsLabel}</Pill>
              <Pill color={account.status === "active" ? "g" : "gr"}>
                {statusLabel[account.status] || account.status}
              </Pill>
              {supplier.company_name && <Pill color="gr">{supplier.company_name}</Pill>}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 4 }}>
            <GhostBtn onClick={onOpenChangePassword}>
              <i className="ti ti-lock" style={{ fontSize: 13 }} />
              Đổi mật khẩu
            </GhostBtn>
            <label style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "0 12px", height: 30, borderRadius: 8,
              background: T.surface, color: T.text2,
              fontSize: 11, fontWeight: 500, cursor: "pointer",
              border: `0.5px solid ${T.border}`,
            }}>
              <i className="ti ti-camera" style={{ fontSize: 13 }} />
              Cập nhật ảnh
              <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={onPickAvatar} />
            </label>
            <EditBtn onClick={onEditPersonal} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// SECTION — Thông tin cá nhân
// ══════════════════════════════════════
function PersonalInfoCard({ supplier }) {
  const { account } = supplier;
  return (
    <Card>
      <CardHead iconClass="ti-user" iconColor="b" title="Thông tin tài khoản" />
      <div style={{ padding: "0 16px" }}>
        <InfoRow icon="ti-id-badge-2"    label="Họ và tên"         value={account.full_name}            />
        <InfoRow icon="ti-at"            label="Tên đăng nhập"     value={`@${account.username}`}       />
        <InfoRow icon="ti-mail"          label="Email"             value={account.email}                />
        <InfoRow icon="ti-phone"         label="Số điện thoại"     value={formatPhone(account.phone)}   />
        <InfoRow icon="ti-calendar"      label="Ngày tạo tài khoản"value={formatDate(account.created_at)} />
        <InfoRow icon="ti-refresh"       label="Cập nhật lần cuối" value={formatDate(account.updated_at)} iconColor="a" />
      </div>
    </Card>
  );
}

// ══════════════════════════════════════
// SECTION — Thông tin doanh nghiệp
// ══════════════════════════════════════
function CompanyInfoCard({ supplier, onEdit }) {
  return (
    <Card>
      <CardHead
        iconClass="ti-building-store"
        iconColor="g"
        title="Thông tin doanh nghiệp"
        right={<EditBtn onClick={onEdit} />}
      />
      <div style={{ padding: "0 16px" }}>
        <InfoRow icon="ti-hash"          label="Mã nhà cung cấp"          value={`#${supplier.id}`}                  iconColor="gr" />
        <InfoRow icon="ti-building"      label="Tên công ty"               value={supplier.company_name}              />
        <InfoRow icon="ti-receipt-tax"   label="Mã số thuế"                value={supplier.tax_code}                  />
        <InfoRow icon="ti-phone-call"    label="SĐT doanh nghiệp"          value={formatPhone(supplier.phone)}        />
        <InfoRow icon="ti-map-pin"       label="Địa chỉ"                   value={supplier.address}                   iconColor="a" />
        <InfoRow icon="ti-align-left"    label="Mô tả"                     value={supplier.description}               iconColor="gr" />
      </div>
    </Card>
  );
}

// ══════════════════════════════════════
// SECTION — Ngân hàng
// ══════════════════════════════════════
function BankCard({ supplier }) {
  const hasBankInfo = supplier.bank_name || supplier.account_number;
  return (
    <Card>
      <CardHead iconClass="ti-credit-card" iconColor="b" title="Thông tin ngân hàng" />
      <div style={{ padding: "0 16px" }}>
        {hasBankInfo ? (
          <>
            <InfoRow icon="ti-building-bank" label="Tên ngân hàng"    value={supplier.bank_name}      />
            <InfoRow icon="ti-barcode"        label="Mã BIN"           value={supplier.bank_bin}       iconColor="gr" />
            <InfoRow icon="ti-credit-card"    label="Số tài khoản"     value={supplier.account_number} />
            <InfoRow icon="ti-user-check"     label="Tên chủ tài khoản"value={supplier.account_name}  iconColor="a" />
          </>
        ) : (
          <div style={{ padding: "20px 0", textAlign: "center", color: T.text3, fontSize: 12 }}>
            <i className="ti ti-credit-card" style={{ fontSize: 28, color: T.border2, display: "block", marginBottom: 8 }} />
            Chưa có thông tin ngân hàng
          </div>
        )}
      </div>
    </Card>
  );
}

// ══════════════════════════════════════
// SECTION — Xác minh
// ══════════════════════════════════════
function VerificationCard({ supplier }) {
  const vs = supplier.verification_status;
  const vsColor = vs === "approved" ? "g" : vs === "pending" ? "a" : "r";
  const vsBannerConfig = {
    approved: { bg: T.green0, text: T.green0t, border: "#B7E4C7", icon: "ti-rosette-discount-check" },
    pending:  { bg: T.amber0, text: T.amber8,  border: "#F6D28A", icon: "ti-clock"                  },
    rejected: { bg: T.red0,   text: T.red8,    border: "#F3B8B8", icon: "ti-x"                      },
  }[vs] || { bg: T.surface2, text: T.text2, border: T.border, icon: "ti-help" };

  return (
    <Card>
      <CardHead iconClass="ti-shield-check" iconColor="g" title="Trạng thái xác minh" />
      <div style={{ padding: 16 }}>
        {/* Banner trạng thái */}
        <div style={{
          background: vsBannerConfig.bg, border: `0.5px solid ${vsBannerConfig.border}`,
          borderRadius: 10, padding: "12px 14px",
          display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
        }}>
          <i className={`ti ${vsBannerConfig.icon}`} style={{ fontSize: 18, color: vsBannerConfig.text, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: vsBannerConfig.text }}>
              {verificationLabel[vs] || vs}
            </div>
            {vs === "approved" && <div style={{ fontSize: 11, color: vsBannerConfig.text, marginTop: 2 }}>Hồ sơ đã được phê duyệt</div>}
            {vs === "pending"  && <div style={{ fontSize: 11, color: vsBannerConfig.text, marginTop: 2 }}>Đang chờ quản trị viên xét duyệt</div>}
            {vs === "rejected" && supplier.rejection_reason && (
              <div style={{ fontSize: 11, color: vsBannerConfig.text, marginTop: 2 }}>Lý do: {supplier.rejection_reason}</div>
            )}
          </div>
        </div>

        <div style={{ padding: "0" }}>
          <InfoRow icon="ti-calendar-check" label="Thời điểm xác minh"  value={formatDate(supplier.verified_at)}  />
          <InfoRow icon="ti-calendar"        label="Ngày đăng ký"         value={formatDate(supplier.created_at)}  iconColor="gr" />
          <InfoRow icon="ti-refresh"         label="Cập nhật lần cuối"    value={formatDate(supplier.updated_at)}  iconColor="a"  />
        </div>
      </div>
    </Card>
  );
}

// ══════════════════════════════════════
// SECTION — Hồ sơ tài liệu
// ══════════════════════════════════════
const DOC_STATUS_MAP = {
  approved: { color: "g", label: "Đã duyệt",      icon: "ti-circle-check"  },
  pending:  { color: "a", label: "Chờ duyệt",      icon: "ti-clock"         },
  rejected: { color: "r", label: "Từ chối",        icon: "ti-x"             },
};

const DOC_TYPE_ICON = {
  business_license: "ti-license",
  id_card:          "ti-id-badge-2",
  tax_certificate:  "ti-receipt-tax",
  other:            "ti-file-description",
};

function DocCard({ doc, onPreview }) {
  const s  = DOC_STATUS_MAP[doc.status] || DOC_STATUS_MAP.pending;
  const ic = DOC_TYPE_ICON[doc.document_type] || DOC_TYPE_ICON.other;
  const isImage = /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(doc.file_url);

  return (
    <div style={{
      background: T.surface, border: `0.5px solid ${T.border}`,
      borderRadius: 12, overflow: "hidden",
      display: "flex", flexDirection: "column",
      transition: "box-shadow .15s",
    }}
      onMouseOver={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.08)"}
      onMouseOut={e  => e.currentTarget.style.boxShadow = "none"}
    >
      {/* Thumbnail */}
      <div
        onClick={() => onPreview(doc)}
        style={{
          height: 140, background: T.surface2, position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", overflow: "hidden",
        }}
      >
        {isImage ? (
          <img
            src={doc.file_url}
            alt={doc.document_type_label}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .2s" }}
            onMouseOver={e => e.currentTarget.style.transform = "scale(1.04)"}
            onMouseOut={e  => e.currentTarget.style.transform = "scale(1)"}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <i className="ti ti-file-description" style={{ fontSize: 36, color: T.border2 }} />
            <span style={{ fontSize: 10, color: T.text3 }}>Nhấn để xem</span>
          </div>
        )}
        {/* Overlay zoom hint */}
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(15,61,32,0)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background .2s",
        }}
          onMouseOver={e => { e.currentTarget.style.background = "rgba(15,61,32,0.35)"; }}
          onMouseOut={e  => { e.currentTarget.style.background = "rgba(15,61,32,0)"; }}
        >
          <i className="ti ti-zoom-in" style={{ fontSize: 22, color: "#fff", opacity: 0, transition: "opacity .2s" }}
            ref={el => {
              if (!el) return;
              el.parentNode.onmouseenter = () => el.style.opacity = "1";
              el.parentNode.onmouseleave = () => el.style.opacity = "0";
            }}
          />
        </div>
        {/* Status badge nổi */}
        <div style={{ position: "absolute", top: 8, right: 8 }}>
          <Pill color={s.color}><i className={`ti ${s.icon}`} style={{ fontSize: 10, marginRight: 3 }} />{s.label}</Pill>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "12px 14px", flex: 1 }}>
        {/* Doc type + icon */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: T.blue0, color: T.blue8,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0,
          }}>
            <i className={`ti ${ic}`} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.text1 }}>{doc.document_type_label}</span>
        </div>

        {/* Meta info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {doc.verified_by_username && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <i className="ti ti-user-check" style={{ fontSize: 11, color: T.text3 }} />
              <span style={{ fontSize: 11, color: T.text3 }}>Duyệt bởi: <strong style={{ color: T.text2 }}>{doc.verified_by_username}</strong></span>
            </div>
          )}
          {doc.verified_at && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <i className="ti ti-calendar-check" style={{ fontSize: 11, color: T.text3 }} />
              <span style={{ fontSize: 11, color: T.text3 }}>{formatDate(doc.verified_at)}</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-calendar" style={{ fontSize: 11, color: T.text3 }} />
            <span style={{ fontSize: 11, color: T.text3 }}>Nộp: {formatDate(doc.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: "8px 14px", borderTop: `0.5px solid ${T.border}`,
        display: "flex", justifyContent: "flex-end",
      }}>
        <a
          href={doc.file_url}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, color: T.blue8, fontWeight: 500, textDecoration: "none",
          }}
        >
          <i className="ti ti-external-link" style={{ fontSize: 12 }} />
          Xem gốc
        </a>
      </div>
    </div>
  );
}

/** Lightbox preview */
function DocLightbox({ doc, onClose }) {
  const isImage = /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(doc.file_url);
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, background: "rgba(0,0,0,0.75)",
        animation: "fadeSlideUp .2s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{ position: "relative", maxWidth: 860, width: "100%" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: -14, right: -14, zIndex: 10,
            width: 32, height: 32, borderRadius: "50%",
            background: "#fff", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,.3)",
          }}
        >
          <i className="ti ti-x" style={{ fontSize: 16, color: T.text1 }} />
        </button>

        {/* Header */}
        <div style={{
          background: T.green9, borderRadius: "12px 12px 0 0",
          padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
        }}>
          <i className={`ti ${DOC_TYPE_ICON[doc.document_type] || "ti-file-description"}`}
            style={{ fontSize: 16, color: T.green3 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: T.green1 }}>{doc.document_type_label}</span>
          <div style={{ marginLeft: "auto" }}>
            <Pill color={DOC_STATUS_MAP[doc.status]?.color || "gr"}>
              {DOC_STATUS_MAP[doc.status]?.label || doc.status}
            </Pill>
          </div>
        </div>

        {/* Content */}
        <div style={{
          background: "#fff", borderRadius: "0 0 12px 12px",
          overflow: "hidden",
        }}>
          {isImage ? (
            <img
              src={doc.file_url}
              alt={doc.document_type_label}
              style={{ width: "100%", maxHeight: 560, objectFit: "contain", display: "block" }}
            />
          ) : (
            <div style={{ padding: 40, textAlign: "center" }}>
              <i className="ti ti-file-description" style={{ fontSize: 48, color: T.border2, display: "block", marginBottom: 12 }} />
              <p style={{ fontSize: 13, color: T.text2, marginBottom: 16 }}>Không thể hiển thị preview. Mở file gốc để xem.</p>
              <a href={doc.file_url} target="_blank" rel="noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 9,
                  background: T.green8, color: "#fff", fontSize: 12, fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                <i className="ti ti-external-link" />Mở file gốc
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentsCard({ documents, isLoading, error }) {
  const [lightbox, setLightbox] = useState(null);

  return (
    <>
      <Card>
        <CardHead
          iconClass="ti-folder-open"
          iconColor="b"
          title="Hồ sơ tài liệu"
          right={
            <span style={{ fontSize: 11, color: T.text3 }}>
              {isLoading ? "Đang tải..." : `${documents.length} tài liệu`}
            </span>
          }
        />

        <div style={{ padding: 16 }}>
          {isLoading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  borderRadius: 12, overflow: "hidden",
                  border: `0.5px solid ${T.border}`,
                  animation: "pulse 1.5s ease-in-out infinite",
                }}>
                  <div style={{ height: 140, background: T.surface2 }} />
                  <div style={{ padding: 12 }}>
                    <div style={{ height: 10, background: T.border, borderRadius: 5, width: "60%", marginBottom: 8 }} />
                    <div style={{ height: 8, background: T.border, borderRadius: 4, width: "40%" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: T.red0, border: `0.5px solid #F3B8B8`,
              borderRadius: 10, padding: "12px 14px",
            }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 16, color: T.red8 }} />
              <span style={{ fontSize: 12, color: T.red8 }}>{error}</span>
            </div>
          )}

          {!isLoading && !error && documents.length === 0 && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "32px 20px", gap: 10, textAlign: "center",
            }}>
              <i className="ti ti-folder-off" style={{ fontSize: 36, color: T.border2 }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: T.text2 }}>Chưa có tài liệu nào</span>
              <span style={{ fontSize: 11, color: T.text3 }}>Hồ sơ tài liệu sẽ hiển thị tại đây sau khi được tải lên</span>
            </div>
          )}

          {!isLoading && !error && documents.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
              gap: 12,
            }}>
              {documents.map(doc => (
                <DocCard key={doc.id} doc={doc} onPreview={setLightbox} />
              ))}
            </div>
          )}
        </div>
      </Card>

      {lightbox && <DocLightbox doc={lightbox} onClose={() => setLightbox(null)} />}
    </>
  );
}

// ══════════════════════════════════════
// LOADING / ERROR STATES
// ══════════════════════════════════════
function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          background: T.surface, border: `0.5px solid ${T.border}`,
          borderRadius: 12, padding: 20,
          animation: "pulse 1.5s ease-in-out infinite",
        }}>
          <div style={{ height: 14, background: T.border, borderRadius: 7, width: "40%", marginBottom: 12 }} />
          <div style={{ height: 10, background: T.border, borderRadius: 5, width: "70%", marginBottom: 8 }} />
          <div style={{ height: 10, background: T.border, borderRadius: 5, width: "55%" }} />
        </div>
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
}

// ══════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════
export default function SupplierInfoPage() {
  const location = useLocation();
  const navigate  = useNavigate();
  const [supplier,            setSupplier]            = useState(null);
  const [isLoadingSupplier,   setIsLoadingSupplier]   = useState(true);
  const [supplierError,       setSupplierError]       = useState("");
  const [editingPersonal,     setEditingPersonal]     = useState(false);
  const [editingCompany,      setEditingCompany]      = useState(false);
  const [isUpdatingPersonal,  setIsUpdatingPersonal]  = useState(false);
  const [isUpdatingCompany,   setIsUpdatingCompany]   = useState(false);
  const [showChangePassword,  setShowChangePassword]  = useState(false);
  const [avatarPreview,       setAvatarPreview]       = useState(null);
  const [avatarFile,          setAvatarFile]          = useState(null);
  const [uploadingAvatar,     setUploadingAvatar]     = useState(false);
  // Documents
  const [documents,           setDocuments]           = useState([]);
  const [isLoadingDocs,       setIsLoadingDocs]       = useState(false);
  const [docsError,           setDocsError]           = useState("");
  // Toast notification
  const [toast,               setToast]               = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load profile ──
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoadingSupplier(true);
        setSupplierError("");
        setSupplier(await fetchCurrentSupplierProfile());
      } catch (err) {
        console.error("Lỗi tải thông tin nhà cung cấp:", err);
        setSupplierError(err?.response?.data?.message || err?.response?.data?.detail || err?.message || "Không thể tải thông tin nhà cung cấp.");
      } finally {
        setIsLoadingSupplier(false);
      }
    };
    load();
  }, []);

  // ── Load documents sau khi có supplier ID ──
  useEffect(() => {
    if (!supplier?.id) return;
    const loadDocs = async () => {
      try {
        setIsLoadingDocs(true);
        setDocsError("");
        const res = await supplierService.getbyIdSupplier(supplier.id);
        // API trả về { results: [...] } hoặc array trực tiếp
        const list = Array.isArray(res?.data?.results)
          ? res.data.results
          : Array.isArray(res?.results)
          ? res.results
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        setDocuments(list);
      } catch (err) {
        console.error("Lỗi tải hồ sơ tài liệu:", err);
        setDocsError(err?.response?.data?.message || err?.message || "Không thể tải hồ sơ tài liệu.");
      } finally {
        setIsLoadingDocs(false);
      }
    };
    loadDocs();
  }, [supplier?.id]);

  // ── Open change-password via router state ──
  useEffect(() => {
    if (location.state?.openChangePassword) {
      setShowChangePassword(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  // ── Avatar ──
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
      const fd = new FormData();
      fd.append("avatar", avatarFile);
      const data = await accountService.updateAvatar(fd);
      const nextUrl = data?.avatar_url || data?.data?.avatar_url || avatarPreview;
      setSupplier((s) => ({ ...s, account: { ...s.account, avatar_url: nextUrl } }));
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null); setAvatarFile(null);
      showToast("Cập nhật ảnh đại diện thành công!");
    } catch (err) {
      console.error(err);
      showToast(extractSupplierErrorMessage(err, "Tải ảnh thất bại. Vui lòng thử lại."), "error");
    } finally { setUploadingAvatar(false); }
  };
  const handleCancelAvatar = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null); setAvatarFile(null);
  };

  // ── Save personal ──
  const handleSavePersonal = async (form) => {
    if (!supplier) return;
    const changed = getChangedFields(
      { full_name: supplier.account.full_name, email: supplier.account.email, phone: supplier.account.phone },
      form
    );
    if (!Object.keys(changed).length) { setEditingPersonal(false); return; }
    try {
      setIsUpdatingPersonal(true);
      await accountService.update(changed);
      setSupplier((s) => ({ ...s, account: { ...s.account, ...changed } }));
      const saved = getLoggedInUser();
      if (saved) localStorage.setItem("user", JSON.stringify({ ...saved, ...changed }));
      setEditingPersonal(false);
      showToast("Cập nhật thông tin cá nhân thành công!");
    } catch (err) {
      console.error(err);
      showToast(extractSupplierErrorMessage(err, "Cập nhật thất bại. Vui lòng thử lại."), "error");
    } finally { setIsUpdatingPersonal(false); }
  };

  // ── Save company ──
  const handleSaveCompany = async (form) => {
    if (!supplier) return;
    const changed = buildSupplierUpdatePayload(supplier, form);
    if (!Object.keys(changed).length) { setEditingCompany(false); return; }
    const bankTouched = SUPPLIER_BANK_KEYS.some((k) => k in changed);
    if (bankTouched) {
      const labels = { bank_name: "Tên ngân hàng", bank_bin: "Mã ngân hàng", account_number: "Số tài khoản", account_name: "Tên chủ tài khoản" };
      const missing = SUPPLIER_BANK_KEYS.find((k) => !String(changed[k] || "").trim());
      if (missing) { showToast(`${labels[missing]}: Không được để trống.`, "error"); return; }
    }
    try {
      setIsUpdatingCompany(true);
      await supplierService.update(supplier.id, changed);
      setSupplier((s) => ({ ...s, ...changed }));
      setEditingCompany(false);
      showToast("Cập nhật thông tin doanh nghiệp thành công!");
    } catch (err) {
      console.error(err);
      showToast(extractSupplierErrorMessage(err, "Cập nhật thất bại. Vui lòng thử lại."), "error");
    } finally { setIsUpdatingCompany(false); }
  };

  const handleChangePassword = () => {};

  // ── Render ──
  if (isLoadingSupplier) {
    return (
      <div className={SUPPLIER_PAGE_CLASS}>
        <SupplierPageHeader title="Thông tin nhà cung cấp" description="Quản lý thông tin tài khoản và doanh nghiệp của bạn" />
        <LoadingState />
      </div>
    );
  }

  if (supplierError) {
    return (
      <div className={SUPPLIER_PAGE_CLASS}>
        <SupplierPageHeader title="Thông tin nhà cung cấp" description="Quản lý thông tin tài khoản và doanh nghiệp của bạn" />
        <div style={{
          background: T.red0, border: `0.5px solid #F3B8B8`,
          borderRadius: 12, padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <i className="ti ti-alert-circle" style={{ fontSize: 18, color: T.red8, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: T.red8 }}>{supplierError}</span>
        </div>
      </div>
    );
  }

  if (!supplier) return null;

  return (
    <div className={SUPPLIER_PAGE_CLASS}>
      {/* CSS animations inline */}
      <style>{`
        @import url("https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css");
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .sgm-info-row-last { border-bottom: none !important; }
      `}</style>

      <SupplierPageHeader
        title="Thông tin nhà cung cấp"
        description="Quản lý thông tin tài khoản và doanh nghiệp của bạn"
      />

      {/* ── Main layout ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeSlideUp .3s ease" }}>

        {/* Profile Hero */}
        <ProfileHero
          supplier={supplier}
          onEditPersonal={() => setEditingPersonal(true)}
          onPickAvatar={handlePickAvatar}
          onOpenChangePassword={() => setShowChangePassword(true)}
        />

        {/* Two-column grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <PersonalInfoCard supplier={supplier} />
          <VerificationCard supplier={supplier} />
        </div>

        {/* Company + Bank */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <CompanyInfoCard supplier={supplier} onEdit={() => setEditingCompany(true)} />
          <BankCard supplier={supplier} />
        </div>

        {/* Documents — full width */}
        <DocumentsCard
          documents={documents}
          isLoading={isLoadingDocs}
          error={docsError}
        />
      </div>

      {/* ── Modals ── */}
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

      {/* ── Toast notification ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          display: "flex", alignItems: "center", gap: 10,
          background: toast.type === "error" ? T.red8 : T.green8,
          color: "#fff", borderRadius: 10, padding: "10px 16px",
          fontSize: 12, fontWeight: 500, boxShadow: "0 8px 24px rgba(0,0,0,.18)",
          animation: "toastIn .25s ease",
        }}>
          <i className={`ti ${toast.type === "error" ? "ti-alert-circle" : "ti-circle-check"}`} style={{ fontSize: 16 }} />
          {toast.msg}
        </div>
      )}
    </div>
  );
}