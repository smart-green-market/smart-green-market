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
2. Duyệt danh mục & sản phẩm (không cần đăng nhập) — mục 3 bên dưới
3. Chưa có TK tại cửa hàng này → POST .../register/
4. Đã có TK → POST .../login/
5. Lưu access + refresh token
6. Gọi API me, addresses với cùng {slug} trong URL
```

---

## 3. Catalog sản phẩm (public — không cần token)

Buyer có thể xem danh mục, tìm kiếm và chi tiết sản phẩm **trước khi** đăng ký/đăng nhập.

### Danh mục

```http
GET /api/storefronts/rau-sach-abc/categories/?page=1&page_size=20
```

Trả **tất cả** danh mục `active` của cửa hàng (system + custom đại lý), kèm `product_count` (số SP `active` trong từng danh mục). Frontend có thể dùng `product_count` để lọc hoặc disable danh mục rỗng; lọc SP theo danh mục: `GET .../products/?category={id}`.

### Danh sách & tìm kiếm sản phẩm

```http
GET /api/storefronts/rau-sach-abc/products/?page=1&page_size=20
GET /api/storefronts/rau-sach-abc/products/?category=3
GET /api/storefronts/rau-sach-abc/products/?search=rau%20muong
GET /api/storefronts/rau-sach-abc/products/?in_stock=true&ordering=price
```

| Query param | Mô tả |
|-------------|--------|
| `category` | Lọc theo ID danh mục |
| `search` hoặc `q` | Tìm theo tên SP, mô tả, tên NCC, tên danh mục |
| `in_stock` | `true` — chỉ SP còn tồn khả dụng |
| `ordering` | `price`, `-price`, `name`, `-name`, `updated_at`, `-updated_at`, `stock`, `-stock` |

Response mỗi sản phẩm gồm: `retail_price`, `thumbnail`, `images[]`, `category`, `unit`, `available_quantity`, `in_stock`.

### Chi tiết sản phẩm

```http
GET /api/storefronts/rau-sach-abc/products/12/
```

Thêm so với list: `supplier_product_name`, `supplier_name`, `storage_duration_days`, `min_storage_temp`, `max_storage_temp`.

**Lỗi:** `404` nếu gian hàng chưa active hoặc sản phẩm không thuộc cửa hàng / không còn bán.

---

## 4. Đăng ký buyer

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

## 5. Đăng nhập buyer

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

## 6. Làm mới token

```http
POST /api/refresh/
Content-Type: application/json

{
  "refresh": "<jwt_refresh>"
}
```

---

## 7. Xem / cập nhật hồ sơ

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

Response `/me/` trả `avatar_url` trong `customer_profile.user`:

```json
{
  "user": {
    "id": 101,
    "email": "buyer@gmail.com",
    "full_name": "Nguyen Van A",
    "avatar_url": "http://localhost:8000/media/avatars/buyer.png",
    "role": "buyer",
    "store_dealer_slug": "rau-sach-abc"
  }
}
```

Upload avatar dùng endpoint account chung:

```http
POST /api/profile/avatar/
Authorization: Bearer {access}
Content-Type: multipart/form-data

avatar=<file>
```

Xóa avatar:

```http
DELETE /api/profile/avatar/
Authorization: Bearer {access}
```

---

## 8. Quản lý địa chỉ

```http
GET /api/storefronts/rau-sach-abc/addresses/
POST /api/storefronts/rau-sach-abc/addresses/
PATCH /api/storefronts/rau-sach-abc/addresses/{id}/
DELETE /api/storefronts/rau-sach-abc/addresses/{id}/
```

Tất cả cần header `Authorization: Bearer {access}`.

---

## 9. Đại lý xem tệp khách hàng

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

## 10. Checklist frontend

| Bước | Việc cần làm |
|------|----------------|
| 1 | Route `/cua-hang/:dealerSlug/*` |
| 2 | Gọi catalog (`categories`, `products`) không cần token |
| 3 | Auth context theo slug |
| 4 | Register/Login đúng `.../storefronts/{slug}/...` |
| 5 | Header Authorization trên API protected |
| 6 | Không gọi `POST /api/register/` với role buyer |

---

## 11. Swagger

Mở `/api/docs/` — tag: **Storefront Catalog**, **Storefront Auth**, **Storefront Customer**, **Storefront Addresses**, **Dealer Customers**.
