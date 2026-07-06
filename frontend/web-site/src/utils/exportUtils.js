import ExcelJS from "exceljs";
import { orderService } from "../services/api/orderService";

/**
 * Hàm hỗ trợ tự động căn chỉnh độ rộng cột và định dạng viền cho ô
 */
const formatWorksheet = (worksheet, doubleHeaderRowsCount = 4) => {
  // Thêm viền mỏng màu xám cho toàn bộ bảng dữ liệu
  worksheet.eachRow((row, rowNumber) => {
    // Không bo viền cho tiêu đề chính (dòng 1, 2, 3)
    if (rowNumber < doubleHeaderRowsCount) return;

    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } }
      };
      
      // Font mặc định
      cell.font = { name: "Segoe UI", size: 10 };
    });
  });

  // Tự động giãn cột
  worksheet.columns.forEach((column) => {
    let maxLength = 10;
    column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
      if (rowNumber < doubleHeaderRowsCount) return; // Bỏ qua tiêu đề lớn

      const valueStr = cell.value ? String(cell.value) : "";
      const cellLength = valueStr.split("").reduce((acc, char) => {
        return acc + (char.charCodeAt(0) > 128 ? 1.3 : 1);
      }, 0);
      if (cellLength > maxLength) {
        maxLength = cellLength;
      }
    });
    column.width = Math.min(Math.ceil(maxLength) + 5, 45); // Giới hạn max width 45
  });
};

/**
 * Tải file Excel trên trình duyệt
 */
const saveExcelFile = async (workbook, fileName) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Xuất danh sách sản phẩm ra Excel định dạng màu sắc Emerald đẹp mắt
 */
