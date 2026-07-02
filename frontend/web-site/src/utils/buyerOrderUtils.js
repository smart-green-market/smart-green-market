export const CHECKOUT_SHIPPING_FEE = 10000;

const VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh";

export function getVietnamDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function parseDateKey(dateKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey ?? "").trim());
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

export function formatDateKeyVi(dateKey) {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return String(dateKey ?? "");

  const day = String(parsed.day).padStart(2, "0");
  const month = String(parsed.month).padStart(2, "0");
  return `${day}/${month}/${parsed.year}`;
}

function addDaysToDateKey(dateKey, days) {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return null;

  const utc = Date.UTC(parsed.year, parsed.month - 1, parsed.day + days);
  const next = new Date(utc);

  const year = next.getUTCFullYear();
  const month = String(next.getUTCMonth() + 1).padStart(2, "0");
  const day = String(next.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDeliveryDateLabel(dateKey, todayKey = getVietnamDateKey()) {
  const formatted = formatDateKeyVi(dateKey);
  if (!parseDateKey(dateKey)) return formatted;

  if (dateKey === todayKey) return `Hôm nay • ${formatted}`;

  const tomorrowKey = addDaysToDateKey(todayKey, 1);
  if (tomorrowKey && dateKey === tomorrowKey) return `Ngày mai • ${formatted}`;

  return formatted;
}

function resolveDeliveryDateLabel(entry) {
  const dateKey = entry.date ?? "";
  const rawLabel = String(entry.label ?? "").trim();
  const isRawIso = /^\d{4}-\d{2}-\d{2}$/.test(rawLabel);

  if (rawLabel && !isRawIso) return rawLabel;
  return getDeliveryDateLabel(dateKey);
}

function formatTimeValue(value) {
  if (value == null || value === "") return "";

  const raw = String(value).trim();
  const timeMatch = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(raw);
  if (timeMatch) {
    const hour = String(timeMatch[1]).padStart(2, "0");
    return `${hour}:${timeMatch[2]}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat("vi-VN", {
      timeZone: VIETNAM_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(parsed);
  }

  return raw;
}

export function formatDeliverySlotTimeRange(startTime, endTime) {
  const start = formatTimeValue(startTime);
  const end = formatTimeValue(endTime);

  if (start && end) return `${start} - ${end}`;
  if (start) return `Từ ${start}`;
  if (end) return `Đến ${end}`;
  return "";
}

export function parseDeliverySlots(response) {
  const slotTemplates = new Map(
    (response?.slots ?? [])
      .map((slot) => {
        const id = slot.id ?? slot.slot ?? slot.delivery_slot ?? "";
        return [id, slot];
      })
      .filter(([id]) => id),
  );

  const dates = response?.dates ?? response?.results ?? [];

  if (!Array.isArray(dates)) return [];

  return dates
    .map((entry) => {
      const slots = (entry.slots ?? [])
        .map((slot) => {
          const id = slot.id ?? slot.slot ?? slot.delivery_slot ?? "";
          const template = slotTemplates.get(id);
          const startTime = slot.start_time ?? template?.start_time ?? "";
          const endTime = slot.end_time ?? template?.end_time ?? "";

          return {
            id,
            name:
              slot.name ??
              slot.label ??
              slot.slot_name ??
              template?.name ??
              id ??
              "",
            available: slot.available !== false,
            startTime,
            endTime,
            deliveryTime: slot.delivery_time ?? null,
            timeLabel: formatDeliverySlotTimeRange(startTime, endTime),
          };
        })
        .filter((slot) => slot.id);

      return {
        date: entry.date ?? "",
        label: resolveDeliveryDateLabel(entry),
        slots,
      };
    })
    .filter((entry) => entry.date && entry.slots.length > 0);
}

export function findFirstAvailableDeliverySelection(dates = []) {
  for (const entry of dates) {
    const slot = entry.slots?.find((item) => item.available);
    if (slot) {
      return { date: entry.date, slotId: slot.id };
    }
  }

  const first = dates[0];
  return {
    date: first?.date ?? "",
    slotId: first?.slots?.[0]?.id ?? "",
  };
}

export function isDeliverySlotAvailable(dates = [], date, slotId) {
  const entry = dates.find((item) => item.date === date);
  const slot = entry?.slots?.find((item) => item.id === slotId);
  return Boolean(slot?.available);
}

function unwrapVoucherPayload(data) {
  if (data == null || typeof data !== "object" || Array.isArray(data)) {
    return data;
  }

  const nested = data.data ?? data.result ?? data.payload;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested;
  }

  return data;
}

export function buildVoucherApplyPayload(
  voucherCode,
  items = [],
  dealerSlug = "",
) {
  return {
    voucher_code: String(voucherCode ?? "").trim(),
    items: items.map((item) => ({
      dealer_product_id: item.id,
      quantity: item.quantity,
    })),
    ...(dealerSlug ? { dealer_slug: dealerSlug } : {}),
  };
}

export function parseAvailableVouchers(response) {
  const results = response?.results ?? response ?? [];
  if (!Array.isArray(results)) return [];
  return results.filter((item) => item?.code);
}

export function getVoucherMinOrderAmount(voucher) {
  const raw =
    voucher?.min_order_amount ??
    voucher?.minimum_order_amount ??
    voucher?.min_order_value ??
    voucher?.min_spend ??
    0;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function findVoucherByCode(vouchers = [], code = "") {
  const normalizedCode = String(code ?? "")
    .trim()
    .toLowerCase();
  if (!normalizedCode) return null;

  return (
    vouchers.find(
      (voucher) =>
        String(voucher?.code ?? "")
          .trim()
          .toLowerCase() === normalizedCode,
    ) ?? null
  );
}

export function getVoucherEligibility(voucher, subtotal = 0) {
  const minOrderAmount = getVoucherMinOrderAmount(voucher);
  const orderSubtotal = Number(subtotal) || 0;

  if (minOrderAmount <= 0 || orderSubtotal >= minOrderAmount) {
    return { eligible: true, minOrderAmount, reason: "" };
  }

  const formattedMin = new Intl.NumberFormat("vi-VN").format(minOrderAmount);
  return {
    eligible: false,
    minOrderAmount,
    reason: `Chưa đạt giá trị đơn hàng tối thiểu (${formattedMin}đ).`,
  };
}

export function filterVouchersByQuery(vouchers = [], query = "") {
  const normalizedQuery = String(query ?? "")
    .trim()
    .toLowerCase();
  if (!normalizedQuery) return vouchers;

  return vouchers.filter((voucher) => {
    const code = String(voucher?.code ?? "").toLowerCase();
    const title = String(voucher?.title ?? "").toLowerCase();
    const description = String(voucher?.description ?? "").toLowerCase();

    return (
      code.includes(normalizedQuery) ||
      title.includes(normalizedQuery) ||
      description.includes(normalizedQuery)
    );
  });
}

export function parseVoucherApplyResult(data, fallbackCode = "") {
  const raw = unwrapVoucherPayload(data);
  if (!raw) return null;

  const voucher =
    raw.voucher ??
    raw.voucher_detail ??
    raw.voucher_info ??
    raw.applied_voucher ??
    {};

  const nested = voucher && typeof voucher === "object" ? voucher : {};
  const pricing =
    raw.pricing && typeof raw.pricing === "object" ? raw.pricing : raw;

  const code =
    raw.voucher_code ??
    raw.code ??
    nested.code ??
    nested.voucher_code ??
    String(fallbackCode ?? "").trim();

  const discountAmount = Number(
    pricing.discount_amount ??
      raw.discount_amount ??
      raw.discount ??
      raw.total_discount ??
      raw.discountApplied ??
      nested.discount_amount ??
      0,
  );

  const isExplicitlyInvalid = raw.valid === false || raw.is_valid === false;
  if (isExplicitlyInvalid) {
    return {
      id: nested.id ?? raw.id ?? null,
      code,
      title: nested.title ?? raw.title ?? code,
      description: nested.description ?? raw.description ?? "",
      discountType: nested.discount_type ?? raw.discount_type ?? "",
      discountValue: Number(nested.discount_value ?? raw.discount_value ?? 0),
      discountAmount: Number.isFinite(discountAmount) ? discountAmount : 0,
      valid: false,
      message: raw.message ?? raw.detail ?? "Mã voucher không hợp lệ",
    };
  }

  if (!code && !Number.isFinite(discountAmount)) return null;

  return {
    id: nested.id ?? raw.id ?? null,
    code,
    title: nested.title ?? raw.title ?? raw.voucher_title ?? code,
    description: nested.description ?? raw.description ?? "",
    discountType: nested.discount_type ?? raw.discount_type ?? "",
    discountValue: Number(nested.discount_value ?? raw.discount_value ?? 0),
    discountAmount: Number.isFinite(discountAmount) ? discountAmount : 0,
    valid: true,
    message: raw.message ?? "",
  };
}

export function formatVoucherDiscountLabel(voucher) {
  const title = voucher?.title || voucher?.code || "Voucher";
  const type = voucher?.discount_type ?? voucher?.discountType ?? "";
  const value = Number(voucher?.discount_value ?? voucher?.discountValue ?? 0);

  if (type === "percent" && value > 0) {
    return `${title} — Giảm ${value}%`;
  }

  if (value > 0) {
    return `${title} — Giảm ${new Intl.NumberFormat("vi-VN").format(value)}đ`;
  }

  return title;
}

export function buildCreateOrderPayload({
  items,
  customerAddressId,
  deliveryDate,
  deliverySlot,
  note,
  voucherCode,
}) {
  return {
    items: items.map((item) => ({
      dealer_product_id: item.id,
      quantity: item.quantity,
    })),
    customer_address_id: customerAddressId,
    delivery_date: deliveryDate,
    delivery_slot: deliverySlot,
    ...(note?.trim() ? { note: note.trim() } : {}),
    ...(voucherCode?.trim() ? { voucher_code: voucherCode.trim() } : {}),
  };
}
