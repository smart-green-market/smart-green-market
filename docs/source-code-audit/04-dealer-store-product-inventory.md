# 04 — Audit source code: đại lý, gian hàng, sản phẩm và tồn kho

## 1. Phạm vi và kết luận nhanh

Tài liệu này truy vết source hiện tại từ React UI → service HTTP → Django URL/view/serializer/service → model/bảng DB cho các vùng: hồ sơ đại lý, gian hàng/slug, sản phẩm bán lẻ, ảnh, lô tồn `MAIN`, nhập/xuất/hao hụt/hết hạn, lịch sử tồn, liên kết phiếu nhập, giá giảm theo thời gian, bán hàng, khách hàng và thống kê có dùng dữ liệu tồn.

Kết luận kiến trúc quan trọng nhất:

- Hệ thống hiện tại chủ đích dùng **một `DealerProduct` cho mỗi `(dealer, product_master)` và đúng một lô logic có `batch_number="MAIN"` cho mỗi sản phẩm**.
- Mọi lần nhập từ phiếu nhập được cộng dồn vào `MAIN`; lần nhập mới ghi đè `import_price` và `import_date` của toàn bộ tồn đang gộp.
- “FIFO” trong comment/tên hàm không phải FIFO nhiều lô. `_allocate_batches()` chỉ lấy một `MAIN`.
- **KHÔNG TÌM THẤY TRONG SOURCE CODE** cơ chế nhiều lô nhập độc lập và xuất theo `expiry_date`/`import_date` tăng dần.
- `purchase_order_item` tồn tại trong model lô nhưng luồng nhập chuẩn không gán trường này; vì vậy truy nguyên `MAIN` về từng `PurchaseOrderItem` không hoạt động.
- Nhập kho chuẩn không tự tính `expiry_date`/`production_date`; test còn khẳng định `expiry_date is None` sau `_import_dealer_inventory()`.
- Có API/policy “age discount”, nhưng policy chỉ xét phạm vi, thời gian hiệu lực và khung giờ; không có ngưỡng tuổi hàng, số ngày gần hết hạn hoặc % vòng đời trong điều kiện áp dụng.
- Có khóa hàng khi bán/hoàn tồn trên luồng đơn hàng, nhưng hao hụt, cập nhật hạn, cập nhật giá lô và một số đường tạo `MAIN` còn rủi ro race.

## 2. Bản đồ thành phần và bảng dữ liệu

| Vùng | UI/service chính | Backend chính | Model / bảng DB | Nhận xét |
|---|---|---|---|---|
| Hồ sơ cửa hàng | `frontend/web-site/src/pages/Dealer/Info/DealerInfoPage.jsx`; `frontend/web-site/src/services/api/dealerService.js` | `backend/apps/dealers/views.py`; `backend/apps/dealers/serializers.py` | `DealerProfile` / `dealer_profiles` | Một account có một hồ sơ |
| Slug/link public | `dealerService.getStorefrontLink()` | `DealerProfileViewSet.storefront_link`; `backend/apps/dealers/store_code.py` | `DealerProfile.slug` unique | Mã ngẫu nhiên `abc-def-ghi`, read-only |
| Catalog public | route `/cua-hang/:dealerSlug`; buyer API service | `backend/apps/customers/storefront_catalog_views.py`; `catalog_services.py` | `dealer_profiles`, `dealer_products`, `dealer_inventory_batches` | Chỉ dealer/account active |
| Sản phẩm đại lý | `ProductManagement.jsx`; `dealerProductService.js` | `DealerProductViewSet`; `DealerProductSerializer` | `DealerProduct` / `dealer_products` | UI không có create thủ công |
| Ảnh sản phẩm | `dealerProductService.uploadImage/deleteImage/setThumbnail` | `DealerProductImageViewSet` | `DealerProductImage` / `dealer_product_images` | FileField, giới hạn từ system settings |
| Kho | `pages/Dealer/Inventory.jsx`; `dealerInventoryService.js` | `DealerInventoryBatchViewSet` | `DealerInventoryBatch` / `dealer_inventory_batches` | API chỉ trả lô `MAIN` |
| Hao hụt | `UpdateProductModal.jsx` | `record_wastage_action` → `record_wastage()` | `dealer_inventory_wastages`; `dealer_inventory_transactions` | Trừ tồn + transaction |
| Bán/hoàn tồn | UI đặt hàng storefront và quản lý đơn | `backend/apps/orders/services.py` | `orders`, `order_items`, `dealer_inventory_transactions` | Trừ ngay khi tạo đơn |
| Phiếu nhập | route `/dai-ly/nhap-hang/*` | `backend/apps/purchase_orders/services.py` | `purchase_orders`, `purchase_order_items` | Chỉ nhập khi thanh toán cuối được duyệt |
| Giảm giá | `DealerDiscountPage.jsx`; `discountService.js` | `age_discount_views.py`; `age_discount.py` | `AgeDiscountPolicy` / `age_discount_policies`; `manual_sale_price` | Tên “age” gây hiểu nhầm |
| Khách hàng | `CustomerPage.jsx`; `customerService.js` | `DealerCustomerViewSet` | `CustomerProfile` / `customer_profiles`; account có `store_dealer` | Cách ly theo dealer |
| Dashboard/statistics | service dashboard/statistical | `backend/apps/dashboard/views.py`; `backend/apps/statistical/views.py` | aggregate từ order, PO, batch, wastage | Một số công thức không cùng nghĩa tồn khả dụng |

