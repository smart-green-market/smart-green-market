# Product Catalog — Hướng dẫn tích hợp UI

Catalog sản phẩm chuẩn (**Product Master**) + đăng bán NCC (**Supplier Product**).  
**Không có** luồng đề xuất/suggestion — master mới do **admin tự tạo**.

---

## 1. Khái niệm

| Khái niệm | Ai quản lý | Mục đích |
|-----------|------------|----------|
| **Category system** | Admin | Nhóm SP chuẩn (Rau, Củ…) |
| **Product Master** | Admin | Tên SP chuẩn trong catalog (Cà chua, Cải ngọt…) |
| **SupplierProduct** | NCC | Listing bán: giá sỉ, ảnh, mô tả, năng lực SX/ngày |
| **Category custom** | NCC | Nhãn phân loại riêng (Rau nhà kính…) |

**Lưu ý nghiệp vụ:**
- NCC **không có tồn kho** — field `daily_production_capacity` = năng lực sản xuất **mỗi ngày**
- Dealer catalog hiển thị **`SupplierProduct.name`**
- Duyệt SP: admin `POST /api/supplier-products/{id}/verify/` (như cũ)

---

## 2. Hai trường hợp NCC đăng sản phẩm

### Trường hợp 1 — Danh mục hệ thống + Product Master

Dùng khi SP đã có trong catalog chuẩn.

```
Chọn category (system)
    → GET /api/product-masters/?category_id=
    → Chọn product_master
    → Nhập giá, năng lực SX/ngày, ảnh, mô tả
    → POST /api/supplier-products/
    → Admin verify
```

- **Không** gửi `name`, `unit` — backend lấy từ master
- Dealer thấy tên master (vd. "Cà chua")

### Trường hợp 2 — Danh mục riêng NCC

Dùng khi muốn tên marketing riêng, hoặc dropdown chưa có món cần bán.

```
Chọn category (custom — NCC tự tạo)
    → Nhập name + unit
    → (Tuỳ chọn) chọn product_master link — thống kê/so sánh giá
    → Nhập giá, năng lực SX/ngày, ảnh, mô tả
    → POST /api/supplier-products/
    → Admin verify
```

- Dealer thấy **tên NCC** (vd. "Cà chua bi nhà kính loại A")
- `product_master` **optional**

**Dropdown không có SP?** → Dùng trường hợp 2 ngay, hoặc nhờ admin thêm master (mục 3).

---

## 3. Quy trình Admin

### 3.1. Chuẩn bị catalog (một lần / khi cần thêm SP chuẩn)

```http
GET  /api/categories/          # danh mục scope=system
POST /api/product-masters/     # tạo master mới
```

**Body tạo master:**
```json
{
  "category": 1,
  "name": "Cà chua",
  "default_unit": "kg",
  "description": "Cà chua loại phổ thông",
  "sort_order": 0
}
```

### 3.2. Duyệt listing NCC

```http
GET  /api/supplier-products/?status=pending
POST /api/supplier-products/{id}/verify/
Body: { "status": "active" }
```

---

## 4. API Product Catalog

**Swagger tag:** `Product Catalog`  
**Base:** `/api/product-masters/`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| GET | `/api/product-masters/` | Đăng nhập | Toàn bộ catalog (master active) |
| GET | `/api/product-masters/?category_id={id}` | Đăng nhập | Dropdown SP theo danh mục system |
| GET | `/api/product-masters/{id}/` | Đăng nhập | Chi tiết master |
| POST | `/api/product-masters/` | Admin | Tạo master |
| PATCH | `/api/product-masters/{id}/` | Admin | Sửa master |
| DELETE | `/api/product-masters/{id}/` | Admin | Xóa master |

**Response list (rút gọn):**
```json
{
  "results": [
    {
      "id": 5,
      "name": "Cà chua",
      "slug": "ca-chua",
      "default_unit": "kg",
      "category": { "id": 1, "name": "Rau", "scope": "system" },
      "status": "active"
    }
  ]
}
```

---

## 5. API Supplier Product (cập nhật)

**Swagger tag:** `Supplier Products`

### Trường hợp 1 — POST body

```http
POST /api/supplier-products/
Authorization: Bearer <supplier_token>
```

```json
{
  "category": 1,
  "product_master": 5,
  "wholesale_price": "20000.00",
  "daily_production_capacity": "100.00",
  "description": "Cà chua nhà kính"
}
```

Sau đó upload ảnh: `POST /api/supplier-product-images/` (multipart).

### Trường hợp 2 — POST body

```json
{
  "category": 12,
  "name": "Cà chua bi nhà kính loại A",
  "unit": "kg",
  "product_master": 5,
  "wholesale_price": "35000.00",
  "daily_production_capacity": "50.00",
  "description": "Giống cherry"
}
```

### Duyệt SP

```http
POST /api/supplier-products/{id}/verify/
Authorization: Bearer <admin_token>

{ "status": "active" }
```

---

## 6. Quy trình UI theo màn hình

### Màn Admin — Quản lý catalog

1. **Danh mục system:** `GET/POST /api/categories/` (`scope=system`)
2. **Product Master:** CRUD `/api/product-masters/`
3. **Duyệt SP NCC:** list pending → verify

### Màn NCC — Tạo sản phẩm

**Bước 1:** Chọn loại danh mục (system vs custom)

**Nếu system (trường hợp 1):**
1. `GET /api/categories/` → filter `scope=system`
2. `GET /api/product-masters/?category_id={id}`
3. Form: master (required), giá, năng lực SX/ngày, mô tả, ảnh
4. `POST /api/supplier-products/`
5. Chờ admin duyệt

**Nếu custom (trường hợp 2):**
1. `GET /api/categories/` → danh mục riêng NCC
2. Form: tên SP, đơn vị, (optional) search/link master, giá, năng lực SX/ngày, ảnh
3. `POST /api/supplier-products/`
4. Chờ admin duyệt

**Gợi ý UI khi dropdown master trống:** hiện message *"Chưa có trong catalog — dùng danh mục riêng hoặc liên hệ admin"*, chuyển sang form trường hợp 2.

### Màn Dealer — Đặt hàng NCC (không đổi)

1. `GET /api/suppliers/`
2. `GET /api/suppliers/{id}/products/` → hiển thị `name` từ SupplierProduct
3. `POST /api/purchase-orders/`

---

## 7. Validation FE cần biết

| Rule | Chi tiết |
|------|----------|
| System category | `product_master` **bắt buộc**, phải thuộc đúng category |
| Custom category | `name` + `unit` **bắt buộc** |
| Link master | Tối đa 1 SupplierProduct / NCC / master |
| Master mới | Chỉ admin `POST /api/product-masters/` |
| Duyệt | Mọi SP mới `pending` → admin verify |

---

## 8. Sơ đồ tổng thể

```text
[Admin]  categories (system) ──► product-masters (CRUD)
                                      │
[NCC]    case 1: chọn master ◄────────┘
              └──► supplier-products (POST) ──► verify ──► [Dealer catalog]

[NCC]    case 2: custom category + tên riêng [+ optional master link]
              └──► supplier-products (POST) ──► verify ──► [Dealer catalog]
```

Swagger: `/api/docs/` — tags **Product Catalog**, **Supplier Products**.
