import { useState, useMemo, useCallback } from "react";

/**
 * Hook tái sử dụng cho tính năng sắp xếp theo cột trên bảng dữ liệu.
 * 
 * @param {Array} data - Mảng dữ liệu cần sắp xếp.
 * @param {Object} columnConfig - Cấu hình loại dữ liệu cho từng cột.
 *   Mỗi key là tên cột, value là object { key, type }:
 *     - key: tên field trong data item
 *     - type: "string" | "number" | "date" | "currency"
 * @returns {{ sortedData, sortColumn, sortDirection, handleSort, SortIcon }}
 */
export default function useTableSort(data, columnConfig) {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const handleSort = useCallback((column) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortColumn(null);
        setSortDirection("asc");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }, [sortColumn, sortDirection]);

  const sortedData = useMemo(() => {
    if (!data || !sortColumn) return data || [];

    const config = columnConfig[sortColumn];
    if (!config) return data;

    const parseViDate = (dateStr) => {
      if (!dateStr || dateStr === "Chưa xác định") return 0;
      // Handle "dd/mm/yyyy" format
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime() || 0;
      }
      // Handle ISO strings
      const ts = new Date(dateStr).getTime();
      return isNaN(ts) ? 0 : ts;
    };

    const parseCurrency = (str) => {
      if (!str) return 0;
      return Number(String(str).replace(/[^\d]/g, "")) || 0;
    };

    const sorted = [...data].sort((a, b) => {
      const valA = a[config.key];
      const valB = b[config.key];
      let cmp = 0;

      switch (config.type) {
        case "string":
          cmp = (valA || "").localeCompare(valB || "", "vi");
          break;
        case "number":
          cmp = (Number(valA) || 0) - (Number(valB) || 0);
          break;
        case "date":
          cmp = parseViDate(valA) - parseViDate(valB);
          break;
        case "currency":
          cmp = parseCurrency(valA) - parseCurrency(valB);
          break;
        default:
          cmp = (valA || "").localeCompare(valB || "", "vi");
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [data, sortColumn, sortDirection, columnConfig]);

  return { sortedData, sortColumn, sortDirection, handleSort };
}