export const exportProductsToExcel = async (products) => {
  if (!products || products.length === 0) {
    alert("Không có dữ liệu sản phẩm để xuất!");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sản phẩm");

  // 1. Dòng tiêu đề chính
  const titleRow = worksheet.addRow(["DANH SÁCH SẢN PHẨM KIỂM KHO"]);
  worksheet.mergeCells("A1:I1");
  titleRow.height = 35;
  const titleCell = titleRow.getCell(1);
  titleCell.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FF064E3B" } }; // Dark Emerald
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  // 2. Dòng thông tin phụ
  const infoRow = worksheet.addRow([`Ngày xuất: ${new Date().toLocaleDateString("vi-VN")} | Hệ thống Smart Green Market`]);
  worksheet.mergeCells("A2:I2");
  infoRow.height = 20;
  const infoCell = infoRow.getCell(1);
  infoCell.font = { name: "Segoe UI", size: 10, italic: true, color: { argb: "FF6B7280" } };
  infoCell.alignment = { horizontal: "center", vertical: "middle" };

  // 3. Hàng trống
  worksheet.addRow([]);

  // 4. Header thực tế của bảng
  const headers = [
    "STT",
    "Tên sản phẩm",
    "Mã SKU",
    "Đơn vị tính",
    "Giá sỉ",
    "SL cần duyệt",
    "SL cần chuẩn bị",
    "Năng suất sản xuất",
    "Trạng thái"
  ];
  const headerRow = worksheet.addRow(headers);
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F3D20" } // Emerald đậm thương hiệu
    };
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  // 5. Thêm dữ liệu
  products.forEach((prod, index) => {
    let statusLabel = "Chờ duyệt";
    if (prod.status === "active") statusLabel = "Đang bán";
    if (prod.status === "inactive") statusLabel = "Đã khóa";
    if (prod.status === "rejected") statusLabel = "Từ chối";
    if (prod.status === "deleted") statusLabel = "Đã xóa";

    const rowData = [
      index + 1,
      prod.name || "—",
      prod.sku || "—",
      prod.unit || "kg",
      prod.wholesale_price ? Number(prod.wholesale_price) : 0,
      prod.pending_order_quantity != null ? Number(prod.pending_order_quantity) : 0,
      prod.preparation_quantity != null ? Number(prod.preparation_quantity) : 0,
      prod.daily_production_capacity != null ? `${prod.daily_production_capacity} kg/tháng` : "—",
      statusLabel
    ];

    const dataRow = worksheet.addRow(rowData);
    dataRow.height = 24;

    // Tô màu xen kẽ hàng (Zebra striping)
    if (index % 2 === 1) {
      dataRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF0FDF4" } // Emerald cực nhạt
        };
      });
    }

    // Căn lề và định dạng
    dataRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" }; // STT
    dataRow.getCell(2).alignment = { horizontal: "left", vertical: "middle" };   // Tên
    dataRow.getCell(3).alignment = { horizontal: "center", vertical: "middle" }; // SKU
    dataRow.getCell(4).alignment = { horizontal: "center", vertical: "middle" }; // Đơn vị
    
    // Giá sỉ
    const priceCell = dataRow.getCell(5);
    priceCell.numFmt = `#,##0"đ"`;
    priceCell.alignment = { horizontal: "right", vertical: "middle" };

    // SL cần duyệt
    const pendingCell = dataRow.getCell(6);
    pendingCell.numFmt = `#,##0`;
    pendingCell.alignment = { horizontal: "right", vertical: "middle" };

    // SL cần chuẩn bị
    const prepCell = dataRow.getCell(7);
    prepCell.numFmt = `#,##0`;
    prepCell.alignment = { horizontal: "right", vertical: "middle" };

    // Năng suất
    dataRow.getCell(8).alignment = { horizontal: "left", vertical: "middle" };
    
    // Trạng thái
    const statusCell = dataRow.getCell(9);
    statusCell.alignment = { horizontal: "center", vertical: "middle" };
    if (prod.status === "active") {
      statusCell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF166534" } };
    } else if (prod.status === "pending") {
      statusCell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF9A3412" } };
    }
  });

  // Tự động định dạng viền & độ rộng
  formatWorksheet(worksheet, 5);

  await saveExcelFile(workbook, `Danh_Sach_San_Pham_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/**
 * Xuất danh sách đơn hàng ra Excel với định dạng đẹp mắt và đầy đủ sản phẩm
 */
export const exportOrdersToExcel = async (orders) => {
  if (!orders || orders.length === 0) {
    alert("Không có dữ liệu đơn hàng để xuất!");
    return;
  }

  // Đang tải dữ liệu chi tiết
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Đơn hàng");

  // 1. Dòng tiêu đề chính
  const titleRow = worksheet.addRow(["DANH SÁCH GOM HÀNG VÀ CHUẨN BỊ THEO ĐƠN"]);
  worksheet.mergeCells("A1:L1");
  titleRow.height = 35;
  const titleCell = titleRow.getCell(1);
  titleCell.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FF064E3B" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  // 2. Dòng thông tin phụ
  const infoRow = worksheet.addRow([`Ngày xuất: ${new Date().toLocaleDateString("vi-VN")} | Hệ thống Smart Green Market`]);
  worksheet.mergeCells("A2:L2");
  infoRow.height = 20;
  const infoCell = infoRow.getCell(1);
  infoCell.font = { name: "Segoe UI", size: 10, italic: true, color: { argb: "FF6B7280" } };
  infoCell.alignment = { horizontal: "center", vertical: "middle" };

  // 3. Hàng trống
  worksheet.addRow([]);

  // 4. Header thực tế của bảng
  const headers = [
    "Mã đơn hàng",
    "Đại lý",
    "Ngày tạo",
    "Ngày giao mong muốn",
    "Tên sản phẩm",
    "SL cần chuẩn bị",
    "SL thực tế (Điền tay)",
    "Đơn vị tính",
    "Đơn giá",
    "Thành tiền",
    "Tổng đơn hàng",
    "Trạng thái"
  ];
  const headerRow = worksheet.addRow(headers);
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F3D20" }
    };
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending": return "Chờ xác nhận";
      case "confirmed": return "Đã xác nhận";
      case "processing": return "Đang xử lý";
      case "shipping": return "Đang giao hàng";
      case "completed": return "Hoàn thành";
      case "cancelled": return "Đã hủy";
      default: return status || "Chờ xử lý";
    }
  };

  // Tải thông tin chi tiết từng đơn hàng song song (để có đầy đủ items)
  const detailedOrders = await Promise.all(
    orders.map(async (order) => {
      const existingItems = extractOrderItems(order);
      if (existingItems && existingItems.length > 0) {
        return {
          ...order,
          items: existingItems.map(normalizeOrderItem)
        };
      }
      try {
        const detail = await orderService.getById(order.id);
        return detail || order;
      } catch (error) {
        console.error(`Không thể tải chi tiết đơn hàng ${order.id} để xuất Excel:`, error);
        return order;
      }
    })
  );

  let colorGroupIndex = 0; // Để tô màu nền xen kẽ theo từng ĐƠN HÀNG nguyên vẹn
  detailedOrders.forEach((order) => {
    const items = order.items || [];
    const isEvenOrder = colorGroupIndex % 2 === 1;
    colorGroupIndex++;

    if (items.length === 0) {
      const dataRow = worksheet.addRow([
        order.order_code || "—",
        order.dealer_name || "—",
        order.created_at ? new Date(order.created_at).toLocaleDateString("vi-VN") : "—",
        order.requested_delivery_time ? new Date(order.requested_delivery_time).toLocaleDateString("vi-VN") : "—",
        "—",
        0,
        "",
        "—",
        0,
        0,
        order.total_amount ? Number(order.total_amount) : 0,
        getStatusLabel(order.status)
      ]);
      dataRow.height = 24;

      if (isEvenOrder) {
        dataRow.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0FDF4" } };
        });
      }

      dataRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      dataRow.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
      dataRow.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
      dataRow.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
      dataRow.getCell(5).alignment = { horizontal: "left", vertical: "middle" };
      
      dataRow.getCell(6).numFmt = `#,##0`;
      dataRow.getCell(6).alignment = { horizontal: "right", vertical: "middle" };
      dataRow.getCell(7).alignment = { horizontal: "center", vertical: "middle" };
      dataRow.getCell(8).alignment = { horizontal: "center", vertical: "middle" };
      
      dataRow.getCell(9).numFmt = `#,##0"đ"`;
      dataRow.getCell(9).alignment = { horizontal: "right", vertical: "middle" };
      dataRow.getCell(10).numFmt = `#,##0"đ"`;
      dataRow.getCell(10).alignment = { horizontal: "right", vertical: "middle" };
      dataRow.getCell(11).numFmt = `#,##0"đ"`;
      dataRow.getCell(11).alignment = { horizontal: "right", vertical: "middle" };

      dataRow.getCell(12).alignment = { horizontal: "center", vertical: "middle" };
    } else {
      items.forEach((item, idx) => {
        const prodName = item.product_name || "—";
        const unit = item.product_unit || "kg";
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unit_price) || 0;

        const dataRow = worksheet.addRow([
          idx === 0 ? (order.order_code || "—") : "",
          idx === 0 ? (order.dealer_name || "—") : "",
          idx === 0 ? (order.created_at ? new Date(order.created_at).toLocaleDateString("vi-VN") : "—") : "",
          idx === 0 ? (order.requested_delivery_time ? new Date(order.requested_delivery_time).toLocaleDateString("vi-VN") : "—") : "",
          prodName,
          qty,
          "", // SL Thực tế
          unit,
          price,
          qty * price,
          idx === 0 ? (order.total_amount ? Number(order.total_amount) : 0) : "",
          idx === 0 ? getStatusLabel(order.status) : ""
        ]);
        dataRow.height = 24;

        // Tô màu đồng bộ cho cả đơn hàng
        if (isEvenOrder) {
          dataRow.eachCell((cell) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0FDF4" } };
          });
        }

        // Căn lề từng cột
        dataRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" }; // Code
        dataRow.getCell(2).alignment = { horizontal: "left", vertical: "middle" };   // Dealer
        dataRow.getCell(3).alignment = { horizontal: "center", vertical: "middle" }; // Ngày tạo
        dataRow.getCell(4).alignment = { horizontal: "center", vertical: "middle" }; // Ngày giao mong muốn
        dataRow.getCell(5).alignment = { horizontal: "left", vertical: "middle" };   // Sản phẩm
        
        // Số lượng cần
        const qtyCell = dataRow.getCell(6);
        qtyCell.numFmt = `#,##0`;
        qtyCell.alignment = { horizontal: "right", vertical: "middle" };

        dataRow.getCell(7).alignment = { horizontal: "center", vertical: "middle" }; // Thực tế điền tay
        dataRow.getCell(8).alignment = { horizontal: "center", vertical: "middle" }; // Đơn vị

        // Đơn giá
        const priceCell = dataRow.getCell(9);
        priceCell.numFmt = `#,##0"đ"`;
        priceCell.alignment = { horizontal: "right", vertical: "middle" };

        // Thành tiền
        const subtotalCell = dataRow.getCell(10);
        subtotalCell.numFmt = `#,##0"đ"`;
        subtotalCell.alignment = { horizontal: "right", vertical: "middle" };

        // Tổng đơn
        if (idx === 0) {
          const totalCell = dataRow.getCell(11);
          totalCell.numFmt = `#,##0"đ"`;
          totalCell.alignment = { horizontal: "right", vertical: "middle" };
          totalCell.font = { name: "Segoe UI", size: 10, bold: true };
        }

        // Trạng thái
        if (idx === 0) {
          const statusCell = dataRow.getCell(12);
          statusCell.alignment = { horizontal: "center", vertical: "middle" };
          statusCell.font = { name: "Segoe UI", size: 10, bold: true };
          if (order.status === "completed") {
            statusCell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF166534" } };
          }
        }
      });
    }
  });

  // Tự động định dạng viền & độ rộng
  formatWorksheet(worksheet, 5);

  await saveExcelFile(workbook, `Danh_Sach_Don_Hang_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
