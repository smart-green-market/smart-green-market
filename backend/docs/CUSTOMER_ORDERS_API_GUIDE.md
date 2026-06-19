# Customer Orders API — Hướng dẫn tích hợp (Backend)

Module đơn hàng buyer B2C trên gian hàng đại lý. Thanh toán **COD**, phí ship **10.000 VND**, trừ tồn khi tạo đơn (`pending`).

---

## 1. Luồng trạng thái

```text
pending ── dealer confirm ──► confirmed ── start-processing ──► processing
                                                                    │
                                                              ship  │
                                                                    ▼
                                                               shipping
                                                                    │
                                                    buyer confirm-received
                                                                    ▼
                                                               completed
```

| Status | Ai thao tác | Mô tả |
|--------|-------------|--------|
| `pending` | Buyer (tạo đơn) | Đơn mới, tồn đã trừ |
| `confirmed` | Dealer | Đại lý xác nhận |
| `processing` | Dealer | Đang đóng gói |
| `shipping` | Dealer | Đang giao |
| `completed` | Buyer | Đã nhận hàng + COD paid |

---

## 2. Cấu hình công khai

### Checkout B2C (khuyến nghị)

```http
GET /api/customer-order-config/
```

**Auth:** Không cần.

```json
{
  "shipping_fee": 10000,
  "payment_type": "cod",
  "timezone": "Asia/Ho_Chi_Minh",
  "min_lead_hours": 6,
  "morning_cutoff_hour": 23,
  "max_booking_days": 2,
  "slots": [
    { "id": "morning", "name": "Sáng", "start_time": "07:00", "end_time": "09:00" },
    { "id": "afternoon", "name": "Chiều", "start_time": "16:00", "end_time": "19:00" }
  ]
}
```

> **Lưu ý:** `min_delivery_lead_days` trong `GET /api/purchase-order-config/` là rule **phiếu nhập NCC**, không áp dụng đơn buyer rau.

Admin xem tổng hợp (có thêm key lồng `customer_orders`, `purchase_orders`):

```http
GET /api/system-config/
```

**Quy tắc khung giờ giao rau (backend là nguồn xác thực):**

| Quy tắc | Giá trị |
|---------|---------|
| Múi giờ nghiệp vụ | `Asia/Ho_Chi_Minh` (+07) — Django `TIME_ZONE` vẫn UTC |
| Slot | `morning` 07:00, `afternoon` 16:00 |
| Lead time | Tối thiểu 6 giờ trước giờ bắt đầu slot |
| Cut-off sáng mai | Từ 23:00 hôm nay → không đặt slot `morning` ngày mai |
| Cửa sổ đặt | 2 ngày lịch: hôm nay và ngày mai |

---

## 3. API Buyer (Storefront)

**Base:** `/api/storefronts/{dealer_slug}/`  
**Auth:** JWT buyer (`Authorization: Bearer <access>`) — token phải khớp `dealer_slug`.

### 3.1. Khung giờ giao hàng khả dụng

```http
GET /api/storefronts/rau-sach-abc/delivery-slots/
```

**Auth:** Không cần (public).

**Response `200`:**

```json
{
  "timezone": "Asia/Ho_Chi_Minh",
  "min_lead_hours": 6,
  "morning_cutoff_hour": 23,
  "max_booking_days": 2,
  "slots": [
    { "id": "morning", "name": "Sáng", "start_time": "07:00", "end_time": "09:00" },
    { "id": "afternoon", "name": "Chiều", "start_time": "16:00", "end_time": "19:00" }
  ],
  "generated_at": "2026-06-21T08:00:00+07:00",
  "dates": [
    {
      "date": "2026-06-21",
      "slots": [
        {
          "id": "morning",
          "name": "Sáng",
          "start_time": "07:00",
          "end_time": "09:00",
          "available": false,
          "delivery_time": null
        },
        {
          "id": "afternoon",
          "name": "Chiều",
          "start_time": "16:00",
          "end_time": "19:00",
          "available": true,
          "delivery_time": "2026-06-21T16:00:00+07:00"
        }
      ]
    }
  ]
}
```

**Tích hợp FE:**
- Chỉ hiển thị slot có `available: true`.
- Khi checkout, gửi **`delivery_date` + `delivery_slot`** (không gửi `delivery_time`).
- **Không** tự tính slot trên FE — luôn gọi API này trước checkout.

| Body field | Lấy từ delivery-slots |
|------------|------------------------|
| `delivery_date` | `dates[].date` |
| `delivery_slot` | `dates[].slots[].id` (`morning` / `afternoon`) |

---

### 3.2. Đặt hàng

```http
POST /api/storefronts/rau-sach-abc/orders/
Content-Type: application/json
Authorization: Bearer <buyer_access_token>

{
  "items": [
    { "dealer_product_id": 12, "quantity": 2 },
    { "dealer_product_id": 15, "quantity": 1 }
  ],
  "customer_address_id": 3,
  "delivery_date": "2026-06-22",
  "delivery_slot": "morning",
  "note": "Giao buổi sáng"
}
```

> **Không gửi** `delivery_time` — backend tự resolve từ `delivery_date` + `delivery_slot`.

**Response `201`:** `OrderDetailSerializer` — `status=pending`, `shipping_fee=10000`, `payment_method="Thanh toán khi nhận hàng (COD)"`.

