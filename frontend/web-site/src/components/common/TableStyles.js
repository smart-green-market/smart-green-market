// ── Shared DataTable styles (dùng chung cho mọi table trong Admin) ────────────
export const tableStyles = {
  tableWrapper: { style: { borderRadius: "0.75rem", overflow: "hidden" } },
  headRow: {
    style: {
      backgroundColor: "#f8f7f5",
      borderBottom: "1px solid #e5e5e5",
      minHeight: "48px",
    },
  },
  headCells: {
    style: {
      fontSize: "11px",
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: "0.07em",
      color: "#525252",
      fontFamily: "'Geist', sans-serif",
      paddingLeft: "24px",
      paddingRight: "24px",
    },
  },
  rows: {
    style: {
      minHeight: "64px",
      borderBottom: "1px solid #e5e5e5",
      fontFamily: "'Geist', sans-serif",
      "&:hover": { backgroundColor: "#fafaf9" },
    },
  },
  cells: {
    style: { paddingLeft: "24px", paddingRight: "24px" },
  },
  pagination: {
    style: {
      backgroundColor: "#f8f7f5",
      borderTop: "1px solid #e5e5e5",
      fontFamily: "'Geist', sans-serif",
      fontSize: "13px",
      color: "#525252",
      borderBottomLeftRadius: "0.75rem",
      borderBottomRightRadius: "0.75rem",
    },
    pageButtonsStyle: {
      borderRadius: "6px",
      height: "32px",
      width: "32px",
      color: "#404040",
      fill: "#404040",
      "&:hover:not(:disabled)": { backgroundColor: "#e7f3ef" },
      "&:focus": { outline: "none", backgroundColor: "#e7f3ef" },
    },
  },
  noData: {
    style: {
      padding: "48px",
      color: "#a3a3a3",
      fontFamily: "'Geist', sans-serif",
    },
  },
};

// ── Shared pagination Vietnamese text ─────────────────────────────────────────
export const paginationVi = {
  rowsPerPageText: "Hiển thị:",
  rangeSeparatorText: "trong",
  selectAllRowsItem: false,
};

// ── Shared status config ───────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  active: {
    label: "ĐANG HOẠT ĐỘNG",
    bg: "bg-teal-800/10",
    text: "text-teal-800",
  },
  paused: { label: "TẠM NGƯNG", bg: "bg-red-700/10", text: "text-red-700" },
  pending: { label: "ĐĂNG KÝ", bg: "bg-amber-500/10", text: "text-amber-500" },
};