## 3. Hồ sơ đại lý, tạo cửa hàng, slug và “storefront settings”

### 3.1 Chuỗi UI → DB

| Tác vụ | UI → HTTP | URL/view/serializer | Ghi DB |
|---|---|---|---|
| Đăng ký hồ sơ | `RegisterDealerPage.jsx` / helper → `dealerService.completeRegistration()` → `POST /api/dealers/` | `DealerProfileViewSet.create` → `DealerProfileSerializer.create` | INSERT `dealer_profiles`, `account=request.user`, status mặc định `pending` |
| Cập nhật cửa hàng | `DealerInfoPage.handleSaveStore()` → `dealerService.update(id, payload)` → `PATCH /api/dealers/{id}/` | `DealerProfileViewSet.partial_update` → `DealerProfileSerializer` | UPDATE `store_name`, `store_address`, `description`, tùy chọn `logo` |
| Lấy link public | `dealerService.getStorefrontLink()` → `GET /api/dealers/me/storefront-link/` | `DealerProfileViewSet.storefront_link` | Không ghi DB; ghép `STOREFRONT_BASE_URL + /cua-hang/{slug}` |
| Xem gian hàng | React route `/cua-hang/:dealerSlug` → storefront APIs | `StorefrontDealerProfileView`, `StorefrontProductListView`, `StorefrontProductDetailView` | Read-only |
| Admin duyệt | `POST /api/dealers/{id}/verify/` | `DealerProfileViewSet.verify` | UPDATE trạng thái/verified fields; có thể active account |

`DealerProfile.save()` gọi `assign_unique_store_code()` nếu chưa có `slug`. Hàm sinh 3 nhóm, mỗi nhóm 3 ký tự `[a-z0-9]`, thử tối đa 128 lần. `slug` có unique constraint; đổi `store_name` không đổi slug.

Điều kiện public: `DealerProfile.status == active` và `DealerProfile.account.status == active`. Endpoint link vẫn trả URL khi chưa active nhưng `can_share=false`.

### 3.2 Trạng thái hồ sơ

| State | Nguồn chuyển | Ý nghĩa |
|---|---|---|
| `pending` | mặc định khi tạo | Chờ admin duyệt |
| `active` | admin `verify` sau khi đủ tài liệu approved | Cửa hàng public, account pending được active |
| `rejected` | admin `verify`, bắt buộc lý do | Account bị đưa về `pending` |
| `inactive` | có trong enum | Không thấy nhánh `verify` đặt inactive trong serializer dùng chung được audit ở đây |

### 3.3 Storefront settings thực có

Các giá trị cửa hàng dealer tự sửa được chỉ là `store_name`, `store_address`, `description`, `logo`. Liên hệ lấy từ account. `delivery_policy` lấy từ `orders.delivery_slots` và `SystemSettings`; dealer không có model settings riêng.

**KHÔNG TÌM THẤY TRONG SOURCE CODE** model/bảng `StorefrontSetting`, cấu hình theme/banner/màu, domain riêng, SEO, giờ mở cửa, phí giao riêng từng dealer hoặc chính sách tồn riêng từng cửa hàng.

## 4. DealerProduct: nguồn tạo, giá, trạng thái, duyệt và ảnh

### 4.1 Hai đường tạo backend

| Đường tạo | Hàm | Status ban đầu | Giá | Danh mục |
|---|---|---|---|---|
| API `POST /api/dealer-products/` | `DealerProductSerializer.create()` | `pending` | `retail_price` request | Bắt buộc, phải assignable |
| Hoàn tất phiếu nhập | `_import_dealer_inventory()` → `get_or_create_canonical_dealer_product()` | `active` nếu tạo mới | `PurchaseOrderItem.unit_price` | Chỉ copy category system active, custom NCC thành `None` |

