/** Nhãn tiếng Việt cho tên trường API */
export const SUPPLIER_FIELD_LABELS = {
  name: "Tên",
  full_name: "Họ tên",
  username: "Tên tài khoản",
  email: "Email",
  phone: "Số điện thoại",
  password: "Mật khẩu",
  repassword: "Xác nhận mật khẩu",
  category: "Danh mục",
  daily_production_capacity: "Năng suất",
  wholesale_price: "Giá sỉ",
  unit: "Đơn vị tính",
  description: "Mô tả",
  storage_duration_days: "Thời hạn bảo quản",
  min_storage_temp: "Nhiệt độ tối thiểu",
  max_storage_temp: "Nhiệt độ tối đa",
  slug: "Mã slug",
  sort_order: "Thứ tự sắp xếp",
  supplier_product: "Sản phẩm",
  step_order: "Số thứ tự bước",
  process_name: "Tên quy trình",
  company_name: "Tên công ty",
  tax_code: "Mã số thuế",
  address: "Địa chỉ",
  bank_name: "Tên ngân hàng",
  bank_bin: "Mã ngân hàng",
  account_number: "Số tài khoản",
  account_name: "Tên chủ tài khoản",
  certificate_code: "Mã chứng nhận",
  issued_by: "Đơn vị cấp",
  issue_date: "Ngày cấp",
  expiry_date: "Ngày hết hạn",
  images: "Hình ảnh",
  image: "Hình ảnh",
  status: "Trạng thái",
  rejection_reason: "Lý do từ chối",
  document_type: "Loại giấy tờ",
  file: "Tệp đính kèm",
};

const EN_ERROR_PATTERNS = [
  [/this field is required\.?/i, "Trường này không được để trống."],
  [/this field may not be blank\.?/i, "Trường này không được để trống."],
  [/this field may not be null\.?/i, "Trường này không được để trống."],
  [/enter a valid email address\.?/i, "Email không đúng định dạng."],
  [/enter a valid url\.?/i, "Đường dẫn URL không hợp lệ."],
  [/a valid integer is required\.?/i, "Giá trị phải là số nguyên hợp lệ."],
  [/a valid number is required\.?/i, "Giá trị phải là số hợp lệ."],
  [/ensure this value is greater than or equal to (\d+)\.?/i, "Giá trị phải lớn hơn hoặc bằng $1."],
  [/ensure this value is less than or equal to (\d+)\.?/i, "Giá trị phải nhỏ hơn hoặc bằng $1."],
  [/ensure this field has no more than (\d+) characters\.?/i, "Không được vượt quá $1 ký tự."],
  [/ensure this field has at least (\d+) characters\.?/i, "Phải có ít nhất $1 ký tự."],
  [/invalid pk ".*" - object does not exist\.?/i, "Giá trị đã chọn không tồn tại hoặc không hợp lệ."],
  [/not a valid choice\.?/i, "Giá trị không nằm trong danh sách cho phép."],
  [/file too large\.?/i, "Tệp quá lớn, vui lòng chọn tệp nhỏ hơn."],
  [/the submitted file is empty\.?/i, "Tệp đính kèm đang trống."],
  [/no file was submitted\.?/i, "Chưa chọn tệp đính kèm."],
  [/passwords do not match\.?/i, "Mật khẩu xác nhận không khớp."],
  [/user with this username already exists\.?/i, "Tên tài khoản đã được sử dụng."],
  [/user with this email already exists\.?/i, "Email đã được sử dụng."],
  [/already exists\.?/i, "Giá trị này đã tồn tại trong hệ thống."],
];

export function getFieldLabel(field, customLabels = {}) {
  return customLabels[field] ?? SUPPLIER_FIELD_LABELS[field] ?? field;
}

export function translateErrorMessage(message) {
  if (!message || typeof message !== "string") return String(message ?? "");
  const trimmed = message.trim();
  for (const [pattern, replacement] of EN_ERROR_PATTERNS) {
    if (pattern.test(trimmed)) {
      return trimmed.replace(pattern, replacement);
    }
  }
  return trimmed;
}

