# Customer Storefront — Hướng dẫn sử dụng API

Hướng dẫn tích hợp buyer trên **gian hàng riêng của từng đại lý**.

---

## 1. Điều kiện tiên quyết

- Đại lý đã được admin duyệt (`status=active`).
- Đại lý có `slug` (URL công khai), ví dụ: `rau-sach-abc`.
- Frontend biết `dealer_slug` từ đường dẫn: `/cua-hang/rau-sach-abc`.

---

## 2. Luồng buyer cơ bản

```text
1. Mở link đại lý → /cua-hang/{slug}
2. Chưa có TK tại cửa hàng này → POST .../register/
3. Đã có TK → POST .../login/
4. Lưu access + refresh token
5. Gọi API me, addresses với cùng {slug} trong URL
```

**Quan trọng:** Token lấy tại đại lý A **không** dùng được API của đại lý B.

---

## 3. Đăng ký buyer

```http
POST /api/storefronts/rau-sach-abc/register/
Content-Type: application/json

{
  "email": "buyer@gmail.com",
  "password": "12345678",
  "repassword": "12345678",
  "full_name": "Nguyen Van A",
  "phone": "0901234567"
}
```

**Response 201:** trả `access`, `refresh`, `account`, `customer_profile`, `store_dealer`.

**Lỗi thường gặp:**

| Mã | Nguyên nhân |
|----|-------------|
| 400 | Email đã đăng ký **tại cửa hàng này** |
| 400 | Mật khẩu xác nhận không khớp |
| 400 | Gian hàng không tồn tại / chưa active |

**Cùng email tại đại lý khác:** đăng ký lại bình thường tại slug khác → tạo `Account` mới.

---

## 4. Đăng nhập buyer

```http
POST /api/storefronts/rau-sach-abc/login/
Content-Type: application/json

{
  "email": "buyer@gmail.com",
  "password": "12345678"
}
```

**Response 200:** cùng cấu trúc với register.

Không dùng `POST /api/login/` cho buyer storefront.

---

## 5. Làm mới token

```http
POST /api/refresh/
Content-Type: application/json

{
  "refresh": "<jwt_refresh>"
}
```

---

## 6. Xem / cập nhật hồ sơ

```http
GET /api/storefronts/rau-sach-abc/me/
Authorization: Bearer {access}
```

```http
PATCH /api/storefronts/rau-sach-abc/me/
Authorization: Bearer {access}
Content-Type: application/json

{
  "favorite_category": 3
}
```

---

## 7. Quản lý địa chỉ

```http
GET /api/storefronts/rau-sach-abc/addresses/
POST /api/storefronts/rau-sach-abc/addresses/
PATCH /api/storefronts/rau-sach-abc/addresses/{id}/
DELETE /api/storefronts/rau-sach-abc/addresses/{id}/
```

Tất cả cần header `Authorization: Bearer {access}`.

---

## 8. Đại lý xem tệp khách hàng

Đăng nhập dealer qua `POST /api/login/`.

**Lấy link gian hàng để gửi cho buyer:**

```http
GET /api/dealers/me/storefront-link/
Authorization: Bearer {dealer_access}
```

Response:

```json
{
  "dealer_id": 5,
  "store_name": "Rau Sach ABC",
  "slug": "rau-sach-abc",
  "status": "active",
  "storefront_path": "/cua-hang/rau-sach-abc",
  "storefront_url": "http://localhost:5173/cua-hang/rau-sach-abc",
  "can_share": true
}
```

Backend sinh `storefront_url` từ biến môi trường:

```env
STOREFRONT_BASE_URL=https://smartgreenmarket.vn
```

Nếu chưa cấu hình, mặc định là `http://localhost:5173`.

```http
GET /api/dealer-customers/
GET /api/dealer-customers/{id}/
PATCH /api/dealer-customers/{id}/   # body: { "note": "..." }
```

---

## 9. Checklist frontend

| Bước | Việc cần làm |
|------|----------------|
| 1 | Route `/cua-hang/:dealerSlug/*` |
| 2 | Auth context theo slug |
| 3 | Register/Login đúng `.../storefronts/{slug}/...` |
| 4 | Header Authorization trên API protected |
| 5 | Không gọi `POST /api/register/` với role buyer |

---

## 10. Swagger

Mở `/api/docs/` — tag: **Storefront Auth**, **Storefront Customer**, **Storefront Addresses**, **Dealer Customers**.