Frontend `dealerProductService.js` không định nghĩa `create`; **KHÔNG TÌM THẤY TRONG SOURCE CODE frontend hiện tại** nút/form tạo `DealerProduct` trực tiếp. Luồng thực tế từ UI là tạo phiếu nhập, xác minh thanh toán cuối, backend tự tạo sản phẩm.

Canonical identity:

1. Ưu tiên `supplier_product.product_master_id`.
2. Nếu có master: unique có điều kiện `(dealer_profile, product_master)` cho status `pending|active|inactive|rejected`.
3. Nếu không có master: unique có điều kiện `(dealer_profile, Lower(title))`.
4. `deleted` không tham gia constraint nên có thể tạo lại.
5. Tên ưu tiên `ProductMaster.name`, fallback `SupplierProduct.name`; bỏ suffix ` — bán lẻ`/` - bán lẻ`.

Nếu sản phẩm đã tồn tại, import chỉ đồng bộ `product_master` và tên canonical. Nó **không cập nhật** `retail_price`, category, supplier_product, description hoặc ảnh. Vì vậy NCC/lần nhập đầu tiên tiếp tục là FK nguồn của sản phẩm canonical dù lần nhập sau có thể đến từ SupplierProduct khác cùng master.

### 4.2 Fields và API state

| Field | Nguồn/validation | Ghi chú |
|---|---|---|
| `dealer_profile` | request user; read-only | Tenant owner |
| `supplier_product` | request/import | Phải `active` khi tạo API |
| `product_master` | tự lấy từ supplier product | Canonical identity |
| `category` | request hoặc system category từ NCC | API create bắt buộc; import có thể null |
| `retail_price` | request hoặc `item.unit_price` | Không có validator > 0 trong serializer |
| `title` | request/canonical | Chuẩn hóa suffix |
| `description`, `thumbnail` | editable | `thumbnail` là CharField, tách khỏi bảng ảnh |
| `status` | read-only với dealer | Dealer không tự active/inactive qua serializer |

State `pending → active|rejected|inactive` qua `DealerProductViewSet.verify` dành cho admin. Luồng PO bỏ qua duyệt và tạo `active` trực tiếp. Đây là khác biệt nghiệp vụ đáng chú ý.

### 4.3 Ảnh

`DealerProductImage.image_url` là `FileField(upload_to="dealer_product_images/")`. Upload: `dealerProductService.uploadImage()` thêm `dealer_product`, POST multipart `/api/dealer-product-images/`; serializer kiểm tra loại/kích thước và `max_images_per_product`.

Khi `is_thumbnail=true`, serializer update các ảnh thumbnail khác thành false. `perform_create` kiểm tra owner. Queryset update/delete cũng được lọc tenant theo account.

Sai lệch UI:

- `dealerProductService.unsetThumbnail()` gửi `{is_thumbnail: true}` giống `setThumbnail()`, nên không thể gỡ thumbnail.
- Thao tác đổi thumbnail gồm save ảnh và bulk update ảnh khác, không có `transaction.atomic`/unique partial constraint; hai request đồng thời có thể để trạng thái cuối phụ thuộc thứ tự.
- `thumbnail` trên `DealerProduct` không tự đồng bộ với `DealerProductImage.is_thumbnail`.
- `getAll()` fallback sang `MOCK_DEALER_PRODUCTS` khi lỗi hoặc khi API trả danh sách rỗng không phân trang; lỗi thật có thể bị che và UI hiển thị dữ liệu giả.

## 5. Canonical inventory `MAIN`

### 5.1 Mô hình dữ liệu

| Model/table | Fields cốt lõi | Quan hệ/ràng buộc |
|---|---|---|
| `DealerInventoryBatch` / `dealer_inventory_batches` | `batch_number`, `quantity`, `remaining_quantity`, `import_price`, `import_date`, `production_date`, `expiry_date`, `manual_sale_price`, `status`, `deleted_at` | FK product; optional FK PO item; unique `(dealer_product,batch_number)` |
| `DealerInventoryTransaction` / `dealer_inventory_transactions` | `type`, before/change/after, reason, actor | FK batch |
| `DealerInventoryWastage` / `dealer_inventory_wastages` | quantity, reason, note, actor | FK batch |

Batch states: `active`, `depleted`, `expired`, `cancelled`. Transaction types: `import`, `sale`, `cancel_restore`, `return_restore`, `wastage`, `adjustment`.

### 5.2 Nhập từ PO đến DB

Chuỗi chính xác:

