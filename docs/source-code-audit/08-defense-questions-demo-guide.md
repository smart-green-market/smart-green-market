# Cẩm nang câu hỏi bảo vệ và kịch bản demo theo source code

## 1. Phạm vi và nguyên tắc sử dụng

Tài liệu này chỉ kết luận từ source hiện có trong repository. Tên màn hình, handler frontend, endpoint, class/hàm backend và trạng thái bên dưới đều được đối chiếu trực tiếp. Nếu một chức năng không có đường thực thi trong source, tài liệu ghi rõ **KHÔNG TÌM THẤY TRONG SOURCE CODE**.

Luồng cốt lõi của hệ thống là chuỗi B2B2C:

1. Nhà cung cấp tạo sản phẩm.
2. Admin duyệt sản phẩm nhà cung cấp.
3. Đại lý lập phiếu nhập, đặt cọc, nhận hàng và thanh toán cuối.
4. Backend tự nhập hàng vào kho đại lý và tạo/kích hoạt sản phẩm bán lẻ.
5. Buyer xem storefront, đặt đơn COD.
6. Đại lý xác nhận, chuẩn bị và giao đơn.
7. Buyer xác nhận nhận hàng; đơn hoàn tất.

Nguồn định tuyến tổng: `backend/config/urls.py` gắn các ứng dụng dưới prefix `/api/`. Frontend định tuyến vai trò và màn hình trong `frontend/web-site/src/App.jsx`.

---

## 2. Câu hỏi vấn đáp và câu trả lời có bằng chứng

### Câu 1. Bài toán nghiệp vụ trung tâm của đề tài là gì?

Hệ thống nối ba vai trò trong một chuỗi có truy vết: supplier cung ứng nông sản cho dealer qua `PurchaseOrder`; dealer nhập tồn và bán lẻ bằng `DealerProduct`; buyer mua tại storefront của đúng dealer qua `Order`.

- B2B: `backend/apps/purchase_orders/models.py` — `PurchaseOrder`, `PurchaseOrderItem`, `PurchaseOrderPayment`, `PurchaseOrderStatusHistory`.
- Kho/bán lẻ: `backend/apps/dealer_products/models.py` — `DealerProduct`, `DealerInventoryBatch`, `DealerInventoryTransaction`.
- B2C: `backend/apps/orders/models.py` — `Order`, `OrderItem`, `CustomerPayment`, `OrderStatusHistory`.
- Liên kết nguồn gốc: `DealerProduct.supplier_product` và `OrderItem.dealer_product`.

### Câu 2. Kiến trúc tổng thể của hệ thống là gì?

Frontend web là React, gọi REST API bằng `axiosClient`; backend là Django REST Framework, dữ liệu được tổ chức theo app nghiệp vụ. WebSocket notification dùng Django Channels, nhưng luồng giao dịch chính vẫn là REST.

- Router frontend: `frontend/web-site/src/App.jsx` — `App`.
- HTTP client: `frontend/web-site/src/services/api/axiosClient.js`.
- Router backend: `backend/config/urls.py`.
- REST view: các `ViewSet`/`APIView` như `SupplierProductViewSet`, `PurchaseOrderViewSet`, `CustomerOrderViewSet`, `StorefrontOrderListCreateView`.
- Realtime: `backend/apps/notifications/routing.py` và `frontend/web-site/src/contexts/notificationRealtimeProvider.jsx`.

### Câu 3. Hệ thống phân quyền theo vai trò như thế nào?

Backend kiểm tra role trong permission class, không chỉ ẩn nút ở frontend.

- `backend/common/permission.py` — `BaseRolePermission`, `IsAdmin`, `IsSupplier`, `IsDealer`, `IsBuyer`, `IsActive`.
- Sản phẩm supplier: `SupplierProductViewSet.get_permissions()` chỉ admin được `verify`, supplier được tạo/sửa, dealer chỉ đọc catalog.
- Phiếu nhập: `PurchaseOrderViewSet.get_permissions()` chia action dealer tạo/nộp tiền/nhận hàng và supplier xác nhận/duyệt tiền/giao hàng.
- Đơn buyer: `CustomerOrderViewSet.get_permissions()` giới hạn thao tác xử lý đơn cho dealer/admin.

### Câu 4. Buyer có thể dùng token của cửa hàng A để mua ở cửa hàng B không?

Không theo permission hiện tại. Storefront token có claim dealer, nhưng lớp permission không tin claim này để quyết định tenant: SimpleJWT nạp `Account` theo `user_id`, sau đó URL slug phải khớp `request.user.store_dealer.slug` lấy từ DB.

- `backend/apps/customers/tokens.py` — `StorefrontRefreshToken.for_user()` thêm `auth_scope`, `store_dealer_id`, `store_dealer_slug`.
- `backend/apps/customers/permissions.py` — `IsStorefrontCustomer.has_permission()` kiểm tra role buyer, account có `store_dealer_id` và `user.store_dealer.slug == dealer_slug`.
- Các API đơn buyer trong `backend/apps/orders/storefront_views.py` dùng `permission_classes = [IsStorefrontCustomer]`.
- Đăng nhập/đăng ký storefront: `backend/apps/customers/storefront_views.py` và endpoint `/api/storefronts/{dealer_slug}/login/`, `/register/`.

### Câu 5. Vì sao sản phẩm supplier phải được admin duyệt?

Sản phẩm mới luôn ở `pending`; chỉ admin gọi action `verify` để chuyển sang `active`, `rejected` hoặc `inactive`. Catalog đặt hàng của dealer chỉ nhận sản phẩm hợp lệ.

- `backend/apps/supplier_products/models.py` — `SupplierProductStatus`, `SupplierProduct.status`.
- `backend/apps/supplier_products/serializer.py` — `SupplierProductSerializer.create()` đặt `SupplierProductStatus.PENDING`.
- `backend/apps/supplier_products/views.py` — `SupplierProductViewSet.verify()`.
- Endpoint: `POST /api/supplier-products/{id}/verify/`.
- `backend/apps/purchase_orders/services.py` — `validate_items_for_supplier()` bắt buộc sản phẩm `active` và có `wholesale_price`.

