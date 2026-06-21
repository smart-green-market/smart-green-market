# Module Phiếu nhập hàng (Purchase Orders) — Tài liệu review

Tài liệu tóm tắt các thay đổi đã triển khai theo nghiệp vụ **đại lý nhập hàng từ nhà cung cấp**, mô hình **supplier thu hoạch theo đơn và giao hàng** (không có kho phía supplier).

---

## 1. Quyết định thiết kế đã áp dụng

| Chủ đề | Quyết định |
|--------|------------|
| Kho supplier | **Không triển khai** — không có `supplier_inventory_batches` |
| Batch xuất kho supplier | **Bỏ** — `purchase_order_items` không có `supplier_batch_id` |
| Kho dealer | Giữ `dealer_inventory_batches`, nối FK tới `purchase_order_items` |
| Giá sỉ | Thêm `wholesale_price` trên `SupplierProduct`, snapshot vào `unit_price` khi tạo đơn (API sẽ làm sau) |
| Số lượng dòng đơn | `DecimalField` — hỗ trợ kg (50.5 kg) |
| `paid_amount` / `debt_amount` | Lưu trên `purchase_orders`, cập nhật khi verify payment (logic service/API chưa làm) |

---

## 2. App mới: `apps/purchase_orders`

Đăng ký trong `INSTALLED_APPS` (`config/settings.py`).

### 2.1. Bảng `purchase_orders`

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | PK | |
| `order_code` | varchar(50), unique | Mã phiếu nhập, sinh khi dealer gửi |
| `supplier_id` | FK → `supplier` | |
| `dealer_id` | FK → `dealer_profiles` | |
| `status` | varchar(40) | Xem mục 3 |
| `delivery_address` | text | |
| `requested_delivery_time` | timestamp | Ngày/giờ nhận mong muốn |
| `receiver_name` | varchar(255) | |
| `receiver_phone` | varchar(20) | |
| `note` | text | Ghi chú dealer |
| `rejection_reason` | text | **Mới** — NCC từ chối phiếu |
| `total_amount` | decimal(14,2) | |
| `deposit_percent` | decimal(5,2) | % cọc, gán khi NCC xác nhận |
| `deposit_amount` | decimal(14,2) | |
| `paid_amount` | decimal(14,2) | Tổng đã xác nhận thanh toán |
| `debt_amount` | decimal(14,2) | Còn phải trả |
| `confirmed_at` | timestamp, nullable | |
| `delivered_at` | timestamp, nullable | |
| `completed_at` | timestamp, nullable | |
| `created_at`, `updated_at` | timestamp | |

### 2.2. Bảng `purchase_order_items`

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | PK | |
| `purchase_order_id` | FK | |
| `supplier_product_id` | FK | |
| `quantity` | decimal(12,2) | |
| `unit_price` | decimal(12,2) | Snapshot từ `wholesale_price` |
| `subtotal` | decimal(14,2) | `quantity × unit_price` |
| `note` | text | |

**Đã bỏ so với DBML ban đầu:** `supplier_batch_id` (không kho supplier).

### 2.3. Bảng `purchase_order_payments`

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | PK | |
| `purchase_order_id` | FK | |
| `payment_method` | varchar | `cash`, `bank_transfer`, `e_wallet` |
| `payment_provider` | varchar | MB_BANK, MOMO, … |
| `transaction_code` | varchar | Mã GD / nội dung CK |
| `amount` | decimal(14,2) | |
| `payment_type` | varchar | `deposit`, `final_payment` |
| `status` | varchar | `pending`, `verified`, `rejected` |
| `receipt_file` | file | Biên lai upload |
| `verified_by` | FK → Account | Supplier xác nhận |
| `verified_at` | timestamp | |
| `rejection_reason` | text | |
| `note` | text | |
| `paid_at` | timestamp | Dealer khai báo đã chuyển |
| `created_at` | timestamp | |

### 2.4. Bảng `purchase_order_status_histories`

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | PK | |
| `purchase_order_id` | FK | |
| `old_status` | varchar(40) | |
| `new_status` | varchar(40) | |
| `note` | text | |
| `changed_by` | FK → Account | |
| `created_at` | timestamp | |

---

## 3. State machine trạng thái phiếu nhập