1. UI phiếu nhập gọi các action trong `purchase_orders`.
2. NCC xác minh thanh toán cuối.
3. `supplier_verify_payment()` đang có `@transaction.atomic` gọi `_complete_order()`.
4. `_complete_order()` ghi `completed_at`, chuyển PO sang `completed`, gọi `_import_dealer_inventory()`.
5. Chỉ `PurchaseOrderItem.review_status=approved`.
6. `_remaining_import_quantity()` = `max(int(item.quantity - returned_approved), 0)`; phần thập phân bị cắt.
7. `get_or_create_canonical_dealer_product()`.
8. `add_import_to_main_batch()` lấy/tạo `MAIN`, cộng `quantity` và `remaining_quantity`, ghi đè `import_price`, `import_date`, active lại lô depleted/expired.
9. INSERT transaction `import`.
10. `try_allocate_waiting_orders()` có thể ngay lập tức phân bổ hàng cho đơn chờ.

Hệ quả:

- `quantity` là tổng lịch sử nhập đã gộp; `remaining_quantity` là tồn hiện tại.
- `import_price` không còn là cost layer; nó là giá của lần nhập mới nhất.
- Giá vốn của toàn bộ tồn cũ bị thay bằng giá nhập mới khi dashboard/wastage đọc `batch.import_price`.
- `import_date` của toàn lô trở thành ngày nhập mới nhất, làm sai “tuổi hàng” của tồn cũ.
- Không lưu phân rã số lượng theo PO item/lần nhập.

### 5.3 Liên kết PurchaseOrderItem

Model có `DealerInventoryBatch.purchase_order_item` và serializer trả `purchase_order_item`, `order_code`. Tuy nhiên `add_import_to_main_batch()` không nhận PO item và `_import_dealer_inventory()` không gán trường này.

Kết luận: **KHÔNG TÌM THẤY TRONG SOURCE CODE** liên kết hoạt động từ lô `MAIN` đến từng `PurchaseOrderItem`. Trường thường là null; một `MAIN` cũng không thể biểu diễn nhiều PO item bằng một FK đơn.

## 6. Xuất kho, FIFO thực tế và hoàn tồn

### 6.1 Tạo đơn buyer

`create_customer_order()` là atomic:

1. Xác nhận dealer active.
2. `mark_expired_inventory_batches(dealer_profile_id=...)`.
3. Validate địa chỉ, tenant sản phẩm, product active, quantity integer >= 1.
4. Tạo `Order`.
5. `_build_order_items()` → `_allocate_batches()`.
6. `_active_batches_qs()` → `get_sellable_batches_qs(..., for_update=True)` khóa row `MAIN`.
7. Kiểm tra đủ tồn; tính giá tại thời điểm allocation.
8. Tạo `OrderItem`, `_deduct_batch()`, INSERT transaction `sale`.
9. Tạo COD và các side effect khách hàng/marketing.

`OrderItem.batch` giữ batch đã trừ; hủy đơn gọi `_restore_order_inventory()`, trả hàng được dealer duyệt gọi `_restore_return_inventory()`. Cả hai khóa batch bằng `select_for_update`, cộng lại tồn, active lại nếu depleted, ghi `cancel_restore`/`return_restore`.

### 6.2 FIFO: tên và hành vi

| Dấu hiệu trong code | Hành vi thật |
|---|---|
| Comment `_build_order_items`: “trừ tồn FIFO” | `_allocate_batches()` trả đúng `[(MAIN, quantity)]` |
| `price_for_order_allocation()` comment FIFO | Chỉ tính giá `MAIN` |
| `sellable_batch_dates_for_display()` nói “lô FIFO buyer sẽ nhận” | `.first()` trên queryset chỉ có `MAIN` |
| `get_sellable_batches_qs().order_by("id")` | Không order theo `expiry_date`/`import_date`; với `MAIN` ordering vô nghĩa |

**KHÔNG TÌM THẤY TRONG SOURCE CODE** FEFO, FIFO nhiều batch, split một order item qua nhiều batch, cost-layer accounting hoặc reservation theo batch nhập.

## 7. Hạn dùng, gần hết hạn và giảm theo tuổi

### 7.1 Expiry

`compute_batch_expiry_date(import_date, supplier_product)` dùng `storage_duration_days` hợp lệ 1..3650. `compute_batch_production_date()` thực tế cho kết quả `expiry - duration`, thường bằng `import_date`.

Các đường cập nhật:

| Tác vụ | API/hàm | Tự động? |
|---|---|---|
| Đặt hạn thủ công | `POST /api/dealer-inventory-batches/{id}/set-expiry-date/` | UI `UpdateProductModal` có gọi |
| Tính lại | `POST .../recompute-expiry-date/` | Service frontend không expose |
| Backfill | `POST .../backfill-expiry-dates/` | Service frontend không expose |
| Mark expired | `mark_expired_inventory_batches()` | Chỉ khi list kho, dashboard summary, tạo đơn và nơi gọi rõ ràng |