### Câu 6. Hệ thống hỗ trợ chuẩn hóa tên sản phẩm ra sao?

Sản phẩm supplier có thể gắn `ProductMaster`. Với danh mục hệ thống, serializer yêu cầu master và lấy tên/đơn vị chuẩn; với danh mục riêng, supplier có thể dùng tên tự do. Khi nhập sang dealer, hệ thống ưu tiên master để gom về một sản phẩm bán lẻ chuẩn.

- `backend/apps/supplier_products/models.py` — `SupplierProduct.product_master`.
- `backend/apps/supplier_products/serializer.py` — `SupplierProductSerializer.validate()` và logic resolve catalog.
- `backend/apps/dealer_products/canonical_inventory.py` — `resolve_product_master_id()`, `resolve_canonical_title()`, `find_canonical_dealer_product()`.
- Ràng buộc DB: `unique_supplier_product_master` và `unique_dealer_product_master_per_dealer`.

### Câu 7. “Năng lực sản xuất/ngày” có phải tồn kho supplier không?

Không. `SupplierProduct.daily_production_capacity` chỉ là năng lực sản xuất tham khảo. Mô hình phiếu nhập ghi rõ supplier thu hoạch/chuẩn bị theo đơn, không có batch kho supplier.

- `backend/apps/supplier_products/models.py` — `daily_production_capacity`.
- `backend/apps/purchase_orders/models.py` — mô tả `PurchaseOrderItem` “không gắn batch kho supplier”.
- `backend/apps/purchase_orders/services.py` — luồng sau cọc chuyển sang `processing`, sau đó supplier `ship`.
- Kho supplier vận hành thực tế: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.

### Câu 8. Một giỏ nhập hàng có nhiều supplier được xử lý thế nào?

Backend gộp dòng trùng, nhóm theo supplier và tạo một `PurchaseOrder` cho mỗi supplier trong cùng transaction.

- `backend/apps/purchase_orders/services.py` — `merge_purchase_order_items()`, `group_items_by_supplier()`, `create_purchase_orders()`.
- `backend/apps/purchase_orders/serializers.py` — `PurchaseOrderCreateSerializer.create()` gọi `services.create_purchase_orders()`.
- Endpoint: `POST /api/purchase-orders/`.
- Frontend hiện cũng có thể gửi tuần tự từng draft: `frontend/web-site/src/pages/Dealer/PurchaseOrder/DraftOrderPreviewPage.jsx` — `handleConfirmOrder()`.

### Câu 9. Giá trên phiếu nhập có thay đổi nếu supplier sửa giá sau đó không?

Không. Khi tạo dòng phiếu, backend snapshot giá gốc, giá hiệu lực, bậc giảm, tiền giảm và subtotal vào `PurchaseOrderItem`.

- `backend/apps/purchase_orders/models.py` — `unit_price`, `base_unit_price`, `discount_type`, `discount_value`, `discount_min_quantity`, `line_discount_amount`.
- `backend/apps/purchase_orders/services.py` — `build_order_items()` và `_apply_pricing_snapshot()`.
- Tính giảm theo lượng: `apps.supplier_products.quantity_discount.compute_wholesale_unit_price`.

### Câu 10. Supplier có thể điều chỉnh phiếu nhập không?

Có. Khi xác nhận, supplier duyệt/từ chối từng dòng, có thể thay số lượng và ngày giao. Nếu có thay đổi, trạng thái chuyển `pending_dealer_confirmation`; dealer phải gọi `approve-adjustment` mới về `confirmed`.

- `backend/apps/purchase_orders/services.py` — `_normalize_confirm_items()`, `_apply_item_reviews()`, `supplier_confirm_order()`, `dealer_approve_adjustment()`.
- Endpoint supplier: `POST /api/purchase-orders/{id}/confirm/`.
- Endpoint dealer: `POST /api/purchase-orders/{id}/approve-adjustment/`.
- Trạng thái: `pending_supplier_confirmation` → `pending_dealer_confirmation` → `confirmed`.

### Câu 11. State machine phiếu nhập được bảo vệ ở đâu?

Mỗi service kiểm tra trạng thái nguồn trước khi chuyển, và trạng thái kết thúc bị chặn bởi `_ensure_not_terminal()`.

- `backend/apps/purchase_orders/services.py`:
  - `supplier_confirm_order()`: chỉ từ `pending_supplier_confirmation`.
  - `dealer_submit_payment()`: cọc chỉ từ `confirmed`, cuối chỉ từ `delivered`.
  - `supplier_start_shipping()`: chỉ từ `processing`.
  - `dealer_confirm_delivery()`: chỉ từ `shipping`.
  - `supplier_verify_payment()`: duyệt cọc sang `processing`, duyệt cuối gọi `_complete_order()`.
- Enum đầy đủ: `backend/apps/purchase_orders/models.py` — `PurchaseOrderStatus`.

### Câu 12. Thanh toán phiếu nhập là thanh toán online tự động hay xác minh thủ công?

Đây là chuyển khoản có VietQR và biên lai, supplier xác minh thủ công. Backend sinh QR từ tài khoản ngân hàng supplier, dealer upload `receipt_file`, supplier duyệt hoặc từ chối.

- `backend/apps/purchase_orders/services.py` — `get_payment_qr()`, `dealer_submit_payment()`, `supplier_verify_payment()`.
- `backend/common/vietqr.py` — `build_supplier_payment_qr`.
- API: `GET .../payment-qr/`, `POST .../submit-deposit/`, `POST .../submit-final-payment/`, `POST .../verify-payment/`.
- Tự động đối soát qua webhook ngân hàng/cổng thanh toán: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.

### Câu 13. Khi nào hàng thực sự vào kho dealer?

Chỉ sau khi supplier xác minh thanh toán cuối. `_complete_order()` chuyển PO sang `completed`, rồi `_import_dealer_inventory()` tạo/tìm sản phẩm dealer và cộng tồn lô `MAIN`.

- `backend/apps/purchase_orders/services.py` — `supplier_verify_payment()`, `_complete_order()`, `_import_dealer_inventory()`.
- `backend/apps/dealer_products/canonical_inventory.py` — `get_or_create_canonical_dealer_product()`, `add_import_to_main_batch()`.
- Giao dịch kho: `DealerInventoryTransactionType.IMPORT`.

