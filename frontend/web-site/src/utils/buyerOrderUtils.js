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

export function buildCreateOrderPayload({
  items,
  customerAddressId,
  deliveryDate,
  deliverySlot,
  note,
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
  };
}