```text
PENDING_SUPPLIER_CONFIRMATION   ← Dealer gửi phiếu
        ↓
   REJECTED (terminal)          ← NCC từ chối (+ rejection_reason)
        ↓
    CONFIRMED                   ← NCC xác nhận (+ tính deposit)
        ↓
DEPOSIT_PENDING_VERIFICATION    ← Dealer upload biên lai cọc
        ↓
   DEPOSIT_PAID                 ← NCC verify cọc
        ↓
   PROCESSING                   ← Chuẩn bị / thu hoạch
        ↓
   SHIPPING                     ← Đang giao (không xuất kho supplier)
        ↓
   DELIVERED                    ← Dealer xác nhận nhận hàng
        ↓
FINAL_PAYMENT_PENDING_VERIFICATION  ← Dealer thanh toán cuối
        ↓
   COMPLETED (terminal)         ← NCC verify cuối → nhập kho dealer

CANCELLED (terminal) — ai được hủy ở trạng thái nào: chưa định nghĩa API
```

**Lưu ý:** `FINAL_PAYMENT_PAID` chỉ là trạng thái **payment** (`purchase_order_payments.status = verified`), không phải status đơn.

---

## 4. Thay đổi trên model hiện có

### 4.1. `SupplierProduct` (`supplier_products`)

| Thay đổi | Chi tiết |
|----------|----------|
| **Thêm** `wholesale_price` | `DecimalField(12,2)`, nullable — giá bán sỉ cho đại lý |

Migration: `supplier_products/0006_supplierproduct_wholesale_price.py`

### 4.2. `DealerInventoryBatch` (`dealer_products`)

| Trước | Sau |
|-------|-----|
| `purchase_order_item_id` (PositiveIntegerField) | `purchase_order_item` (FK → `purchase_order_items`, SET_NULL) |

Dùng khi phiếu `COMPLETED`: tạo lô tồn kho dealer từ dòng đơn (logic service chưa làm).

Migrations:
- `dealer_products/0002_remove_dealerinventorybatch_purchase_order_item_id.py`
- `dealer_products/0003_dealerinventorybatch_purchase_order_item.py`

### 4.3. `Supplier` (không đổi trong task này)

Đã có sẵn `bank_name`, `account_number`, `account_name` — dùng hiển thị thông tin CK khi dealer đặt cọc.

### 4.4. Thông báo (`common/notification_messages.py`)

| Thay đổi | Chi tiết |
|----------|----------|
| **Thêm** `purchase_order` | Nhãn reference_type cho notification |

---

## 5. Mapping nghiệp vụ ↔ dữ liệu

| Bước | Hành động | Trạng thái đơn | Bảng ghi nhận |
|------|-----------|----------------|---------------|
| 1 | Dealer gửi phiếu | `pending_supplier_confirmation` | `purchase_orders`, `purchase_order_items` |
| 2a | NCC xác nhận | `confirmed` | `status_histories`, set `deposit_*` |
| 2b | NCC từ chối | `rejected` | `rejection_reason` |
| 3 | Dealer gửi biên lai cọc | `deposit_pending_verification` | `purchase_order_payments` (deposit, pending) |
| 4 | NCC verify cọc | `deposit_paid` → `processing` | payment verified, cập nhật `paid_amount` |
| 5 | Chuẩn bị hàng | `processing` | — |
| 6 | Giao hàng | `shipping` | Không gán batch supplier |
| 7 | Dealer nhận hàng | `delivered` | `delivered_at` |
| 8 | Dealer thanh toán cuối | `final_payment_pending_verification` | payment final_payment, pending |
| 9 | NCC verify cuối | `completed` | `completed_at`, tạo `dealer_inventory_batches` |

---

## 6. API đã triển khai (`/api/purchase-orders/`)

| Method | Endpoint | Role | Mô tả |
|--------|----------|------|--------|
| GET | `/api/purchase-orders/` | Admin / Supplier / Dealer | Danh sách (lọc theo role) |
| POST | `/api/purchase-orders/` | Dealer | Tạo phiếu nhập (tự tách theo NCC nếu giỏ nhiều NCC) |
| GET | `/api/purchase-orders/{id}/` | Admin / Supplier / Dealer | Chi tiết (+ bank NCC, items, payments, history) |
| POST | `/api/purchase-orders/{id}/confirm/` | Supplier | Xác nhận (+ `deposit_percent`, mặc định 30%) |
| POST | `/api/purchase-orders/{id}/reject/` | Supplier | Từ chối (`rejection_reason`) |
| GET | `/api/purchase-orders/{id}/payment-qr/` | Dealer / Admin | QR VietQR (`?payment_type=deposit\|final_payment`) |
| POST | `/api/purchase-orders/{id}/submit-deposit/` | Dealer | Upload biên lai cọc (multipart) |
| POST | `/api/purchase-orders/{id}/verify-payment/` | Supplier | Xác nhận/từ chối payment (`payment_id`, `status`) |
| POST | `/api/purchase-orders/{id}/ship/` | Supplier | `processing` → `shipping` |
| POST | `/api/purchase-orders/{id}/confirm-delivery/` | Dealer | `shipping` → `delivered` |
| POST | `/api/purchase-orders/{id}/submit-final-payment/` | Dealer | Upload biên lai thanh toán cuối |
| POST | `/api/purchase-orders/{id}/cancel/` | Dealer / Admin | Hủy phiếu |