### Câu 14. Vì sao dùng lô `MAIN`, và hệ quả là gì?

Thiết kế hiện tại gom tồn của một sản phẩm dealer vào một lô canonical `MAIN`, giúp nhập/cộng/trừ đơn giản và khóa dòng bằng `select_for_update()`. Đổi lại, nhiều đợt nhập có ngày sản xuất/hạn dùng riêng không còn được tách thành nhiều batch nguồn.

- `backend/apps/dealer_products/canonical_inventory.py` — `CANONICAL_BATCH_NUMBER = "MAIN"`, `get_or_create_main_batch()`, `add_import_to_main_batch()`.
- `backend/apps/dealer_products/models.py` — unique `(dealer_product, batch_number)`.
- Đây là giới hạn mô hình hiện tại, không nên trình bày như truy vết nhiều lô độc lập.

### Câu 15. Sản phẩm bán lẻ sau nhập kho có cần admin duyệt lại không?

Trong luồng nhập PO, không. `get_or_create_canonical_dealer_product()` tạo `DealerProduct` với `status=active` trực tiếp. Action admin `DealerProductViewSet.verify()` tồn tại cho sản phẩm dealer tạo qua CRUD, nhưng không nằm trong đường nhập kho tự động.

- `backend/apps/dealer_products/canonical_inventory.py` — `get_or_create_canonical_dealer_product()`.
- `backend/apps/dealer_products/views.py` — `DealerProductViewSet.verify()`.
- Một bước “admin duyệt lại sản phẩm được sinh từ PO” trong luồng này: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.

### Câu 16. Storefront chỉ hiển thị sản phẩm nào?

Chỉ sản phẩm `DealerProductStatus.ACTIVE` của đúng dealer active. API có lọc danh mục, tìm kiếm, còn hàng và sắp xếp; chi tiết trả cả thông tin bảo quản/quy trình canh tác từ supplier gốc.

- `backend/apps/customers/catalog_services.py` — `_storefront_products_base_qs()`, `get_storefront_products_qs()`, `apply_storefront_product_filters()`.
- `backend/apps/customers/storefront_catalog_views.py` — `StorefrontProductListView`, `StorefrontProductDetailView`.
- API public: `GET /api/storefronts/{dealer_slug}/products/`, `GET .../products/{product_id}/`.

### Câu 17. Buyer đặt hàng bằng phương thức nào?

Đường backend thực tế hiện tạo đơn COD. `StorefrontOrderListCreateView.post()` dùng `OrderCreateSerializer`, gọi `create_customer_order()`, tạo `CustomerPayment` loại COD ở trạng thái `pending`.

- `backend/apps/orders/storefront_views.py` — `StorefrontOrderListCreateView`.
- `backend/apps/orders/serializers.py` — `OrderCreateSerializer.create()`.
- `backend/apps/orders/services.py` — `create_customer_order()`, `_create_cod_payment()`.
- Endpoint: `POST /api/storefronts/{dealer_slug}/orders/`.
- Thanh toán buyer bằng ngân hàng/ví điện tử hoàn chỉnh: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.

### Câu 18. Tồn kho được trừ ở thời điểm nào khi buyer đặt hàng?

Tồn bị trừ ngay trong transaction tạo đơn, không chờ dealer xác nhận. `_allocate_batches()` lấy lô bán được; `_deduct_batch()` giảm `remaining_quantity` và ghi transaction `SALE`.

- `backend/apps/orders/services.py` — `create_customer_order()`, `_build_order_items()`, `_allocate_batches()`, `_deduct_batch()`.
- Nếu hủy trước giao: `_restore_order_inventory()` ghi `CANCEL_RESTORE`.
- Nếu dealer duyệt trả hàng: `_restore_return_inventory()` ghi `RETURN_RESTORE`.

### Câu 19. Hệ thống hạn chế overselling thế nào?

Luồng tạo đơn được bọc `@transaction.atomic`; truy vấn lô bán được dùng khóa cập nhật và kiểm tra `remaining_quantity` trước khi trừ.

- `backend/apps/orders/services.py` — `create_customer_order()`, `_active_batches_qs()`, `_allocate_batches()`.
- `backend/apps/dealer_products/inventory_queries.py` — `get_sellable_batches_qs(..., for_update=True)`.
- Tuy nhiên mã đơn được sinh bằng `count()+1`; đây vẫn là điểm race riêng, không phải race tồn kho.

### Câu 20. State machine đơn buyer là gì?

Luồng demo ổn định là `pending → confirmed → processing → shipping → completed`. Buyer xác nhận từ `shipping` và backend chuyển thẳng sang `completed`, đồng thời đánh dấu COD `paid`.

- `backend/apps/orders/models.py` — `OrderStatus`.
- `backend/apps/orders/services.py` — `dealer_confirm_order()`, `dealer_start_processing()`, `dealer_start_shipping()`, `buyer_confirm_received()`.
- API dealer: `/api/customer-orders/{id}/confirm/`, `/start-processing/`, `/ship/`.
- API buyer: `/api/storefronts/{dealer_slug}/orders/{id}/confirm-received/`.

### Câu 21. Trạng thái `delivered` của đơn buyer có nằm trong luồng demo chuẩn không?

Không. Enum có `delivered`, nhưng `buyer_confirm_received()` hiện đặt `delivered_at` và `completed_at` rồi chuyển thẳng `shipping → completed`. Comment frontend trong `buyerOrder.js` nói “shipping → delivered hoặc delivered → completed” không khớp backend.

- Source quyết định: `backend/apps/orders/services.py` — `buyer_confirm_received()`.
- Mismatch: `frontend/web-site/src/services/api/Buyer/buyerOrder.js` — comment dưới `confirmReceived`.
- Không demo một nút riêng `shipping → delivered → completed` vì handler/backend tương ứng: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.

### Câu 22. Hệ thống lưu lịch sử trạng thái như thế nào?

Mỗi luồng có bảng lịch sử riêng và service `record_status_change()` ghi `old_status`, `new_status`, ghi chú, người thay đổi, thời gian rồi gửi notification.