export function formatFieldError(field, message, customLabels = {}) {
  const label = getFieldLabel(field, customLabels);
  const translated = translateErrorMessage(message);
  return `${label}: ${translated}`;
}

/**
 * Phân tích lỗi API → tiếng Việt, rõ từng trường
 * @returns {{ fieldErrors: Record<string,string>, general: string, summary: string }}
 */
export function parseSupplierApiErrors(apiErrors, options = {}) {
  const { customLabels = {}, fallback = "Có lỗi xảy ra. Vui lòng kiểm tra lại thông tin." } = options;
  const fieldErrors = {};
  const generalParts = [];

  if (!apiErrors) {
    return { fieldErrors, general: "", summary: fallback };
  }

  if (typeof apiErrors === "string") {
    const general = translateErrorMessage(apiErrors);
    return { fieldErrors, general, summary: general || fallback };
  }

  if (Array.isArray(apiErrors)) {
    const general = apiErrors.map(translateErrorMessage).join(" ");
    return { fieldErrors, general, summary: general || fallback };
  }

  if (typeof apiErrors !== "object") {
    return { fieldErrors, general: "", summary: fallback };
  }

  Object.entries(apiErrors).forEach(([key, val]) => {
    const raw = Array.isArray(val) ? val[0] : val;
    const msg = translateErrorMessage(String(raw ?? ""));

    if (key === "non_field_errors" || key === "detail" || key === "message") {
      if (msg) generalParts.push(msg);
      return;
    }

    fieldErrors[key] = formatFieldError(key, msg, customLabels);
  });

  const fieldList = Object.values(fieldErrors);
  const general = generalParts.join(" ").trim();
  const summary = fieldList.length
    ? fieldList.join(" | ")
    : general || fallback;

  return { fieldErrors, general, summary };
}

export function extractSupplierApiMessage(error, fallback = "Có lỗi xảy ra. Vui lòng thử lại!") {
  const data = error?.response?.data ?? error?.data;
  if (!data) {
    const msg = error?.message;
    return msg && !msg.startsWith("Request failed")
      ? translateErrorMessage(msg)
      : fallback;
  }
  return parseSupplierApiErrors(data, { fallback }).summary;
}

/** ── Validation form sản phẩm ── */
export function validateProductForm(form) {
  const errs = {};

  if (!form.name?.trim()) {
    errs.name = "Tên sản phẩm: Không được để trống.";
  } else if (form.name.trim().length > 255) {
    errs.name = "Tên sản phẩm: Không được vượt quá 255 ký tự.";
  }

  if (!form.category) {
    errs.category = "Danh mục: Vui lòng chọn nhóm rau/danh mục.";
  }

  if (form.daily_production_capacity === "" || form.daily_production_capacity == null) {
    errs.daily_production_capacity = "Năng suất: Không được để trống.";
  } else {
    const capacity = Number(form.daily_production_capacity);
    if (isNaN(capacity) || capacity < 0) {
      errs.daily_production_capacity = "Năng suất: Phải là số không âm.";
    }
  }

  if (form.wholesale_price === "" || form.wholesale_price == null) {
    errs.wholesale_price = "Giá sỉ: Không được để trống.";
  } else {
    const price = Number(form.wholesale_price);
    if (isNaN(price) || price < 0) {
      errs.wholesale_price = "Giá sỉ: Phải là số không âm.";
    }
  }

  if (form.storage_duration_days !== "" && form.storage_duration_days != null) {
    const days = Number(form.storage_duration_days);
    if (!Number.isInteger(days) || days < 0) {
      errs.storage_duration_days = "Thời hạn bảo quản: Phải là số nguyên không âm.";
    }
  }

  if (form.min_storage_temp !== "" && form.min_storage_temp != null && isNaN(Number(form.min_storage_temp))) {
    errs.min_storage_temp = "Nhiệt độ tối thiểu: Phải là số hợp lệ.";
  }

  if (form.max_storage_temp !== "" && form.max_storage_temp != null && isNaN(Number(form.max_storage_temp))) {
    errs.max_storage_temp = "Nhiệt độ tối đa: Phải là số hợp lệ.";
  }

  if (
    form.min_storage_temp !== "" &&
    form.max_storage_temp !== "" &&
    form.min_storage_temp != null &&
    form.max_storage_temp != null &&
    !isNaN(Number(form.min_storage_temp)) &&
    !isNaN(Number(form.max_storage_temp)) &&
    Number(form.min_storage_temp) > Number(form.max_storage_temp)
  ) {
    errs.max_storage_temp = "Nhiệt độ tối đa: Phải lớn hơn hoặc bằng nhiệt độ tối thiểu.";
  }

  return errs;
}

