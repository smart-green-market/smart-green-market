# Hướng dẫn UI — Nghiệp vụ mua hàng (Dealer ↔ Supplier)

Tài liệu A→Z cho frontend: API nào gọi, khi nào, trạng thái nào, role nào.

**Base URL:** `/api/`  
**Auth:** `Authorization: Bearer <access_token>` (trừ login/register)

---

## 1. Tổng quan vai trò

| Role | Màn hình chính |
|------|----------------|
| **dealer** | Tạo phiếu, thanh toán, nhận hàng, hủy (một số trạng thái) |
| **supplier** | Xác nhận/từ chối phiếu, duyệt CK, giao hàng |
| **admin** | Xem tất cả, hủy đơn |

**Điều kiện tiên quyết dealer:**
- `account.status === "active"`
- Có `dealer_profile` với `status === "active"`

**Điều kiện supplier:**
- Sản phẩm `status === "active"` và có `wholesale_price`
- Đã cấu hình TK ngân hàng (`account_number`, `account_name`, `bank_bin` hoặc `bank_name` chuẩn) để VietQR hoạt động

---

## 2. Sơ đồ trạng thái

```text
                    ┌──────────────────────────────────────┐
                    │  pending_supplier_confirmation       │ ← Dealer tạo phiếu
                    └───────────────┬──────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     │                     ▼
        rejected               confirmed              cancelled
     (terminal NCC)                │
                                   ▼
                    ┌──────────────────────────┐
                    │  Dealer: GET payment-qr   │  (deposit)
                    │  POST submit-deposit      │
                    └──────────────┬───────────┘
                                   ▼
                    deposit_pending_verification
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
            Supplier verify OK              Supplier verify FAIL
                    │                             │
                    ▼                             └──→ confirmed (thử lại)
               processing
                    │
                    ▼ POST ship
               shipping
                    │
                    ▼ POST confirm-delivery (dealer)
               delivered
                    │
                    ▼ GET payment-qr (final_payment)
                    ▼ POST submit-final-payment
                    │
                    ▼
        final_payment_pending_verification
                    │
                    ▼ Supplier verify OK
               completed (terminal)
```

---

## 3. Bảng trạng thái (`status`)

| Giá trị | Tiếng Việt | Ai thấy hành động |
|---------|------------|-------------------|
| `pending_supplier_confirmation` | Chờ NCC xác nhận | Supplier: Confirm / Reject. Dealer: Cancel |
| `rejected` | NCC từ chối | Chỉ xem (`rejection_reason`) |
| `confirmed` | Đã xác nhận | Dealer: QR cọc + Submit deposit. Dealer: Cancel |
| `deposit_pending_verification` | Chờ duyệt cọc | Supplier: Verify payment |
| `processing` | Chuẩn bị hàng | Supplier: Ship |
| `shipping` | Đang giao | Dealer: Confirm delivery |
| `delivered` | Đã giao | Dealer: QR cuối + Submit final payment |
| `final_payment_pending_verification` | Chờ duyệt TT cuối | Supplier: Verify payment |
| `completed` | Hoàn tất | Chỉ xem |
| `cancelled` | Đã hủy | Chỉ xem |

> `deposit_paid` có trong model nhưng API chuyển thẳng sang `processing` khi duyệt cọc — UI không cần xử lý riêng.

---

## 4. API reference theo bước nghiệp vụ

### Bước 0 — Chuẩn bị dữ liệu (dealer)

| Mục đích | API | Ghi chú |
|----------|-----|---------|
| Danh sách NCC | `GET /api/suppliers/` | Chọn `supplier_id` |
| Sản phẩm của NCC | `GET /api/supplier-products/?supplier_id={id}` | Chỉ lấy `status=active`, có `wholesale_price` |
| Cấu hình hệ thống | `GET /api/system-config/` | `default_deposit_percent` = 30 |

---

### Bước 1 — Dealer tạo phiếu nhập