- PO: `PurchaseOrderStatusHistory` và `backend/apps/purchase_orders/services.py::record_status_change`.
- Đơn buyer: `OrderStatusHistory` và `backend/apps/orders/services.py::record_status_change`.
- Đây là audit trail nghiệp vụ, không phải event sourcing đầy đủ vì trạng thái hiện tại vẫn nằm trên bảng đơn.

### Câu 23. Notification được kích hoạt ở đâu?

Sản phẩm mới gọi `notify_admins`; duyệt sản phẩm gọi `notify_account`; đổi trạng thái đơn gọi module notification của từng app.

- `backend/apps/supplier_products/views.py` — `SupplierProductViewSet.perform_create()`, `verify()`.
- `backend/apps/purchase_orders/services.py` — `record_status_change()` gọi `notify_purchase_order_status_change`.
- `backend/apps/orders/services.py` — `record_status_change()` gọi `notify_customer_order_status_change`.
- Model: `backend/apps/notifications/models.py` — `Notification`, `NotificationReceipt`.

### Câu 24. Hủy đơn có hoàn tồn không?

Đơn buyer có: `cancel_customer_order()` kiểm tra trạng thái, gọi `_restore_order_inventory()`, hủy payment pending và chuyển `cancelled`. PO supplier chưa nhập kho trước `completed`, nên hủy PO không cần hoàn kho dealer; payment pending được chuyển `cancelled`.

- Buyer: `backend/apps/orders/services.py` — `cancel_customer_order()`.
- PO: `backend/apps/purchase_orders/services.py` — `cancel_order()`.
- Quyền hủy được tách qua `BUYER_CANCELLABLE`, `DEALER_CANCELLABLE`.

### Câu 25. Trả hàng B2B và B2C khác nhau thế nào?

B2B cho dealer chọn từng dòng và số lượng sau `delivered`; supplier duyệt, giảm tổng tiền và chỉ nhập phần còn lại khi PO hoàn tất. B2C hiện buyer yêu cầu trả toàn bộ đơn sau `completed`; dealer/admin duyệt thì hoàn toàn bộ tồn và đánh dấu payment refunded.

- B2B: `dealer_request_return()`, `supplier_review_return()`, `_remaining_import_quantity()` trong `backend/apps/purchase_orders/services.py`.
- B2C: `buyer_request_return()`, `dealer_review_return()` trong `backend/apps/orders/services.py`.
- Endpoint B2B: `/api/purchase-orders/{id}/request-return/`.
- Endpoint B2C: `/api/storefronts/{slug}/orders/{id}/request-return/`.

### Câu 26. Voucher được áp dụng ở frontend hay backend?

Frontend cho chọn/kiểm tra trải nghiệm, nhưng số tiền chính thức được backend tính trong transaction tạo đơn qua `CartVoucherService.apply_voucher_to_order(..., require_saved=True)`.

- `backend/apps/orders/services.py` — `_build_order_items()`.
- `backend/apps/voucher/services.py` — `CartVoucherService`.
- Frontend thực: `frontend/web-site/src/pages/User/Order.jsx` — `handleApplyVoucher()` và payload trong `submitCheckout()`.
- Không nên nói frontend là nguồn tin cậy của giá hoặc giảm giá.

### Câu 27. Dữ liệu truy xuất nguồn gốc đến buyer gồm những gì?

Chi tiết storefront nối từ `DealerProduct` về `SupplierProduct`, trả supplier, hướng dẫn bảo quản, ngày sản xuất/hạn dùng gần nhất và `cultivation_processes`.

- `backend/apps/customers/storefront_catalog_views.py` — `StorefrontProductDetailView`.
- `backend/apps/customers/storefront_catalog_serializers.py` — `StorefrontProductDetailSerializer`.
- `backend/apps/supplier_products/models.py` — `CultivationProcess`.
- Giám sát IoT nhiệt độ theo thời gian thực: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.

### Câu 28. Điểm mạnh về nhất quán dữ liệu là gì?

Các thao tác nhiều bảng quan trọng dùng `transaction.atomic`; tồn có transaction ledger; giá được snapshot; state transition được kiểm tra và ghi history; quyền sở hữu được kiểm tra lại ở backend.

- Atomic B2B: các hàm create/confirm/payment/shipping/return trong `backend/apps/purchase_orders/services.py`.
- Atomic B2C: các hàm create/status/cancel/return trong `backend/apps/orders/services.py`.
- Khóa lô: `backend/apps/dealer_products/canonical_inventory.py::add_import_to_main_batch()` và `backend/apps/orders/services.py::_restore_batch_quantity()`.

### Câu 29. Những race condition đáng thừa nhận là gì?

Có ít nhất hai rủi ro thực tế:

1. `generate_order_code()` của cả PO và buyer dùng `count()+1`; hai request đồng thời có thể sinh cùng mã trước khi unique constraint chặn một request.
2. `supplier_verify_payment()` là atomic nhưng không `select_for_update()` payment/order. Hai request duyệt thanh toán cuối đồng thời có thể cùng đọc `pending`, cùng gọi `_complete_order()` và có nguy cơ cộng nhập kho hai lần.

Bằng chứng:

- `backend/apps/purchase_orders/services.py::generate_order_code`, `supplier_verify_payment`, `_complete_order`.
- `backend/apps/orders/services.py::generate_order_code`.
- Unique field chỉ giúp phát hiện trùng mã: `PurchaseOrder.order_code`, `Order.order_code`.

Đây là hạn chế cần nói thẳng; hướng khắc phục tương lai là sequence/UUID hoặc retry khi `IntegrityError`, và khóa `select_for_update()` trên payment/order kèm idempotency key.

### Câu 30. Cấu hình bảo mật nào không nên trình bày là production-ready?

Mặc định source có secret dev fallback, `DEBUG=True` và `CORS_ALLOW_ALL_ORIGINS=True` nếu môi trường không override. Media local ở production còn có ghi chú disk Render free tạm thời.