### Quyết định API (đã chốt)

| Câu hỏi | Quyết định |
|---------|------------|
| `deposit_paid` vs `processing` | Verify cọc → chuyển thẳng `processing` |
| `deposit_percent` | Mặc định **30%** (`DEFAULT_DEPOSIT_PERCENT`), NCC override khi confirm |
| `wholesale_price` | **Bắt buộc** trước khi dealer đặt |
| Hủy đơn | Dealer: `pending_supplier_confirmation`, `confirmed`. Admin: mọi trạng thái chưa terminal |
| `order_code` | `PN-{YYYYMMDD}-{dealer_id:04d}-{seq:04d}` |
| Nhập kho dealer | Tự động khi verify thanh toán cuối → `completed` |

### Body tạo phiếu (ví dụ)

```json
{
  "delivery_address": "123 Kho DL, Q1, HCM",
  "requested_delivery_time": "2026-06-15T08:00:00+07:00",
  "receiver_name": "Nguyen Van A",
  "receiver_phone": "0901234567",
  "note": "Giao buổi sáng",
  "items": [
    { "supplier_product_id": 5, "quantity": "50", "note": "" },
    { "supplier_product_id": 12, "quantity": "30", "note": "" }
  ]
}
```

Response: `{ "orders": [ {...}, {...} ] }` — mỗi NCC một phiếu. `supplier_id` optional (legacy một NCC).

## 7. Tài liệu UI & VietQR

- [PURCHASE_ORDERS_UI_GUIDE.md](./PURCHASE_ORDERS_UI_GUIDE.md) — hướng dẫn A→Z cho frontend
- [VIETQR_PAYMENT.md](./VIETQR_PAYMENT.md) — chi tiết VietQR

## 8. Chưa triển khai

| Hạng mục | Mô tả |
|----------|--------|
| Frontend | Màn hình phiếu nhập |
| Cảnh báo năng lực SX | So sánh `quantity` vs `daily_production_capacity` (chỉ hiển thị, chưa chặn) |
| Partial delivery | Nhận thiếu hàng |

---

## 9. Migration

```bash
cd backend
python manage.py migrate purchase_orders supplier_products dealer_products
```

Thứ tự tự động:
1. `purchase_orders.0001_initial`
2. `supplier_products.0006_supplierproduct_wholesale_price`
3. `dealer_products.0002` → `0003` (phụ thuộc purchase_orders)

---

## 10. File đã tạo / sửa

| File | Loại thay đổi |
|------|----------------|
| `apps/purchase_orders/models.py` | **Mới** — 4 model |
| `apps/purchase_orders/admin.py` | **Mới** |
| `apps/purchase_orders/apps.py` | **Mới** |
| `apps/purchase_orders/migrations/0001_initial.py` | **Mới** |
| `apps/supplier_products/models.py` | Thêm `wholesale_price` |
| `apps/dealer_products/models.py` | FK `purchase_order_item` |
| `config/settings.py` | Thêm `apps.purchase_orders` |
| `common/notification_messages.py` | Thêm `purchase_order` label |
| `docs/PURCHASE_ORDERS_MODULE.md` | **Mới** — tài liệu này |

---

## 11. Checklist review

- [x] Verify cọc → `processing` (bỏ bước trung gian `deposit_paid` trên đơn)
- [x] `deposit_percent` mặc định 30% từ `system-config`
- [ ] `quantity` dealer inventory vẫn `integer` — PO dùng decimal, import kho `int(quantity)`
- [x] `wholesale_price` bắt buộc khi tạo đơn
- [x] Hủy đơn: dealer (pending/confirmed), admin (non-terminal)
