import { tableStyles, paginationVi } from "../../common/TableStyles";

export { paginationVi };

export const supplierTableStyles = {
  ...tableStyles,
  headRow: {
    style: {
      ...tableStyles.headRow.style,
      minHeight: "52px",
    },
  },
  headCells: {
    style: {
      ...tableStyles.headCells.style,
      paddingTop: "14px",
      paddingBottom: "14px",
    },
  },
  rows: {
    style: {
      ...tableStyles.rows.style,
      minHeight: "72px",
    },
  },
  cells: {
    style: {
      ...tableStyles.cells.style,
      paddingTop: "16px",
      paddingBottom: "16px",
    },
  },
};