```
POST /api/purchase-orders/
Role: dealer
```

**Body** — một lần gửi có thể gồm SP từ **nhiều NCC** (không cần `supplier_id`):

```json
{
  "delivery_address": "123 Kho DL, Q1, HCM",
  "requested_delivery_time": "2026-06-15T08:00:00+07:00",
  "receiver_name": "Nguyen Van A",
  "receiver_phone": "0901234567",
  "note": "",
  "items": [
    { "supplier_product_id": 5, "quantity": "50", "note": "" },
    { "supplier_product_id": 12, "quantity": "30", "note": "" }
  ]
}
```

> `supplier_product_id` 5 thuộc NCC A, 12 thuộc NCC B → backend tạo **2 phiếu** riêng.

**Response 201:**

```json
{
  "orders": [
    { "id": 101, "order_code": "PN-...", "supplier": 1, "status": "pending_supplier_confirmation", "..." : "..." },
    { "id": 102, "order_code": "PN-...", "supplier": 2, "status": "pending_supplier_confirmation", "..." : "..." }
  ]
}
```

**Legacy:** vẫn có thể gửi `supplier_id` khi chỉ đặt một NCC — mọi dòng `items` phải thuộc NCC đó.

**Sau khi thành công:** mỗi phiếu `status = pending_supplier_confirmation`, có `order_code`, `total_amount`.

**UI:** Hiển thị danh sách phiếu vừa tạo / chuyển màn danh sách chờ NCC.

---

### Bước 2 — Supplier xác nhận hoặc từ chối

**Danh sách phiếu chờ:**
```
GET /api/purchase-orders/
Role: supplier — tự lọc đơn của mình; ưu tiên `pending_supplier_confirmation` lên đầu
```

**Chi tiết:**
```
GET /api/purchase-orders/{id}/
```

Response có `items[]` kèm `daily_production_capacity` — UI có thể cảnh báo nếu `quantity` > capacity (chỉ hiển thị, API không chặn).

**Xác nhận:**
```
POST /api/purchase-orders/{id}/confirm/
Role: supplier
```
```json
{
  "deposit_percent": 30,
  "note": ""
}
```
`deposit_percent` optional — mặc định 30.

**Sau confirm:** `status = confirmed`, có `deposit_amount`, `supplier_bank`.

**Từ chối:**
```
POST /api/purchase-orders/{id}/reject/
Role: supplier
```
```json
{ "rejection_reason": "Không đủ năng lực thu hoạch kịp ngày giao" }
```

---

### Bước 3 — Dealer thanh toán cọc

**Điều kiện UI:** `status === "confirmed"`

**1. Lấy QR VietQR:**
```
GET /api/purchase-orders/{id}/payment-qr/?payment_type=deposit
Role: dealer
```
→ Hiển thị `qr_image_url`, `amount`, `transfer_content`, thông tin TK.  
Chi tiết: [VIETQR_PAYMENT.md](./VIETQR_PAYMENT.md)

**2. Sau khi chuyển khoản — gửi biên lai:**
```
POST /api/purchase-orders/{id}/submit-deposit/
Role: dealer
Content-Type: multipart/form-data
```

| Field | Type | Required |
|-------|------|----------|
| payment_method | string | `bank_transfer` / `cash` / `e_wallet` |
| payment_provider | string | optional, vd. `VCB` |
| transaction_code | string | optional |
| receipt_file | file | **required** |
| note | string | optional |
| paid_at | datetime | optional |

**Sau submit:** `status = deposit_pending_verification`, thêm 1 phần tử trong `payments[]` với `payment_type=deposit`, `status=pending`.

---

### Bước 4 — Supplier duyệt tiền cọc

**Điều kiện UI:** `status === "deposit_pending_verification"`

Lấy `payment_id` từ `payments` where `payment_type=deposit` AND `status=pending`.

