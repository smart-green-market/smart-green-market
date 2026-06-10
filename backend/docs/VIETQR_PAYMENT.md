# VietQR — Thanh toán phiếu nhập hàng

Tài liệu mô tả cách backend sinh QR chuyển khoản VietQR cho dealer khi thanh toán NCC.

---

## 1. Khi nào hiển thị QR

| Loại | Query `payment_type` | Trạng thái phiếu (`status`) | Số tiền trên QR |
|------|-------------------|----------------------------|----------------|
| Đặt cọc | `deposit` | `confirmed` | `deposit_amount` |
| Thanh toán cuối | `final_payment` | `delivered` | `debt_amount` |

Nội dung chuyển khoản (`transfer_content`) = `order_code` (vd. `PN-20260610-0001-0001`).

---

## 2. API

```
GET /api/purchase-orders/{id}/payment-qr/?payment_type=deposit
GET /api/purchase-orders/{id}/payment-qr/?payment_type=final_payment
```

**Auth:** Bearer token — role `dealer` (chủ phiếu) hoặc `admin`.

### Response 200

```json
{
  "qr_image_url": "https://img.vietqr.io/image/970436-0123456789-compact2.png?amount=6000000&addInfo=PN-20260610-0001-0001&accountName=CONG%20TY%20ABC",
  "bank_bin": "970436",
  "bank_name": "Vietcombank",
  "account_number": "0123456789",
  "account_name": "CONG TY ABC",
  "amount": "6000000.00",
  "transfer_content": "PN-20260610-0001-0001",
  "payment_type": "deposit",
  "order_id": 12,
  "order_code": "PN-20260610-0001-0001",
  "template": "compact2"
}
```

### UI — render QR

```html
<img src="{qr_image_url}" alt="VietQR" />
```

URL trỏ trực tiếp tới `img.vietqr.io` — không cần proxy backend.

### Lỗi thường gặp

| HTTP | Nguyên nhân |
|------|-------------|
| 400 | Sai `payment_type` hoặc sai `status` phiếu |
| 400 | NCC chưa cấu hình `account_number` / `account_name` |
| 400 | Không resolve được `bank_bin` từ tên ngân hàng |

---

## 3. API danh sách ngân hàng (UI select)

```
GET /api/banks/
GET /api/banks/?search=viet
```

**Không cần auth.** Dùng dropdown thay vì nhập tay `bank_name`.

### Response

```json
{
  "count": 20,
  "results": [
    {
      "code": "VCB",
      "name": "Vietcombank",
      "bin": "970436",
      "full_name": "Ngân hàng TMCP Ngoại thương Việt Nam"
    }
  ]
}
```

### Khi lưu hồ sơ NCC (`PATCH /api/suppliers/{id}/`)

Gửi từ item đã chọn:

```json
{
  "bank_bin": "970436",
  "bank_name": "Vietcombank",
  "account_number": "0123456789",
  "account_name": "CONG TY ABC"
}
```

Backend validate `bank_bin` có trong danh sách và `bank_name` khớp BIN.

Nguồn dữ liệu: `backend/common/banks.py` → `VIETQR_BANKS`.

---

## 4. Dữ liệu NCC cần có

| Field | Bắt buộc cho QR | Ghi chú |
|-------|-----------------|---------|
| `bank_bin` | Có | Chọn từ `/api/banks/` |
| `bank_name` | Có | = `item.name` tương ứng BIN |
| `account_number` | Có | Số TK nhận tiền |
| `account_name` | Có | Tên chủ TK (không dấu, viết hoa) |

---

## 5. Luồng UI gợi ý (dealer)

### Thanh toán cọc

1. Poll / mở chi tiết phiếu → `status === "confirmed"`
2. `GET .../payment-qr/?payment_type=deposit`
3. Hiển thị QR + số tiền + nội dung CK
4. Dealer chuyển khoản → upload biên lai → `POST .../submit-deposit/`

### Thanh toán cuối

1. `status === "delivered"`
2. `GET .../payment-qr/?payment_type=final_payment`
3. Hiển thị QR + `debt_amount`
4. `POST .../submit-final-payment/`

---

## 6. File liên quan

| File | Vai trò |
|------|---------|
| `common/banks.py` | Danh sách ngân hàng + BIN |
| `common/bank_views.py` | `GET /api/banks/` |
| `common/vietqr.py` | Sinh URL img.vietqr.io |
| `apps/purchase_orders/services.py` → `get_payment_qr` | Validate status + amount |
| `apps/purchase_orders/views.py` → `payment_qr` | Endpoint GET |
| `apps/suppliers/models.py` → `bank_bin` | BIN Napas |

---

## 7. Ghi chú kỹ thuật

- Dịch vụ VietQR (`img.vietqr.io`) là bên thứ ba — cần internet khi load ảnh QR.
- `amount` trên URL là số nguyên VND (không decimal).
- Template mặc định: `compact2` (có logo + đủ thông tin).
- QR **không** thay thế bước `submit-deposit` / `submit-final-payment` — dealer vẫn phải upload biên lai sau khi CK.
