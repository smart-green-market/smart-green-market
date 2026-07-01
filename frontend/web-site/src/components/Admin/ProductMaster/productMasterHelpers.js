export const PRODUCT_MASTER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
};

export function extractProductMasterList(response) {
  if (Array.isArray(response)) return response;
  if (!response?.results) return [];

  const first = response.results[0];
  if (first?.results) {
    return response.results.flatMap((page) => page.results ?? []);
  }

  return response.results;
}

export function normalizeProductMasterSeasons(seasons = []) {
  if (!Array.isArray(seasons)) return [];
  return seasons.map((season) => ({
    id: season.id,
    code: season.code ?? "",
    name: season.name ?? "",
    description: season.description ?? "",
    start_month: season.start_month ?? null,
    end_month: season.end_month ?? null,
    sort_order: season.sort_order ?? 0,
    status: season.status ?? "active",
  }));
}

export const FULL_SEASON_COUNT = 4;

export function hasAllSeasons(seasons = []) {
  return normalizeProductMasterSeasons(seasons).length >= FULL_SEASON_COUNT;
}

export function formatSeasonLabel(seasons = []) {
  const normalized = normalizeProductMasterSeasons(seasons);
  if (normalized.length === 0) return "—";
  return normalized
    .map((season) => season.name)
    .filter(Boolean)
    .join(", ");
}

const SEASON_TAG_STYLES = {
  spring: "bg-green-100 text-green-800 border-green-200",
  summer: "bg-amber-100 text-amber-900 border-amber-200",
  autumn: "bg-rose-100 text-rose-800 border-rose-200",
  winter: "bg-sky-100 text-sky-900 border-sky-200",
};

export function getSeasonTagClassName(season = {}) {
  const code = String(season.code ?? "")
    .trim()
    .toLowerCase();
  if (SEASON_TAG_STYLES[code]) {
    return SEASON_TAG_STYLES[code];
  }

  const name = String(season.name ?? "")
    .trim()
    .toLowerCase();
  if (name.includes("xuân")) return SEASON_TAG_STYLES.spring;
  if (name.includes("hè")) return SEASON_TAG_STYLES.summer;
  if (name.includes("thu")) return SEASON_TAG_STYLES.autumn;
  if (name.includes("đông") || name.includes("dong"))
    return SEASON_TAG_STYLES.winter;

  return "bg-violet-100 text-violet-900 border-violet-200";
}

export function extractSeasonIds(seasons = []) {
  return normalizeProductMasterSeasons(seasons).map((season) =>
    String(season.id),
  );
}

export function formatProductMasterRow(item) {
  const seasons = normalizeProductMasterSeasons(item.seasons);
  return {
    id: item.id,
    name: item.name ?? "",
    slug: item.slug ?? "",
    default_unit: item.default_unit ?? "",
    description: item.description ?? "",
    status: item.status ?? PRODUCT_MASTER_STATUS.ACTIVE,
    sort_order: item.sort_order ?? 0,
    category_id: item.category?.id ?? null,
    category_name: item.category?.name ?? "—",
    category_scope: item.category?.scope ?? "",
    seasons,
    season_ids: seasons.map((season) => String(season.id)),
    season_label: formatSeasonLabel(seasons),
  };
}

export function formatProductMasterDetail(detail) {
  const seasons = normalizeProductMasterSeasons(detail.seasons);
  return {
    id: detail.id,
    name: detail.name ?? "",
    slug: detail.slug ?? "",
    default_unit: detail.default_unit ?? "",
    description: detail.description ?? "",
    status: detail.status ?? PRODUCT_MASTER_STATUS.ACTIVE,
    sort_order: detail.sort_order ?? 0,
    category_id: detail.category?.id ?? null,
    category_name: detail.category?.name ?? "—",
    category: detail.category ?? null,
    seasons,
    season_ids: seasons.map((season) => String(season.id)),
    season_label: formatSeasonLabel(seasons),
  };
}

export function buildProductMasterPayload({
  category_id,
  name,
  default_unit,
  description,
  sort_order,
  status,
  season_ids = [],
}) {
  const payload = {
    category: Number(category_id),
    name: name.trim(),
    default_unit: default_unit.trim(),
    description: description.trim(),
    sort_order: Number(sort_order) || 0,
    season_ids: (Array.isArray(season_ids) ? season_ids : [])
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id) && id > 0),
  };

  if (status) {
    payload.status = status;
  }

  return payload;
}