/** ── Validation form danh mục ── */
export function validateCategoryForm(form) {
  const errs = {};

  if (!form.name?.trim()) {
    errs.name = "Tên danh mục: Không được để trống.";
  } else if (form.name.trim().length > 255) {
    errs.name = "Tên danh mục: Không được vượt quá 255 ký tự.";
  }

  if (form.sort_order === "" || form.sort_order === null) {
    errs.sort_order = "Thứ tự sắp xếp: Không được để trống.";
  } else if (!Number.isInteger(Number(form.sort_order)) || Number(form.sort_order) < 0) {
    errs.sort_order = "Thứ tự sắp xếp: Phải là số nguyên không âm.";
  }

  if (form.description && form.description.length > 2000) {
    errs.description = "Mô tả: Không được vượt quá 2000 ký tự.";
  }

  return errs;
}

/** ── Validation form quy trình canh tác ── */
export function validateCultivationForm(form, { activeProductIds = [], originalProductId } = {}) {
  const errs = {};

  if (!form.supplier_product) {
    errs.supplier_product = "Sản phẩm: Vui lòng chọn sản phẩm.";
  } else {
    const pid = Number(form.supplier_product);
    const isOriginal = originalProductId != null && pid === Number(originalProductId);
    if (!isOriginal && !activeProductIds.includes(pid)) {
      errs.supplier_product =
        "Sản phẩm: Chỉ được chọn sản phẩm đang được bán (trạng thái đang hoạt động).";
    }
  }

  const step = Number(form.step_order);
  if (form.step_order === "" || form.step_order == null || !Number.isInteger(step) || step < 1) {
    errs.step_order = "Số thứ tự bước: Phải là số nguyên lớn hơn hoặc bằng 1.";
  }

  const name = form.process_name?.trim() ?? "";
  if (!name) {
    errs.process_name = "Tên quy trình: Không được để trống.";
  } else if (name.length > 255) {
    errs.process_name = "Tên quy trình: Không được vượt quá 255 ký tự.";
  }

  if (form.description && form.description.length > 2000) {
    errs.description = "Mô tả: Không được vượt quá 2000 ký tự.";
  }

  return errs;
}

/** ── Validation form chứng nhận ── */
export function validateCertificationForm(form, { hasImage = false } = {}) {
  const errs = {};

  if (!form.name?.trim()) errs.name = "Tên chứng nhận: Không được để trống.";
  if (!form.certificate_code?.trim()) errs.certificate_code = "Mã chứng nhận: Không được để trống.";
  if (!form.issued_by?.trim()) errs.issued_by = "Đơn vị cấp: Không được để trống.";
  if (!form.issue_date) errs.issue_date = "Ngày cấp: Vui lòng chọn ngày cấp.";
  if (!form.expiry_date) errs.expiry_date = "Ngày hết hạn: Vui lòng chọn ngày hết hạn.";

  if (form.issue_date && form.expiry_date && form.expiry_date < form.issue_date) {
    errs.expiry_date = "Ngày hết hạn: Phải sau ngày cấp.";
  }

  if (!hasImage) errs.images = "Hình ảnh: Vui lòng tải lên ảnh chứng nhận.";

  return errs;
}

/** Gộp lỗi field thành 1 chuỗi hiển thị banner */
export function errorsToSummary(errors) {
  return Object.values(errors).join(" | ");
}