Luồng PO không gọi compute/recompute. `backend/apps/dealer_products/tests/test_inventory_expiry.py::test_import_dealer_inventory_sets_expiry_date` khẳng định batch `MAIN.expiry_date is None`.

`get_sellable_batches_qs()` không lọc trực tiếp `expiry_date`; nó tin `status=active`. Nếu chưa có lời gọi mark expired, code đọc catalog/price có thể xem lô quá hạn nhưng vẫn active là bán được. Tạo đơn có mark trước khi allocation nên đường checkout chuẩn chặn.

Khi nhập thêm vào `MAIN` expired, code active lại nhưng không xóa/tính lại `expiry_date`; nếu hạn cũ đã qua, lô có thể tạm active đến lần mark kế tiếp. Nếu hạn cũ còn, metadata hạn của tồn gộp không đại diện lần nhập mới.

### 7.2 Near-expiry

Dashboard định nghĩa alert là `remaining_quantity < 10` hoặc `expiry_date <= today + 20% * (expiry_date-import_date)`, đếm distinct product. Storefront trả `nearest_expiry_date`, nhưng vì chỉ `MAIN`, đó là hạn của `MAIN`.

**KHÔNG TÌM THẤY TRONG SOURCE CODE** model/API policy near-expiry riêng, threshold dealer cấu hình, job định kỳ/cron/Celery đánh dấu expired, notification tự động gần hạn hoặc hành động tự động wastage.

### 7.3 Age discount

Độ ưu tiên giá: `manual_sale_price` > policy > `DealerProduct.retail_price`. Nếu nhiều policy: scope `dealer_product > category > all`, rồi `priority`, rồi `id`.

`AgeDiscountPolicy` chỉ có scope, discount type/value, priority, active, `start_at/end_at`, `daily_start_time/daily_end_time`. `compute_batch_age_metrics()` có tính `age_days`, `days_to_expiry`, `used_shelf_life_percent`, nhưng `resolve_age_discount_policy()` **không dùng các metric này để lọc policy**.

Do đó “age discount” hiện là giảm giá theo lịch/khung giờ gắn scope, không phải rule “còn N ngày”, “đã dùng X% shelf life” hoặc tier theo tuổi.

`UpdateProductModal` hiển thị `% giảm` và ngày áp dụng nhưng không gọi `set-sale-price`, không tạo policy và không đưa hai giá trị vào `onSave` theo một API lưu. Đây là UI không có persistence.

## 8. UI kho và lịch sử giao dịch

`DealerInventoryPage.fetchInventory()` gọi đồng thời:

- `GET /api/dealer-inventory-batches/?page&page_size&search&status`;
- `dealerProductService.getAll()` để bổ sung `retail_price`.

Backend `get_warehouse_inventory_batches_qs()` chỉ trả `batch_number="MAIN"` và product chưa deleted. Serializer đã trả category, supplier, unit, import/expiry, giá hiệu lực và age metrics.

`UpdateProductModal.handleSubmit()` có thể:

1. PATCH category trên `DealerProduct`;
2. POST set-expiry-date;
3. chuyển `wastageData` cho parent, parent mới POST record-wastage;
4. đóng modal ngay.

Nếu bước 1 hoặc 2 thành công nhưng hao hụt thất bại, không rollback toàn tác vụ UI. Trong `DealerInventoryPage.handleSaveBatch`, lỗi wastage chỉ log rồi vẫn reload, không toast lỗi cho người dùng.

Lịch sử dùng `GET /api/dealer-inventory-transactions/`. UI map thiếu:

- Không Việt hóa `cancel_restore`, `return_restore`.
- `productName` hard-code `"Nông sản"`, unit hard-code `"kg"`.
- Backend serializer không trả product title/unit nên UI không thể hiện đúng.
- `isImport = quantity_change > 0` làm các restore hiển thị biểu tượng nhập, về số học đúng nhưng mất ngữ nghĩa.

Exports/imports:

- Nhập tồn chỉ có đường PO hoàn tất.
- **KHÔNG TÌM THẤY TRONG SOURCE CODE** API/UI CSV/Excel import kho.
- **KHÔNG TÌM THẤY TRONG SOURCE CODE** API/UI export kho hoặc transaction.
- **KHÔNG TÌM THẤY TRONG SOURCE CODE** API điều chỉnh tồn generic. `adjustment` chỉ được ghi trong migration/merge dữ liệu (`merge_duplicates.py`), không phải chức năng dealer.

## 9. Quyền sở hữu và multi-tenant