- `backend/config/settings.py` — `SECRET_KEY`, `DEBUG`, `CORS_ALLOW_ALL_ORIGINS`, phần serve media.
- JWT có access 2 giờ, refresh 7 ngày, rotate và blacklist: `SIMPLE_JWT`.
- Kết luận đúng: có nền tảng JWT/RBAC, nhưng triển khai production phải ép biến môi trường an toàn, giới hạn CORS, dùng storage bền vững và TLS.

### Câu 31. AI trong hệ thống là phần nào và có nên là trọng tâm demo không?

Source có endpoint train/analyze/recommendations cho dealer và mô hình kết quả dự đoán, nhưng đây không nằm trong chuỗi giao dịch B2B2C cốt lõi.

- `backend/apps/training_models/urls.py` — `/api/train-related-products/`, `/sync-related-products/`, `/customer-segmentation/`, `/dealer/train/`, `/dealer/analyze/`, `/dealer/recommendations/`.
- `backend/apps/training_models/models.py` — `ProductPredictionResult`, `AITrainingHistory`.
- Nên demo sau luồng giao dịch nếu dữ liệu huấn luyện đã chuẩn bị; không dùng AI để che các bước nghiệp vụ chính.

### Câu 32. Source có test cho các rule quan trọng không?

Có test rải theo module, ví dụ nhu cầu đặt hàng supplier, soft delete dealer product, return PO, interaction/voucher. Tuy nhiên chỉ nhìn source test không chứng minh toàn bộ suite đang pass trong môi trường demo.

- `backend/apps/supplier_products/tests/test_order_demand.py`.
- `backend/apps/dealer_products/tests/test_soft_delete.py`.
- `backend/apps/purchase_orders/tests/test_request_return_serializer.py`.
- `backend/apps/marketing/tests/test_interaction_services.py`.
- Kết quả chạy toàn bộ test tại thời điểm viết tài liệu: **KHÔNG TÌM THẤY TRONG SOURCE CODE**; cần chạy riêng trước buổi bảo vệ.

---

## 3. Kịch bản demo end-to-end đề xuất

### Chuẩn bị dữ liệu trước demo

- Có 4 tài khoản hợp lệ: admin, supplier đã approved/active, dealer đã active, buyer storefront thuộc đúng dealer.
- Supplier đã cấu hình ngân hàng (`bank_bin`, `account_number`, `account_name`) để VietQR sinh được.
- Có danh mục/product master phù hợp.
- Chọn ngày giao hợp lệ theo `common.business_rules` và khung giờ buyer từ API delivery slots.
- Dùng một sản phẩm mới, tên dễ nhận biết; ghi lại ID sản phẩm, mã PO và mã đơn buyer.
- Không mở hai tab cùng bấm duyệt thanh toán cuối.

### Bước 1 — Supplier tạo sản phẩm

- Màn hình: `/nha-cung-cap/san-pham`, page `frontend/web-site/src/pages/Supplier/Product.jsx`.
- Handler: `CreateProductModal.handleSubmit()` trong `frontend/web-site/src/components/Supplier/Product/CreateProductModal/index.jsx`.
- Service/API: `productService.addProduct()` → `POST /api/supplier-products/`; ảnh qua `productService.addImageProduct()` → `POST /api/supplier-product-images/`.
- Backend: `SupplierProductViewSet.perform_create()`; `SupplierProductSerializer.create()`.
- Kỳ vọng: HTTP `201`; sản phẩm `status=pending`; admin nhận notification.
- Điểm nói: `daily_production_capacity` là năng lực sản xuất, không phải tồn kho.

### Bước 2 — Admin duyệt sản phẩm supplier

- Màn hình: `/quan-tri/san-pham`, `frontend/web-site/src/pages/Admin/Product.jsx`.
- Handler: `ProductPage.handleApprove()`.
- Service/API: `productService.verify(id, {status: "active"})` → `POST /api/supplier-products/{id}/verify/`.
- Backend: `SupplierProductViewSet.verify()`.
- Kỳ vọng: HTTP `200`; sản phẩm `status=active`, có `verified_by`, `verified_at`; supplier nhận notification.

### Bước 3 — Dealer chọn hàng và gửi phiếu nhập

- Màn hình: `/dai-ly/nhap-hang/tao-moi` → xem trước `/dai-ly/nhap-hang/xem-truoc`.
- Handler gửi: `DraftOrderPreviewPage.handleConfirmOrder()` trong `frontend/web-site/src/pages/Dealer/PurchaseOrder/DraftOrderPreviewPage.jsx`.
- Service/API: `purchaseOrderService.create()` → `POST /api/purchase-orders/`.
- Backend: `PurchaseOrderCreateSerializer.create()` → `create_purchase_orders()` → `create_purchase_order()` → `build_order_items()`.
- Kỳ vọng: HTTP `201`; mỗi supplier một PO; `status=pending_supplier_confirmation`; có snapshot giá và history đầu tiên.

### Bước 4 — Supplier xác nhận PO

- Màn hình: `/nha-cung-cap/don-hang`; modal chi tiết `frontend/web-site/src/components/Supplier/Order/DetailOrderModal/index.jsx`.
- Handler: hàm xác nhận tạo payload bằng `buildConfirmOrderPayload()`, sau đó `orderService.confirmOrder()`.
- API: `POST /api/purchase-orders/{id}/confirm/`.
- Backend: `PurchaseOrderViewSet.confirm()` → `supplier_confirm_order()`.
- Cách demo ổn định: duyệt tất cả dòng, giữ đúng số lượng và đặt `confirmed_delivery_time` bằng thời gian dealer yêu cầu.
- Kỳ vọng: `status=confirmed`.
- Nếu đổi ngày/số lượng: kỳ vọng `pending_dealer_confirmation`; dealer phải dùng `PurchaseOrderDetail.handleApproveAdjustmentConfirm()` → `POST .../approve-adjustment/` để về `confirmed`.

### Bước 5 — Dealer quét QR và nộp cọc