```
POST /api/purchase-orders/{id}/verify-payment/
Role: supplier
```
```json
{
  "payment_id": 3,
  "status": "verified"
}
```
hoặc từ chối:
```json
{
  "payment_id": 3,
  "status": "rejected",
  "rejection_reason": "Số tiền không khớp"
}
```

| Kết quả | Trạng thái mới |
|---------|----------------|
| verified | `processing`, `paid_amount` tăng |
| rejected | `confirmed` — dealer làm lại bước 3 |

---

### Bước 5–6 — Supplier chuẩn bị & giao hàng

**Điều kiện ship:** `status === "processing"`

```
POST /api/purchase-orders/{id}/ship/
Role: supplier
```
```json
{ "note": "Đang giao trong ngày" }
```

**Sau ship:** `status = shipping`

---

### Bước 7 — Dealer xác nhận nhận hàng

**Điều kiện:** `status === "shipping"`

```
POST /api/purchase-orders/{id}/confirm-delivery/
Role: dealer
```
```json
{ "note": "Đã nhận đủ hàng" }
```

**Sau confirm:** `status = delivered`, `delivered_at` có giá trị.

---

### Bước 8 — Dealer thanh toán phần còn lại

**Điều kiện:** `status === "delivered"`

**1. QR:**
```
GET /api/purchase-orders/{id}/payment-qr/?payment_type=final_payment
```

**2. Submit biên lai:**
```
POST /api/purchase-orders/{id}/submit-final-payment/
```
(cùng format multipart như `submit-deposit`)

**Sau submit:** `status = final_payment_pending_verification`

---

### Bước 9 — Supplier duyệt thanh toán cuối

**Điều kiện:** `status === "final_payment_pending_verification"`

```
POST /api/purchase-orders/{id}/verify-payment/
```
```json
{
  "payment_id": 4,
  "status": "verified"
}
```

**Sau verified:** `status = completed`, `completed_at` set, tự nhập kho dealer (`dealer_inventory_batches`).

---

### Hủy phiếu

```
POST /api/purchase-orders/{id}/cancel/
Role: dealer (pending_supplier_confirmation, confirmed) hoặc admin (non-terminal)
```
```json
{ "note": "Đặt nhầm" }
```

---

## 5. API đọc dùng chung

### Danh sách phiếu

```
GET /api/purchase-orders/?page=1&page_size=20
```

