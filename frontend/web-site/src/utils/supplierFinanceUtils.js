export function formatFinanceCurrency(value) {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return `${amount.toLocaleString("vi-VN")} đ`;
}

export function formatFinancePercent(value) {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return `${amount.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%`;
}

export function toMillionDisplay(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount / 1_000_000) * 10) / 10;
}

export function normalizeFinanceOverview(raw) {
  const data = raw?.data ?? raw ?? {};

  return {
    totalRevenue: Number(
      data.total_system_revenue ??
        data.total_revenue ??
        data.system_revenue ??
        0,
    ),
    cashIn: Number(data.total_cash_in ?? data.cash_in ?? data.inflow ?? 0),
    cashOut: Number(data.total_cash_out ?? data.cash_out ?? data.outflow ?? 0),
    commissionTotal: Number(
      data.total_commission ??
        data.commission_amount ??
        data.total_discount ??
        0,
    ),
    avgCommissionRate: Number(
      data.average_commission_rate ??
        data.avg_commission_rate ??
        data.commission_rate ??
        0,
    ),
    supplierCount: Number(
      data.supplier_count ?? data.total_suppliers ?? data.count ?? 0,
    ),
  };
}

export function normalizeFinanceSupplier(raw) {
  const supplier = raw?.supplier ?? raw;
  const finance = raw?.finance ?? raw?.financial ?? raw;

  return {
    id: supplier?.id ?? raw?.id ?? raw?.supplier_id,
    companyName:
      supplier?.company_name ?? raw?.company_name ?? raw?.supplier_name ?? "—",
    taxCode: supplier?.tax_code ?? raw?.tax_code ?? "",
    phone: supplier?.phone ?? raw?.phone ?? "",
    address: supplier?.address ?? raw?.address ?? "",
    verificationStatus:
      supplier?.verification_status ?? raw?.verification_status ?? "",
    totalRevenue: Number(
      finance?.total_revenue ?? raw?.total_revenue ?? raw?.revenue ?? 0,
    ),
    cashIn: Number(
      finance?.cash_in ??
        finance?.total_cash_in ??
        raw?.cash_in ??
        raw?.total_cash_in ??
        0,
    ),
    cashOut: Number(
      finance?.cash_out ??
        finance?.total_cash_out ??
        raw?.cash_out ??
        raw?.total_cash_out ??
        0,
    ),
    commissionRate: Number(
      finance?.commission_rate ??
        raw?.commission_rate ??
        raw?.discount_rate ??
        0,
    ),
    commissionAmount: Number(
      finance?.commission_amount ??
        raw?.commission_amount ??
        raw?.total_commission ??
        0,
    ),
    netAmount: Number(
      finance?.net_revenue ?? raw?.net_revenue ?? raw?.net_amount ?? 0,
    ),
    orderCount: Number(
      finance?.order_count ?? raw?.order_count ?? raw?.total_orders ?? 0,
    ),
    cashFlowTrend: Array.isArray(finance?.cash_flow)
      ? finance.cash_flow
      : Array.isArray(raw?.cash_flow)
        ? raw.cash_flow
        : Array.isArray(raw?.cash_flow_trend)
          ? raw.cash_flow_trend
          : [],
    updatedAt:
      finance?.updated_at ?? raw?.updated_at ?? raw?.last_updated ?? null,
  };
}

export function normalizeFinanceListResponse(response) {
  const payload = response?.data ?? response ?? {};
  const results = payload.results ?? payload.items ?? payload ?? [];
  const list = Array.isArray(results) ? results : [];

  return {
    count: Number(payload.count ?? list.length ?? 0),
    next: payload.next ?? null,
    previous: payload.previous ?? null,
    results: list.map(normalizeFinanceSupplier),
  };
}

export function buildFinanceOverviewCounts(overview) {
  if (!overview) {
    return {
      total_revenue: 0,
      cash_in: 0,
      cash_out: 0,
      commission: 0,
    };
  }

  return {
    total_revenue: toMillionDisplay(overview.totalRevenue),
    cash_in: toMillionDisplay(overview.cashIn),
    cash_out: toMillionDisplay(overview.cashOut),
    commission: toMillionDisplay(overview.commissionTotal),
  };
}