- Màn hình: `/dai-ly/nhap-hang/chi-tiet/{id}`, component `PaymentQrSection` trong `frontend/web-site/src/pages/Dealer/PurchaseOrder/PurchaseOrderDetail.jsx`.
- Handler/service: `purchaseOrderService.getPaymentQr(id, "deposit")`; sau chọn biên lai gọi `purchaseOrderService.submitDeposit()`.
- API: `GET /api/purchase-orders/{id}/payment-qr/?payment_type=deposit`; `POST /api/purchase-orders/{id}/submit-deposit/`.
- Backend: `PurchaseOrderViewSet.payment_qr()` → `get_payment_qr()`; `submit_deposit()` → `dealer_submit_payment()`.
- Kỳ vọng: QR trả đúng số `deposit_amount`; sau upload, payment `pending`, PO `deposit_pending_verification`.

### Bước 6 — Supplier duyệt cọc

- Màn hình: modal chi tiết đơn supplier.
- Handler: `DetailOrderModal` gọi `orderService.verifyPayment()` với `status=verified`.
- API: `POST /api/purchase-orders/{id}/verify-payment/`.
- Backend: `PurchaseOrderViewSet.verify_payment()` → `supplier_verify_payment()`.
- Kỳ vọng: payment `verified`; `paid_amount` cập nhật; PO `status=processing`.

### Bước 7 — Supplier bắt đầu giao hàng

- Màn hình: `/nha-cung-cap/don-hang`.
- Handler: `DetailOrderModal.confirmShipping()` hoặc batch `Supplier/Order.jsx::handleBatchShip()`.
- Service/API: `orderService.confirmShipping()` → `POST /api/purchase-orders/{id}/ship/`.
- Backend: `PurchaseOrderViewSet.ship()` → `supplier_start_shipping()`.
- Kỳ vọng: `processing → shipping`.

### Bước 8 — Dealer xác nhận nhận hàng

- Màn hình: `/dai-ly/nhap-hang/chi-tiet/{id}`.
- Handler: `PurchaseOrderDetail.handleConfirmDelivery()`.
- Service/API: `purchaseOrderService.confirmDelivery()` → `POST /api/purchase-orders/{id}/confirm-delivery/`.
- Backend: `PurchaseOrderViewSet.confirm_delivery()` → `dealer_confirm_delivery()`.
- Kỳ vọng: `shipping → delivered`; `delivered_at` được ghi.

### Bước 9 — Dealer thanh toán cuối

- Màn hình: cùng trang chi tiết; `PaymentQrSection` hiện khi `rawStatus === "delivered"` và còn nợ.
- Handler/service: `purchaseOrderService.getPaymentQr(id, "final_payment")`, sau đó `submitFinalPayment()`.
- API: `GET .../payment-qr/?payment_type=final_payment`; `POST .../submit-final-payment/`.
- Backend: `get_payment_qr()` và `dealer_submit_payment()`.
- Kỳ vọng: payment cuối `pending`; PO `final_payment_pending_verification`.

### Bước 10 — Supplier duyệt thanh toán cuối, hệ thống nhập kho

- Màn hình: modal chi tiết đơn supplier.
- Handler: `DetailOrderModal` gọi `orderService.verifyPayment()` cho payment `final_payment`.
- API: `POST /api/purchase-orders/{id}/verify-payment/`.
- Backend: `supplier_verify_payment()` → `_complete_order()` → `_import_dealer_inventory()` → `get_or_create_canonical_dealer_product()` → `add_import_to_main_batch()`.
- Kỳ vọng:
  - payment `verified`;
  - PO `completed`;
  - `DealerProduct` được tạo/tìm với `status=active`;
  - batch `MAIN.remaining_quantity` tăng;
  - có `DealerInventoryTransaction(type=import)`.

### Bước 11 — Dealer kiểm tra kho và cấu hình giá bán lẻ

- Màn hình: `/dai-ly/kho-hang` và `/dai-ly/san-pham/{id}`.
- Handler đọc: `Dealer/Inventory.jsx` gọi `dealerProductService.getAll()` và service kho tương ứng; chỉnh sản phẩm qua `dealerProductService.update()`.
- API: `GET /api/dealer-inventory-batches/`, `GET/PATCH /api/dealer-products/{id}/`.
- Backend: `DealerInventoryBatchViewSet`, `DealerProductViewSet.partial_update()`.
- Kỳ vọng: tồn hiển thị đúng phần nhập; sản phẩm vẫn `active`; giá bán lẻ sau sửa được storefront dùng.
- Lưu ý: service `dealerProductService.getAll/getById` có fallback mock; phải xác nhận API backend đang chạy và dữ liệu vừa nhập xuất hiện.

### Bước 12 — Buyer xem storefront

- Màn hình: `/cua-hang/{dealerSlug}/san-pham` và `/san-pham/{id}`.
- Handler/service: hooks/page gọi `buyerCatalogService.getProducts()` hoặc `getProductById()`.
- API public: `GET /api/storefronts/{dealerSlug}/products/`, `GET .../products/{id}/`.
- Backend: `StorefrontProductListView.get()`, `StorefrontProductDetailView.get()`, `get_storefront_products_qs()`.
- Kỳ vọng: chỉ sản phẩm dealer `active`; có `available_quantity > 0`, giá bán lẻ và dữ liệu nguồn gốc.

### Bước 13 — Buyer đặt đơn COD thật

- Màn hình đúng: giỏ `/cua-hang/{dealerSlug}/gio-hang` → checkout `/cua-hang/{dealerSlug}/dat-hang`.
- Handler: `CartPage.handleCheckout()` điều hướng; `frontend/web-site/src/pages/User/Order.jsx` dùng `handleOpenConfirm()`, `handlePlaceOrder()`, `submitCheckout()`.
- Service/API: `buyerOrder.getDelivery()` → `GET .../delivery-slots/`; `buyerOrder.create()` → `POST /api/storefronts/{dealerSlug}/orders/`.
- Backend: `StorefrontOrderListCreateView.post()` → `OrderCreateSerializer.create()` → `create_customer_order()`.
- Kỳ vọng: HTTP `201`; đơn `pending`; payment COD `pending`; tồn batch giảm ngay và có transaction `sale`.

### Bước 14 — Dealer xử lý đơn buyer