**Side effect:** Backend cập nhật `CustomerProfile.favorite_category` = danh mục có **tổng quantity** lớn nhất trong đơn (bỏ qua SP không có category).

**Lỗi thường gặp:**
- `400` — hết tồn, SP không active, địa chỉ không thuộc buyer, slot không còn khả dụng (`invalid_delivery_slot`)
- `403` — token không thuộc gian hàng
- `404` — slug không tồn tại

**Tích hợp FE (checkout):**
1. Lấy giỏ hàng (session/local).
2. `GET .../addresses/` chọn địa chỉ.
3. `GET .../delivery-slots/` chọn ngày + slot khả dụng.
4. Tính preview: `subtotal` từ `retail_price × quantity`, `shipping_fee=10000`, `total=subtotal+10000`.
5. `POST .../orders/` với `items[]` từ giỏ + khung giờ đã chọn.
6. Redirect tới trang chi tiết đơn / lịch sử đơn.

---

### 3.3. Danh sách đơn của tôi

```http
GET /api/storefronts/rau-sach-abc/orders/?page=1&page_size=20
GET /api/storefronts/rau-sach-abc/orders/?status=shipping
Authorization: Bearer <buyer_access_token>
```

**Response:** paginated `OrderListSerializer[]` — mỗi item có `delivery_time`, `delivery_date`, `delivery_slot`, `delivery_slot_name`.

**Tích hợp FE:** Trang lịch sử đơn — thay mock `userOrderService.getAll()` bằng endpoint này (cần truyền đúng `dealer_slug` từ URL cửa hàng).

---

### 3.4. Chi tiết đơn

```http
GET /api/storefronts/rau-sach-abc/orders/{id}/
Authorization: Bearer <buyer_access_token>
```

**Response:** `OrderDetailSerializer` gồm `delivery_time`, `delivery_date`, `delivery_slot`, `delivery_slot_name`, `items[]`, `status_histories[]`, `shipping_address`, `payments[]`.

**Map status FE → backend:**

| UI mock | Backend |
|---------|---------|
| `received` | `pending` |
| `preparing` | `processing` |
| `shipping` | `shipping` |
| `completed` | `completed` |

---

### 3.5. Xác nhận đã nhận hàng

```http
POST /api/storefronts/rau-sach-abc/orders/{id}/confirm-received/
Authorization: Bearer <buyer_access_token>
Content-Type: application/json

{ "note": "" }
```

**Điều kiện:** `status=shipping`  
**Kết quả:** `status=completed`, `delivered_at` + `completed_at` set, COD marked paid.

**Tích hợp FE:** Nút "Đã nhận hàng" trên trang theo dõi đơn — chỉ hiện khi `status === "shipping"`.

---

## 4. API Dealer

**Base:** `/api/customer-orders/`  
**Auth:** JWT dealer (`role=dealer`).

### 4.1. Danh sách đơn

```http
GET /api/customer-orders/?page=1&page_size=20
GET /api/customer-orders/?status=pending
Authorization: Bearer <dealer_access_token>
```

Đơn `pending` được ưu tiên lên đầu danh sách.

---

### 4.2. Chi tiết đơn

```http
GET /api/customer-orders/{id}/
Authorization: Bearer <dealer_access_token>
```

---

### 4.3. Xác nhận đơn

```http
POST /api/customer-orders/{id}/confirm/
Content-Type: application/json

{ "note": "Đã kiểm tra, còn hàng" }
```

`pending` → `confirmed`

---

### 4.4. Bắt đầu đóng gói

```http
POST /api/customer-orders/{id}/start-processing/
Content-Type: application/json

{ "note": "" }
```

`confirmed` → `processing`

---

### 4.5. Bàn giao vận chuyển

```http
POST /api/customer-orders/{id}/ship/
Content-Type: application/json

{ "note": "" }
```

`processing` → `shipping`

---

## 5. Thông báo

Khi status đổi, hệ thống gửi notification:
- `reference_type`: `customer_order`
- `reference_id`: ID đơn
- `reference_order_code`: mã đơn (khi gọi `GET /api/notifications/my/`)

Dealer nhận thông báo khi buyer đặt đơn (`pending`). Buyer nhận khi dealer confirm / ship / ...

---

## 6. Thứ tự tích hợp FE gợi ý

| Bước | API | Ghi chú |
|------|-----|---------|
| 1 | Catalog + addresses (đã có) | Điều kiện tiên quyết |
| 2 | `POST .../orders/` | Checkout |
| 3 | `GET .../orders/` | Lịch sử đơn buyer |
| 4 | `GET .../orders/{id}/` | Chi tiết + timeline |
| 5 | `POST .../confirm-received/` | Nút nhận hàng |
| 6 | `GET /api/customer-orders/` | Dashboard dealer |
| 7 | `confirm` → `start-processing` → `ship` | Luồng xử lý dealer |

---

## 7. File backend liên quan

| File | Vai trò |
|------|---------|
| `apps/orders/services.py` | State machine, trừ tồn, COD |
| `apps/orders/views.py` | Dealer ViewSet |
| `apps/orders/storefront_views.py` | Buyer API |
| `apps/orders/serializers.py` | Request/response |
| `apps/orders/notifications.py` | Push notification |
| `apps/customers/urls.py` | Route storefront orders |

---

## 8. Swagger

Xem tag **Storefront Orders** và **Customer Orders** tại `/api/docs/`.
