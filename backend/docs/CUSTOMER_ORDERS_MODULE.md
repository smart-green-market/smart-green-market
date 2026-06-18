# Module đơn hàng buyer & marketing — Checklist schema

Tài liệu checklist schema đã triển khai (migration only, **chưa có API**).

## Apps mới

| App | Bảng | Migration |
|-----|------|-----------|
| `apps.orders` | `orders`, `order_items`, `order_status_histories`, `customer_payments` | `orders/0001_initial` |
| `apps.marketing` | `customer_segments`, `customer_segment_members`, `customer_interactions` | `marketing/0001_initial` |
| `apps.promotions` | `promotions`, `promotion_targets`, `promotion_usages` | `promotions/0001_initial` |
| `apps.reviews` | `product_reviews`, `review_images`, `product_recommendations` | `reviews/0001_initial` |

---

## Checklist schema (đã làm)

| # | Hạng mục | Trạng thái | Ghi chú |
|---|----------|------------|---------|
| 1 | `dealer_id` trên promotions, segments, interactions, recommendations | ✅ | `Promotion.dealer`, `CustomerSegment.dealer`, `CustomerInteraction.dealer`, `ProductRecommendation.dealer` |
| 2 | Snapshot địa chỉ + tên SP trên order / order_item | ✅ | `receiver_name`, `receiver_phone`, `delivery_address`; `product_title`, `unit`, `import_price` |
| 3 | Constraint DB customer ↔ dealer ↔ product ↔ batch | ⚠️ Một phần | Unique/index ở interaction, segment, review; **validate cross-FK sẽ làm ở service khi viết API** |
| 4 | Bảng `order_status_histories` | ✅ | `OrderStatusHistory` |
| 5 | Enum status (TextChoices) | ✅ | Order, Payment, Promotion, Recommendation |
| 6 | `customer_interaction` dạng aggregate + timestamp | ✅ | `view_count`, `add_cart_count`, `purchase_count` + `last_*_at` |
| 7 | `promotion_targets` mở rộng (segment/product/category/all) | ✅ | `PromotionTarget.target_type` + FK nullable |
| 8 | Luồng trừ/hoàn tồn kho | ⏳ Chưa | Sẽ implement trong `services.py` khi viết API order |
| 9 | Cập nhật `CustomerProfile` khi order completed | ⏳ Chưa | Sẽ implement trong service khi viết API |
| 10 | Phân biệt customer order vs purchase order | ✅ | B2C: `apps.orders` / B2B: `apps.purchase_orders` |

---

## Bảng chi tiết

### orders

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| order_code | varchar(50) unique | Sinh khi tạo đơn (service) |
| customer_id | FK → customer_profiles | PROTECT |
| dealer_id | FK → dealer_profiles | PROTECT |
| customer_address_id | FK nullable | SET_NULL — tham chiếu địa chỉ gốc |
| status | pending / confirmed / processing / shipping / delivered / completed / cancelled |
| receiver_name, receiver_phone, delivery_address | snapshot giao hàng |
| delivery_time | timestamp |
| subtotal_amount, discount_amount, shipping_fee, total_amount | decimal |
| paid_amount, debt_amount | decimal |
| delivered_at, completed_at, cancelled_at | nullable |

### order_items

| Cột | Ghi chú |
|-----|---------|
| order_id, dealer_product_id, batch_id | FK |
| product_title, unit | snapshot |
| quantity, unit_price, import_price, subtotal | |

### order_status_histories

Audit log: old_status → new_status, changed_by, note.

### customer_payments

| Enum | Giá trị |
|------|---------|
| payment_method | cash, bank_transfer, e_wallet |
| payment_provider | momo, vnpay (optional) |
| payment_type | full, cod |
| status | pending, paid, failed, refunded, cancelled |

Unique: `(payment_provider, transaction_code)` khi cả hai có giá trị.

### customer_segments

Unique: `(dealer_id, code)`. Có `is_system` cho segment mẫu.

### customer_segment_members

Unique: `(customer_profile_id, segment_id)`.

### customer_interactions

Unique: `(customer_id, dealer_product_id)`. Aggregate counters + last timestamps.

### promotions

`dealer_id` nullable (admin platform). Có `code`, `min_order_amount`, `max_discount_amount`, usage limits.

Unique: `(dealer_id, code)` khi code không rỗng.

### promotion_targets

`target_type`: all | segment | product | category + FK tương ứng.

### promotion_usages

Unique: `(promotion_id, order_id)`.

### product_reviews

Rating 1–5. Unique: `(customer_profile_id, dealer_product_id, order_id)`.

### review_images

`image` (FileField) hoặc `image_url` (CharField).

### product_recommendations

Cache gợi ý. Unique: `(customer_id, dealer_product_id, recommendation_type)`. Có `expires_at`.

---

## Checklist API (chưa làm — phase tiếp theo)

- [ ] CRUD đơn hàng buyer (dealer + storefront customer)
- [ ] Luồng trạng thái đơn + `OrderStatusHistory`
- [ ] Trừ/hoàn tồn `DealerInventoryBatch` + `DealerInventoryTransaction(SALE)`
- [ ] Thanh toán buyer (COD, chuyển khoản, ví)
- [ ] Cập nhật `CustomerProfile.total_orders`, `total_spent`, `last_order_at`, `loyalty_points`
- [ ] CRUD promotion + validate target + apply voucher
- [ ] CRUD segment + gán member
- [ ] Track interaction (view/add_cart/purchase)
- [ ] Review sau order completed
- [ ] Job tính `ProductRecommendation`

---

## Chạy migration

```bash
cd backend
python manage.py migrate
```

Thứ tự dependency: `marketing` → `orders` → `promotions` → `reviews`.