- Màn hình: `/dai-ly/ban-hang`, `frontend/web-site/src/pages/Dealer/SalesOrder/SalesOrder.jsx`.
- Handler/API/backend/kỳ vọng:
  1. `handleSingleConfirm()` → `dealerOrderService.confirmOrder()` → `POST /api/customer-orders/{id}/confirm/` → `dealer_confirm_order()` → `confirmed`.
  2. `handleStartProcessing()` → `startProcessing()` → `POST .../start-processing/` → `dealer_start_processing()` → `processing`.
  3. `handleShipOrder()` → `shipOrder()` → `POST .../ship/` → `dealer_start_shipping()` → `shipping`.

### Bước 15 — Buyer xác nhận giao hàng và hoàn tất

- Màn hình: `/cua-hang/{dealerSlug}/theo-doi-don-hang`, component `frontend/web-site/src/components/User/OrderTracking/OrderDetailModal.jsx`.
- Handler: handler tại modal gọi `buyerOrder.confirmReceived(dealerSlug, order.id)`.
- API: `POST /api/storefronts/{dealerSlug}/orders/{id}/confirm-received/`.
- Backend: `StorefrontOrderConfirmReceivedView.post()` → `buyer_confirm_received()`.
- Kỳ vọng: `shipping → completed` trực tiếp; `delivered_at` và `completed_at` được ghi; payment COD thành `paid`; `paid_amount=total_amount`, `debt_amount=0`; thống kê customer được cập nhật.

### Bước 16 — Chốt demo bằng truy vết

- Mở history PO và đơn buyer để chỉ ra actor, thời gian và chuỗi trạng thái.
- Mở kho dealer để so sánh: nhập `IMPORT` làm tăng tồn, buyer order `SALE` làm giảm tồn.
- Chỉ ra liên kết sản phẩm: supplier product → dealer product → order item.
- Không sửa DB trực tiếp trong lúc demo; nếu cần làm nhanh, chuẩn bị sẵn một bản ghi ở mỗi checkpoint.

---

## 4. Các chức năng nên tránh demo

### 4.1. Màn hình checkout giả

- Tránh `/cua-hang/{dealerSlug}/dat-hang-1`.
- `frontend/web-site/src/pages/User/CheckoutPage.jsx` tự khai báo mock address/items, delay 800 ms và alert mã `ORD-2026-001`; các URL API trong comment cũng không khớp API thật.
- Dùng `/dat-hang` với `frontend/web-site/src/pages/User/Order.jsx`.

### 4.2. Màn hình thanh toán buyer giả/chưa nối backend

- Tránh `/cua-hang/{dealerSlug}/thanh-toan`.
- `frontend/web-site/src/pages/User/Payment.jsx` import `mockBankingInfo`, `mockOrderItems`, `mockShippingAddress`; `handleConfirmPayment()` chỉ `console.log`.
- Banking/e-wallet buyer hoàn chỉnh: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.

### 4.3. “Kho supplier” trên frontend

- Tránh dùng `/nha-cung-cap/kho-hang` như bằng chứng tồn kho thật; route này không có trong `App.jsx`.
- `frontend/web-site/src/pages/Supplier/Inventory.jsx` chứa mock data.
- Backend kho supplier/batch supplier: **KHÔNG TÌM THẤY TRONG SOURCE CODE**. Thiết kế thật là sản xuất/thu hoạch theo PO.

### 4.4. Fallback mock che lỗi API

- `frontend/web-site/src/services/api/dealerProductService.js` trả `MOCK_DEALER_PRODUCTS` khi API lỗi hoặc danh sách thật rỗng; `getById` cũng fallback mock.
- `frontend/web-site/src/services/api/userOrderService.js` có `MOCK_USER_ORDERS`.
- Không dùng dữ liệu xuất hiện sau khi tắt backend làm bằng chứng hệ thống hoạt động. Trong demo, mở Network hoặc đối chiếu mã/ID vừa tạo.

### 4.5. Trang đổi mật khẩu buyer phụ

- `frontend/web-site/src/components/User/Profile/ChangePasswordForm.jsx` ghi rõ “Tạm mock”.
- Backend thực có `/api/change-password/` trong `backend/apps/accounts/urls.py`, nhưng component này chưa nối; tránh demo từ component đó.

### 4.6. Chuỗi trạng thái buyer hai bước delivered/completed

- Không tuyên bố có hai nút riêng “đã giao” rồi “hoàn tất”.
- Backend thực `buyer_confirm_received()` chuyển `shipping → completed` trực tiếp.
- Comment ở `buyerOrder.js` là mismatch tài liệu frontend.

### 4.7. Thanh toán tự động và hoàn tiền thật

- VietQR chỉ tạo nội dung chuyển khoản; biên lai được supplier xác minh.
- B2C COD chỉ được đánh dấu paid khi buyer xác nhận.
- API ngân hàng webhook, cổng MoMo/VNPay thực, tự động chuyển tiền/hoàn tiền: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.

### 4.8. Demo đồng thời nhiều request nhạy cảm

- Không double-click duyệt thanh toán cuối và không mở hai tab cùng duyệt.
- `supplier_verify_payment()` chưa khóa payment/order bằng `select_for_update()`; `_complete_order()` có thể bị gọi lặp trong race.
- Không tạo đồng thời hai đơn cho cùng dealer trong cùng ngày vì mã dùng `count()+1`.

### 4.9. Tuyên bố production security hoàn chỉnh

- Không demo hoặc công bố cấu hình mặc định là an toàn production.
- `DEBUG`, CORS allow-all và secret fallback đều cần environment override.
- Không upload dữ liệu nhạy cảm thật lên media local vì source ghi rõ disk Render free có thể mất khi restart/redeploy.

### 4.10. Truy vết nhiều lô vật lý

- Không trình bày `MAIN` như quản lý riêng từng lô nhập. Source cộng dồn vào một canonical batch.
- Nếu hội đồng hỏi FIFO nhiều lô, trả lời đúng: mô hình hiện tại đã đơn giản hóa về một lô bán được cho mỗi sản phẩm dealer; mở rộng multi-batch là hướng tiếp theo.

### 4.11. AI khi chưa có dữ liệu huấn luyện

- Endpoint AI có thật nhưng kết quả phụ thuộc dữ liệu/model đã train.
- Không dùng màn `/dai-ly/du-bao-ai` làm phần bắt buộc của demo end-to-end nếu chưa chạy và kiểm tra dữ liệu.