| Resource | Scope |
|---|---|
| Dealer profile | `filter_admin_or_dealer_account(... account_lookup="account")` |
| DealerProduct | account qua `dealer_profile__account` |
| Product image | account qua `dealer_product__dealer_profile__account`; create kiểm owner lần nữa |
| Inventory batch | account qua `dealer_product__dealer_profile__account` |
| Inventory transaction | account qua `batch__dealer_product__dealer_profile__account` |
| Age policy | dealer chỉ queryset `dealer=user.dealer_profile`; write còn `IsDealer` |
| Dealer customer | `user__store_dealer=user.dealer_profile` |
| Storefront | slug + dealer/account active; public |
| Order item | `_validate_order_items()` kiểm sản phẩm thuộc đúng dealer |

Điểm tốt: phần lớn object lookup được tenant-filter trước `get_object()`, tránh IDOR. Category policy và product policy có validation ownership.

Điểm cần lưu ý:

- `DealerStatisticalViewSet` và `DealerDashboardViewSet` chỉ khai báo `IsAuthenticated`, sau đó kiểm có `dealer_profile`; đủ để scope dữ liệu nhưng không dùng permission role chuyên biệt.
- `AgeDiscountPolicyWriteSerializer._get_dealer()` trả `None` cho admin, trong khi write permission yêu cầu đồng thời `IsAdminOrDealer` và `IsDealer`; admin thực tế không create/update.
- Public catalog không yêu cầu product có category, nên sản phẩm auto-created từ custom category NCC vẫn có thể active và public với category null.

## 10. Transaction, locking và race condition

| Luồng | Atomic/lock hiện có | Rủi ro |
|---|---|---|
| Tạo customer order | `@transaction.atomic`; `MAIN.select_for_update()` | Tốt cho oversell trên batch đã tồn tại |
| Hủy/return buyer | atomic; reload batch `select_for_update()` | Tốt; vẫn cần chống action lặp ở state machine |
| Import PO | nằm trong atomic của `supplier_verify_payment`; `add_import_to_main_batch` atomic | `get_or_create_canonical_dealer_product` không lock; duplicate request có thể chạm unique constraint |
| Tạo `MAIN` | select-for-update query rồi create nếu thiếu | Không khóa được row chưa tồn tại; hai request đầu có thể cùng INSERT, một request nhận `IntegrityError` |
| Hao hụt | atomic nhưng dùng instance đã fetch trước, không `select_for_update` | Hai hao hụt/bán đồng thời có thể lost update hoặc before/after sai |
| Set/recompute expiry | không atomic/row lock rõ ràng | Last-write-wins |
| Set/clear manual price | không row lock | Last-write-wins |
| Thumbnail | không atomic/DB unique thumbnail | Race nhiều thumbnail |
| Mark expired | bulk UPDATE | Có thể race với import active lại; trạng thái cuối theo thứ tự |
| Canonical merge | atomic và khóa batch source | Migration `0015` đặt `atomic=False`; từng service atomic nhưng toàn migration không rollback toàn bộ |

Race nghiêm trọng nhất là `record_wastage()`: `get_object()` lấy `remaining_quantity`, sau đó service kiểm và save giá trị tính từ object cũ. Một sale đã khóa/cập nhật giữa hai thời điểm có thể bị ghi đè bởi wastage. Hàm nên tự reload `DealerInventoryBatch.objects.select_for_update()` bên trong atomic, nhưng source hiện tại chưa làm.

Idempotency nhập PO dựa vào trạng thái payment/order chứ không có unique “inventory import event per PO item”. **KHÔNG TÌM THẤY TRONG SOURCE CODE** khóa/idempotency key ở bảng transaction để ngăn ghi `import` trùng nếu completion bị thực thi lặp do race hoặc thao tác ngoài state machine.

## 11. Khách hàng và thống kê liên quan tồn

### 11.1 Customer management

`CustomerProfile` là 1-1 với buyer account. Tenant không nằm trực tiếp trên profile mà qua `Account.store_dealer`; property `dealer_profile` trả `user.store_dealer`.

`CustomerPage.jsx` → `customerService.getAll()` → `GET /api/dealer-customers/` → `DealerCustomerViewSet`, filter/search/status và phân trang. Dealer chỉ sửa `note`. UI có nút export/add nhưng handler chỉ `console.log`:

- **KHÔNG TÌM THẤY TRONG SOURCE CODE** chức năng export khách hàng hoạt động.
- **KHÔNG TÌM THẤY TRONG SOURCE CODE** chức năng dealer thêm khách thủ công hoạt động.

Thông tin inventory liên quan gián tiếp: đơn buyer trừ batch; customer metrics `total_orders`, `total_spent`, favorite category và segmentation dựa lịch sử mua, không trực tiếp thay đổi kho ngoài order service.