**Response:**
```json
{
  "count": 50,
  "next": "...",
  "previous": null,
  "page": 1,
  "page_size": 20,
  "has_more": true,
  "results": [
    {
      "id": 12,
      "order_code": "PN-20260610-0001-0001",
      "supplier": 1,
      "supplier_name": "Cong ty ABC",
      "dealer": 2,
      "dealer_name": "Cua hang DL 1",
      "status": "confirmed",
      "total_amount": "20000000.00",
      "deposit_amount": "6000000.00",
      "paid_amount": "0.00",
      "debt_amount": "20000000.00",
      "requested_delivery_time": "...",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

### Chi tiết phiếu

```
GET /api/purchase-orders/{id}/
```

Fields quan trọng cho UI:
- `status`, `supplier_bank`, `items[]`, `payments[]`, `status_histories[]`
- `deposit_percent`, `deposit_amount`, `paid_amount`, `debt_amount`
- `rejection_reason` (khi rejected)

---

## 6. Ma trận UI theo trạng thái (Dealer)

| status | Nút / hành động UI |
|--------|-------------------|
| `pending_supplier_confirmation` | Chờ · **Hủy** |
| `rejected` | Xem lý do |
| `confirmed` | **Quét QR cọc** · **Gửi biên lai cọc** · Hủy |
| `deposit_pending_verification` | Chờ NCC duyệt CK |
| `processing` | Chờ NCC giao |
| `shipping` | **Xác nhận đã nhận hàng** |
| `delivered` | **Quét QR thanh toán cuối** · **Gửi biên lai** |
| `final_payment_pending_verification` | Chờ NCC duyệt |
| `completed` | Hoàn tất |
| `cancelled` | Đã hủy |

---

## 7. Ma trận UI theo trạng thái (Supplier)

| status | Nút / hành động UI |
|--------|-------------------|
| `pending_supplier_confirmation` | **Xác nhận** · **Từ chối** |
| `deposit_pending_verification` | **Duyệt cọc** (xem biên lai trong `payments`) |
| `processing` | **Bắt đầu giao hàng** |
| `final_payment_pending_verification` | **Duyệt thanh toán cuối** |
| Khác | Theo dõi |

---

## 8. Notifications — refresh UI khi đổi trạng thái

**Mỗi lần `status` phiếu đổi** (vd. `pending_supplier_confirmation` → `confirmed`), backend tự gửi notification cho **bên còn lại** (người thực hiện action không nhận — tránh trùng).

### API poll (khuyến nghị)

```
GET /api/notifications/my/
```

**Ví dụ item phiếu nhập:**
```json
{
  "receipt_id": 42,
  "id": 18,
  "title": "[Phiếu nhập] PN-20260610-0001-0001 — NCC đã xác nhận",
  "content": "Phiếu PN-20260610-0001-0001: Chờ NCC xác nhận → NCC đã xác nhận.",
  "type": "info",
  "reference_type": "purchase_order",
  "reference_id": 12,
  "reference_status": "confirmed",
  "reference_order_code": "PN-20260610-0001-0001",
  "read_at": null,
  "created_at": "..."
}
```

### Logic UI gợi ý

```text
1. Poll GET /api/notifications/my/ mỗi 15–30s (hoặc khi user mở app)
2. Nếu unread[] có item reference_type === "purchase_order":
   a. GET /api/purchase-orders/{reference_id}/  → cập nhật màn chi tiết
   b. Hoặc refresh list nếu đang ở danh sách phiếu
   c. POST /api/notifications/{id}/mark_read/ (optional)
3. Dùng reference_status để đổi badge / nút hành động ngay, không cần parse content
```

| `reference_status` | Dealer UI | Supplier UI |
|--------------------|-----------|-------------|
| `pending_supplier_confirmation` | Chờ | Nút Confirm/Reject |
| `confirmed` | QR cọc + Submit deposit | — |
| `deposit_pending_verification` | Chờ | Duyệt payment |
| `processing` | Chờ giao | Nút Ship |
| `shipping` | Nút Confirm delivery | — |
| `delivered` | QR cuối + Submit final | — |
| `final_payment_pending_verification` | Chờ | Duyệt payment |
| `completed` | Hoàn tất | Hoàn tất |

> WebSocket chưa có — dùng **polling** `notifications/my` hoặc refetch khi user click thông báo.

---

## 9. Polling / refresh gợi ý

| Màn hình | Gợi ý |
|----------|-------|
| Dealer chờ NCC | Poll `notifications/my` hoặc `GET /purchase-orders/{id}/` |
| Màn chi tiết phiếu đang mở | Khi `reference_id` trùng `id` đang xem → refetch detail |
| Supplier hàng chờ | `unread_count` badge + list phiếu pending |

---

## 10. Lỗi thường gặp

| Message | Xử lý UI |
|---------|----------|
| `Chưa có giá sỉ` | Ẩn sản phẩm hoặc báo liên hệ NCC |
| `Hồ sơ đại lý chưa active` | Redirect onboarding |
| `QR cọc chỉ khả dụng khi confirmed` | Ẩn nút QR, hiện trạng thái |
| `Không xác định được mã BIN` | Báo NCC cập nhật `bank_bin` trong hồ sơ |

---

## 11. Tài liệu liên quan

- [PURCHASE_ORDERS_MODULE.md](./PURCHASE_ORDERS_MODULE.md) — thiết kế model & migration
- [VIETQR_PAYMENT.md](./VIETQR_PAYMENT.md) — chi tiết VietQR
- Swagger: `/api/docs/` — tag **Purchase Orders**