---

## 5. Các business rule quan trọng

1. Supplier phải approved và account active mới tạo/sửa sản phẩm hoặc nhận đơn hợp lệ.
2. Sản phẩm supplier mới luôn `pending`; dealer chỉ đặt sản phẩm `active`, có giá sỉ và thuộc đúng supplier.
3. Một payload nhập hàng có thể tách thành nhiều PO theo supplier; dòng trùng sản phẩm được gộp.
4. Giá và mức giảm B2B được snapshot vào dòng PO.
5. Supplier thay ngày/số lượng thì dealer phải xác nhận điều chỉnh.
6. Cọc chỉ nộp khi PO `confirmed`; supplier duyệt cọc mới được chuẩn bị/giao.
7. Dealer chỉ xác nhận nhận hàng khi PO `shipping`.
8. Thanh toán cuối chỉ khi PO `delivered`; duyệt thanh toán cuối mới `completed` và nhập kho.
9. Kho dealer dùng sản phẩm/lô canonical; mọi biến động có `DealerInventoryTransaction`.
10. Storefront chỉ công khai dealer active và sản phẩm dealer active.
11. Buyer token bị giới hạn theo storefront dealer.
12. Đơn buyer hiện là COD, trừ tồn ngay khi tạo.
13. Dealer xử lý buyer order theo `pending → confirmed → processing → shipping`.
14. Buyer xác nhận từ `shipping` làm đơn `completed` và COD `paid`.
15. Hủy đơn buyer hợp lệ hoàn tồn; trả hàng được duyệt cũng hoàn tồn.
16. B2B cho trả một phần; B2C hiện trả toàn bộ đơn.
17. Mỗi chuyển trạng thái chính được ghi history và phát notification.

---

## 6. Điểm mạnh và giới hạn thực tế

### Điểm mạnh

- Phân tách rõ domain B2B, kho dealer, storefront B2C.
- RBAC và kiểm tra ownership ở backend.
- State machine có guard thay vì cho client ghi status tùy ý.
- Snapshot giá giúp đơn lịch sử không bị thay đổi theo catalog.
- Transaction và khóa dòng được dùng ở nhiều thao tác tồn kho.
- Có ledger biến động tồn, lịch sử trạng thái và notification.
- Storefront theo slug; permission đối chiếu slug với `Account.store_dealer` trong DB, không chỉ dựa vào claim JWT.
- Luồng nhập PO tự nối supplier product sang dealer product và kho.

### Giới hạn

- Checkout/Payment phụ vẫn còn màn mock; một số service fallback mock có thể che lỗi.
- B2C chỉ có COD thực; B2B là xác minh biên lai thủ công.
- Kho supplier và tích hợp vận chuyển bên thứ ba không có.
- Kho dealer canonical `MAIN` làm mất chi tiết nhiều lô nhập vật lý.
- Race sinh mã đơn bằng `count()+1`.
- Duyệt payment cuối chưa có khóa/idempotency đủ mạnh.
- Cấu hình bảo mật mặc định phục vụ development, chưa an toàn nếu deploy mà không override env.
- Media local không bền vững trên hạ tầng ephemeral.
- Có comment/frontend status không khớp backend.
- AI có endpoint nhưng không phải bằng chứng rằng model luôn có dữ liệu tốt hoặc đã train.

---

## 7. Cheat sheet trả lời miệng

- **Một câu mô tả:** “Smart Green Market là nền tảng B2B2C: supplier được duyệt bán sỉ cho dealer, PO hoàn tất tự nhập kho dealer, dealer mở storefront và xử lý đơn COD của buyer.”
- **Nguồn sự thật:** “Backend service/state machine là nguồn quyết định; frontend chỉ gọi API và hiển thị.”
- **Duyệt sản phẩm:** “Supplier tạo `pending`; admin gọi `/supplier-products/{id}/verify/` để thành `active`.”
- **PO:** “Tạo → supplier xác nhận → cọc → supplier duyệt → giao → dealer nhận → thanh toán cuối → completed.”
- **Nhập kho:** “Chỉ sau duyệt thanh toán cuối; `_complete_order()` gọi `_import_dealer_inventory()`.”
- **Kho:** “Một sản phẩm dealer dùng canonical batch `MAIN`; transaction ghi import/sale/restore.”
- **Buyer:** “Storefront public để xem hàng; đặt hàng cần JWT buyer đúng dealer; đơn thực hiện COD.”
- **Buyer status:** “Luồng demo là `pending → confirmed → processing → shipping → completed`; xác nhận nhận hàng chuyển thẳng completed.”
- **Nhất quán:** “Atomic transaction, snapshot giá, state guard, history, ownership check.”
- **Không nói quá:** “Không có kho supplier, không có payment gateway/webhook thật, không có logistics carrier integration.”
- **Rủi ro chính:** “Sinh mã `count()+1` và duyệt payment cuối thiếu khóa/idempotency.”
- **Nếu hỏi mock:** “Có hai màn phụ mock là `dat-hang-1` và `thanh-toan`; demo dùng trang `dat-hang` nối `buyerOrder.create()` thật.”
- **Nếu hỏi bảo mật:** “Có JWT/RBAC và token storefront scoped, nhưng production phải tắt DEBUG, giới hạn CORS, thay secret và dùng media storage bền vững.”
- **Nếu hỏi mở rộng:** “Ưu tiên idempotency payment, sequence mã đơn, multi-batch/lot traceability, payment webhook và logistics integration.”

## 8. Câu kết bảo vệ đề xuất

“Điểm hoàn chỉnh nhất của source hiện tại không phải một màn hình đơn lẻ, mà là chuỗi dữ liệu xuyên suốt: sản phẩm supplier đã duyệt tạo ra PO có snapshot giá; PO hoàn tất sinh tồn kho và sản phẩm dealer; storefront bán đúng tồn đó; buyer order trừ tồn, ghi lịch sử, và hoàn tất COD. Em đồng thời thừa nhận các phần chưa hoàn chỉnh trong source gồm payment tự động, kho supplier, multi-lot đầy đủ, một số màn mock và hai rủi ro concurrency cần bổ sung idempotency/locking.”