### 11.2 Các thống kê đọc tồn

| Endpoint/hàm | Công thức inventory | Sai lệch |
|---|---|---|
| `DealerDashboardViewSet.summary` | sum `remaining_quantity` mọi batch `active` | Không lọc `deleted_at`, `MAIN`, product deleted |
| alert dashboard | low stock hoặc 20% shelf life | Không lọc `deleted_at`/`MAIN`; division/date expression phụ thuộc DB |
| `top_products` dashboard | sum remaining của batch active theo product | Không lọc deleted/MAIN |
| `annotate_dealer_product_stock` | imported/total mọi batch chưa deleted; available chỉ `MAIN active remaining>0` | Available không lọc expiry trực tiếp |
| storefront about | active product count, customer count, completed orders, sold quantity | Product count không yêu cầu còn tồn |
| statistical wastage | sum wastage quantity và `quantity * batch.import_price` | `import_price` trên MAIN là giá lần nhập mới nhất, nên cost lịch sử có thể sai |
| gross profit statistical | tổng order amount - tổng PO amount cùng khoảng ngày | Không phải COGS; tồn đầu/cuối kỳ bị bỏ qua |

`DealerDashboardViewSet.summary` gọi mark expired trước aggregate, nhưng các endpoint khác không nhất quán. Số “new_types_today” dùng `batch.created_at`; `MAIN` chỉ tạo lần đầu, nên nhập lại hôm nay không được tính là loại mới.

## 12. Hàm quan trọng

| Hàm | Input → output | Side effect / invariant |
|---|---|---|
| `assign_unique_store_code()` | model → slug | Query tồn tại rồi generate; DB unique là chốt cuối |
| `find_canonical_dealer_product()` | dealer + supplier/master/title → product | Bỏ deleted; fallback loop Python normalize title |
| `get_or_create_canonical_dealer_product()` | dealer + supplier + giá/category → `(product, created)` | Tạo active; không lock |
| `get_or_create_main_batch()` | product → `(MAIN, created)` | Tạo tồn 0 |
| `add_import_to_main_batch()` | product, qty, price, reason → batch | Cộng tồn, ghi đè metadata nhập, transaction import |
| `annotate_dealer_product_stock()` | Product queryset → annotations | Ba định nghĩa imported/total/available |
| `get_sellable_batches_qs()` | product → queryset | Chỉ MAIN active còn tồn; không filter HSD |
| `_allocate_batches()` | product + qty → một allocation | Khóa MAIN, chặn thiếu tồn |
| `_deduct_batch()` | batch + qty → none | Trừ tồn, depleted nếu 0, transaction sale |
| `record_wastage()` | batch + qty/reason → wastage | Trừ tồn + hai INSERT; thiếu row lock |
| `mark_expired_inventory_batches()` | optional dealer → count | Bulk active→expired khi expiry < today |
| `compute_batch_effective_price()` | batch + policy → price result | manual > policy > retail |
| `resolve_age_discount_policy()` | dealer/product/time → policy | Scope/time only, không xét age metric |
| `soft_delete_dealer_product()` | product/user → product | Chặn open order và tồn chưa hết hạn > 0 |

## 13. Lỗi, mismatch, TODO và dead/legacy surface

1. **FIFO giả danh:** comment và serializer nói FIFO nhưng kiến trúc single `MAIN`.
2. **POItem FK không được điền:** field/API tồn tại nhưng luồng import không sử dụng.
3. **Expiry không tự tính khi nhập:** trái mô tả OpenAPI ở `DealerInventoryBatchViewSet` rằng expiry được tính từ ngày nhập + duration.
4. **Age policy không phụ thuộc tuổi:** metric được tính chỉ để hiển thị.
5. **Metadata MAIN bị ghi đè:** giá nhập/ngày nhập không đại diện tồn hỗn hợp.
6. **Số lượng PO decimal bị `int()` cắt:** `_remaining_import_quantity()`.
7. **Hao hụt race:** atomic nhưng không lock row.
8. **UI discount trong modal kho không lưu.**
9. **`unsetThumbnail` gửi true.**
10. **Mock fallback che lỗi/rỗng thật của product list.**
11. **Transaction UI thiếu restore types, tên sản phẩm và unit thật.**
12. **Dashboard aggregate không thống nhất canonical/deleted filters.**
13. **Soft delete chỉ đếm tồn có expiry null hoặc chưa quá hạn:** tồn quá hạn > 0 không chặn xóa; batch không được soft-delete cùng product trong runtime path.
14. **`cancelled` batch state không có luồng nghiệp vụ được tìm thấy.**
15. **`adjustment` không có dealer API; chỉ dùng khi migrate/merge.**
16. **Migration reverse là no-op** trong `0014`, `0015`, `0016`; rollback dữ liệu canonical không phục hồi cấu trúc trước gộp.
17. `merge_inventory_into_main_batch()` chỉ soft-delete other batch có remaining 0 trước; sau merge mới zero/delete batch >0. Logic đúng cuối cùng nhưng lịch sử batch bị tách khỏi quantity chuyển sang MAIN; transaction cũ vẫn ở batch soft-deleted.
18. **KHÔNG TÌM THẤY TRONG SOURCE CODE** TODO/FIXME rõ ràng trong runtime dealer inventory; các khoảng trống trên là mismatch hành vi, không phải TODO được ghi chú.

## 14. Ma trận feature requested so với source

| Feature | Trạng thái |
|---|---|
| Hồ sơ/store creation, duyệt, logo | Có |
| Slug public ổn định, link share | Có |
| Storefront settings riêng | **KHÔNG TÌM THẤY TRONG SOURCE CODE** ngoài fields profile và system-wide settings |
| DealerProduct từ supplier product | Có, chủ yếu qua PO completion |
| Retail price/status/admin approval | Có, nhưng PO auto-create active bỏ qua duyệt |
| Nhiều ảnh + thumbnail | Có, còn race/mismatch `thumbnail` field |
| Canonical MAIN | Có, là invariant chủ đạo |
| Multi-batch FIFO/FEFO | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Import kho qua PO | Có |
| Import CSV/Excel/manual receipt | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Export kho/transaction | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Generic stock adjustment | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Wastage | Có |
| Expiry manual/recompute/backfill | Có |
| Auto expiry khi import | **KHÔNG TÌM THẤY TRONG SOURCE CODE**; test xác nhận null |
| Scheduled expiry/near-expiry notification | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Inventory transaction ledger | Có, read-only API |
| POItem traceability | Field có, chain ghi **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Age/near-expiry discount threshold | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Time-window discount | Có |
| Customer management tenant-scoped | Có |
| Customer add/export từ dealer UI | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Inventory/dashboard/statistical references | Có, nhưng công thức không nhất quán |

## 15. File nguồn trọng yếu đã truy vết

- `backend/apps/dealers/models.py`
- `backend/apps/dealers/store_code.py`
- `backend/apps/dealers/serializers.py`
- `backend/apps/dealers/views.py`
- `backend/apps/dealer_products/models.py`
- `backend/apps/dealer_products/models_age_discount.py`
- `backend/apps/dealer_products/canonical_inventory.py`
- `backend/apps/dealer_products/inventory_queries.py`
- `backend/apps/dealer_products/inventory_expiry.py`
- `backend/apps/dealer_products/age_discount.py`
- `backend/apps/dealer_products/serializers.py`
- `backend/apps/dealer_products/views.py`
- `backend/apps/dealer_products/services.py`
- `backend/apps/dealer_products/archive.py`
- `backend/apps/dealer_products/merge_duplicates.py`
- `backend/apps/purchase_orders/models.py`
- `backend/apps/purchase_orders/services.py`
- `backend/apps/orders/services.py`
- `backend/apps/orders/waiting_stock_services.py`
- `backend/apps/customers/models.py`
- `backend/apps/customers/views.py`
- `backend/apps/customers/catalog_services.py`
- `backend/apps/customers/storefront_catalog_views.py`
- `backend/apps/customers/storefront_catalog_serializers.py`
- `backend/apps/dashboard/views.py`
- `backend/apps/statistical/views.py`
- `frontend/web-site/src/App.jsx`
- `frontend/web-site/src/pages/Dealer/Info/DealerInfoPage.jsx`
- `frontend/web-site/src/pages/Dealer/Inventory.jsx`
- `frontend/web-site/src/pages/Dealer/Product/ProductManagement.jsx`
- `frontend/web-site/src/pages/Dealer/Discount/DealerDiscountPage.jsx`
- `frontend/web-site/src/pages/Dealer/Customer/CustomerPage.jsx`
- `frontend/web-site/src/components/Dealer/Inventory/UpdateProductModal.jsx`
- `frontend/web-site/src/components/Dealer/Inventory/InventoryHistoryTable.jsx`
- `frontend/web-site/src/components/Dealer/Product/ProductInventoryBatches.jsx`
- `frontend/web-site/src/services/api/dealerService.js`
- `frontend/web-site/src/services/api/dealerProductService.js`
- `frontend/web-site/src/services/api/dealerInventoryService.js`
- `frontend/web-site/src/services/api/discountService.js`
- `frontend/web-site/src/services/api/customerService.js`
