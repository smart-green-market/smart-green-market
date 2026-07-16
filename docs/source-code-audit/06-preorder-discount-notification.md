# 06. Kiểm toán source code: đặt trước, giảm giá và thông báo

## 1. Phạm vi và kết luận kiểm toán

Tài liệu này đối chiếu trực tiếp source code backend Django/DRF, web React và mobile Flutter tại thời điểm kiểm toán. Các kết luận âm tính bên dưới dùng đúng nghĩa: đã tìm trên toàn repository theo tên model, field, service, migration, API và từ khóa liên quan nhưng không có triển khai tương ứng.

### Kết luận chính

| Chủ đề | Kết luận từ source code |
|---|---|
| Thiếu tồn một phần | Web/mobile cho buyer chọn **một trong ba**: đặt phần đang có, đặt trước toàn bộ số lượng yêu cầu, hoặc bỏ sản phẩm. Không có lựa chọn vừa mua phần có sẵn vừa đặt trước đúng phần thiếu cho cùng một dòng. |
| Giữ tồn cho đặt trước | YC đặt trước không trừ tồn, không giữ tồn hiện có và không giữ chỗ hàng tương lai. |
| `InventoryReservation` | **KHÔNG TÌM THẤY TRONG SOURCE CODE**. |
| `reserved_qty` / `reserved_quantity` | **KHÔNG TÌM THẤY TRONG SOURCE CODE**. |
| FIFO nhiều lô | Không tồn tại trong đường chạy hiện hành. Mỗi sản phẩm dùng một lô chuẩn `MAIN`; code gọi `.first()` nhưng queryset đã khóa vào `batch_number="MAIN"`. |
| Phân bổ nhiều lô cho một dòng | Không có. Một `OrderItem` chỉ có một FK `batch`; chỉ phân bổ khi một lô `MAIN` đủ toàn bộ số lượng dòng. |
| Đơn `waiting_stock` | Được tạo từ YC đã được dealer xác nhận hoặc buyer chấp nhận đề xuất; các `OrderItem.batch` ban đầu là `NULL`; COD pending được tạo ngay. |
| Nhập hàng và phân bổ | Chỉ thấy trigger tự động từ hoàn tất phiếu nhập B2B: cộng lô `MAIN`, rồi gọi `try_allocate_waiting_orders()`. |
| Trễ hạn / not-on-time | Không có job, cron, signal, query overdue, trạng thái overdue hay tự động reschedule/cancel/escalate. Dealer phải chủ động đề xuất đổi ngày khi đơn còn `waiting_stock`. |
| Voucher trên preorder | Không được mang vào `PreOrderRequest` hoặc đơn `waiting_stock`; đơn chuyển từ preorder luôn `discount_amount=0`. |
| Voucher | Dealer/admin CRUD; admin verify; buyer xem/lưu/bỏ lưu/preview apply; usage chỉ ghi lúc tạo đơn thường. Giới hạn usage có race do không khóa voucher/usage counter. |
| Giảm theo số lượng | Chỉ áp dụng cho phiếu nhập B2B `PurchaseOrderItem`, snapshot vào dòng phiếu nhập. |
| Giảm theo tuổi/khung giờ | Áp dụng vào giá B2C theo lô `MAIN` lúc tạo đơn thường hoặc lúc phân bổ đơn chờ hàng. |
| Thông báo | DB gồm `Notification` và `NotificationReceipt`; push WebSocket theo account; email tùy cấu hình; REST list/read/read-all có tồn tại. |
| Frontend read-all | Backend có endpoint `mark_all_read`; web buyer và supplier lại gọi `mark_read` N lần; mobile không có thao tác read-all. |
| Frontend refresh | Web phát custom event từ WebSocket và refetch các màn hình order/preorder; mobile refresh order khi nhận notification liên quan và còn poll 45 giây. |

---

## 2. Bằng chứng kiến trúc tồn kho và reservation

### 2.1. Model tồn kho thực tế

`backend/apps/dealer_products/models.py` định nghĩa:

- `DealerProduct`: sản phẩm bán lẻ thuộc `dealer_profile`.
- `DealerInventoryBatch`: `quantity`, `remaining_quantity`, `import_price`, `import_date`, `production_date`, `expiry_date`, `manual_sale_price`, `status`, `deleted_at`.
- `DealerInventoryTransaction`: lịch sử `import`, `sale`, `cancel_restore`, `return_restore`, `wastage`, `adjustment`.
- Ràng buộc duy nhất: `(dealer_product, batch_number)`.

`backend/apps/dealer_products/canonical_inventory.py` quy định:

- `CANONICAL_BATCH_NUMBER = "MAIN"`.
- `get_or_create_main_batch()` lấy hoặc tạo đúng lô `MAIN`.
- `add_import_to_main_batch()` cộng dồn cả `quantity` và `remaining_quantity` vào `MAIN`, ghi transaction `IMPORT`.
- Mỗi lần nhập mới ghi đè `import_price` và `import_date` của chính lô cộng dồn.

`backend/apps/dealer_products/inventory_queries.py` quy định:

- `get_sellable_batches_qs()` chỉ lấy `batch_number="MAIN"`, `status=active`, `remaining_quantity>0`, chưa xóa.
- Có `select_for_update()` khi caller truyền `for_update=True`.
- `annotate_dealer_product_stock()` tính `available_quantity` chỉ từ lô `MAIN` bán được.

### 2.2. Chứng minh `InventoryReservation` và `reserved_qty`

| Hạng mục tìm kiếm toàn repository | Kết quả |
|---|---|
| Class/model `InventoryReservation` | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Field/biến `reserved_qty` | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Field/biến `reserved_quantity` | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Migration tạo bảng reservation | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Transaction type reserve/release | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Quan hệ từ preorder tới reservation | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |

`PreOrderRequestItem.available_at_submit` chỉ là snapshot số lượng thấy lúc gửi YC. Nó không làm giảm `DealerInventoryBatch.remaining_quantity`.

`OrderItem.batch=NULL` chỉ biểu thị dòng chưa được phân bổ. Đây không phải reservation vì không có số lượng giữ riêng, không loại khỏi `available_quantity`, và không ngăn đơn thường bán số hàng đó.

### 2.3. Chứng minh FIFO nhiều lô không tồn tại

| Bằng chứng | Ý nghĩa |
|---|---|
| `canonical_inventory.CANONICAL_BATCH_NUMBER = "MAIN"` | Luồng hiện hành gom tồn của một sản phẩm vào một lô chuẩn. |
| `get_sellable_batches_qs()` lọc cứng `batch_number="MAIN"` | Query bán hàng không nhìn các batch number khác. |
| `orders.services._allocate_batches()` lấy `.first()` và yêu cầu batch đó đủ toàn bộ quantity | Không duyệt nhiều batch, không chia quantity. |
| `waiting_stock_services._try_allocate_order_item()` cũng lấy `.first()` và yêu cầu `remaining_quantity >= quantity` | Đơn chờ hàng cũng không chia lô. |
| `OrderItem.batch` là một FK đơn | Một dòng đơn không biểu diễn nhiều allocation. |
| `add_import_to_main_batch()` cộng dồn nhập mới vào `MAIN` | Tuổi, giá nhập, ngày nhập của nhiều lần nhập không được giữ thành các lô FIFO độc lập. |

Kết luận: tên docstring/comment như “FIFO” và “Một SP có thể tách nhiều dòng theo lô” trong `backend/apps/orders/services.py` không khớp đường chạy hiện tại. **FIFO nhiều lô: KHÔNG TÌM THẤY TRONG SOURCE CODE đang thực thi.**

---

## 3. Luồng UI → API → service → DB cho thiếu tồn và preorder

### 3.1. Bảng quy trình rộng

| Bước | Web UI / hàm | Mobile UI / hàm | Endpoint / permission | Backend class / serializer | Service / DB write | Status / notification / lỗi |
|---|---|---|---|---|---|---|
| Mở checkout | `frontend/web-site/src/pages/User/Order.jsx`, `OrderPage` | `modules/checkout/controllers/checkout_controller.dart` | GET `/api/storefronts/{slug}/delivery-slots/`; route public nhưng dealer phải active | `StorefrontDeliverySlotsView` | `get_available_delivery_slots()` | Slot thường chỉ trong `SystemSettings.max_booking_days`; giờ VN. |
| Preview voucher | `handleApplyVoucher()` | `CheckoutController.applyVoucher()` | POST `/api/vouchers/apply/`; `IsActive + IsBuyer` | `PromotionViewSet.apply`, `CartApplyVoucherSerializer` | `CartVoucherService.apply_voucher()`; không write usage | Bắt buộc voucher đã lưu; trả preview. |
| Check stock | `handleOpenConfirm()` gọi `buyerPreorder.checkStock()` | repository `checkStock()` | POST `/api/storefronts/{slug}/check-stock/`; `IsStorefrontCustomer` | `StorefrontCheckStockView`, `CheckStockRequestSerializer` | `check_items_stock()`; đánh dấu batch hết hạn rồi đọc `available_quantity` | Trả `available`, `shortfall`, `order_available_quantity`, `needs_preorder`; chưa khóa tồn. |
| Hiện lựa chọn thiếu tồn | `StockShortfallModal`; `splitCheckoutByChoices()` | `StockShortfallSheet`; `PreorderUtils.splitCheckoutByChoices()` | Không gọi API | Utility frontend | Chia local thành `orderItems`, `preorderItems`, `removedProductIds` | Mặc định chọn phần có sẵn nếu `available>0`, nếu không thì preorder. |
| Chọn “đặt phần có sẵn” | `STOCK_CHOICE.ORDER_AVAILABLE` | `StockChoice.orderAvailable` | Sau đó POST order thường | `OrderCreateSerializer` | Chỉ gửi `min(requested, available)` | Phần thiếu không được tạo preorder. |
| Chọn “đặt trước” | `STOCK_CHOICE.PREORDER` | `StockChoice.preorder` | Sau đó POST preorder | `PreOrderRequestCreateSerializer` | Gửi lại **toàn bộ quantity ban đầu** | Phần đang có không được trừ/giữ cho YC này. |
| Chọn “bỏ” | `STOCK_CHOICE.REMOVE` | `StockChoice.remove` | Không gọi API cho dòng đó | Không có | Frontend xóa khỏi cart sau khi các request thành công | Không có audit DB về quyết định bỏ. |
| Tạo đơn thường | `submitCheckout()` → `buyerOrder.create()` | `_repository.createOrder()` | POST `/api/storefronts/{slug}/orders/`; `IsStorefrontCustomer` | `StorefrontOrderListCreateView`, `OrderCreateSerializer` | `create_customer_order()` → `Order`, `OrderItem`, `CustomerPayment`, `OrderStatusHistory`, `DealerInventoryTransaction(SALE)`, có thể `PromotionUsage` | `pending`; notify dealer, actor buyer bị loại khỏi recipient. Thiếu tồn: ValidationError. |
| Tạo YC đặt trước | `submitCheckout()` → `buyerPreorder.create()` | `_repository.createPreOrder()` | POST `/api/storefronts/{slug}/preorder-requests/`; `IsStorefrontCustomer` | `StorefrontPreOrderListCreateView`, `PreOrderRequestCreateSerializer` | `create_preorder_request()` → `PreOrderRequest`, `PreOrderRequestItem` | `submitted`; notify dealer, ref `customer_preorder_request`. Không trừ tồn. |
| Dealer xem YC | `DealerPreOrderPage.fetchList/fetchDetail` | Không có màn dealer trong app buyer | GET `/api/preorder-requests/`, `/{id}/`; `IsAuthenticated + IsDealer` | `PreOrderRequestViewSet` | Query qua `filter_customer_orders()` theo `dealer__account` | Search + status filter; dữ liệu tenant dealer. |
| Dealer xác nhận nguyên YC | `handleConfirm()` | Không có | POST `/api/preorder-requests/{id}/confirm/`; `IsDealer` | action `confirm`, `PreOrderNoteSerializer` | `dealer_confirm_preorder()` → `_convert_preorder_to_waiting_stock_order()` | `PreOrderRequest: submitted→converted`; tạo `Order: waiting_stock`; buyer nhận ref `customer_order`. |
| Dealer đề xuất | `PreOrderProposeModal` → `handlePropose()` | Không có | POST `/api/preorder-requests/{id}/propose/`; `IsDealer` | action `propose`, `PreOrderProposeSerializer` | `dealer_propose_preorder()` cập nhật proposed quantity/time/note | `submitted→customer_confirmation_pending`; notify buyer ref preorder. |
| Dealer từ chối | `RejectModal` → `handleReject()` | Không có | POST `/api/preorder-requests/{id}/reject/`; `IsDealer` | action `reject`, `PreOrderRejectSerializer` | `dealer_reject_preorder()` | `rejected_by_dealer`; reason bắt buộc; notify buyer. |
| Buyer xem đề xuất | `PreOrderRequestsPage` | `modules/preorder/views/preorder_view.dart` | GET storefront preorder list/detail; `IsStorefrontCustomer` | `StorefrontPreOrderListCreateView`, `StorefrontPreOrderDetailView` | Query customer + dealer từ token/slug | Chỉ owner trong storefront hiện tại. |
| Buyer chấp nhận | `handleAccept()` | provider `acceptPreOrder()` | POST `/api/storefronts/{slug}/preorder-requests/{id}/accept/`; `IsStorefrontCustomer` | `StorefrontPreOrderAcceptView` | `customer_accept_preorder()` → convert | Preorder `converted`, Order `waiting_stock`; dealer nhận ref `customer_order`. |
| Buyer từ chối | `handleReject()` | provider `rejectPreOrder()` | POST `/api/storefronts/{slug}/preorder-requests/{id}/reject/`; `IsStorefrontCustomer` | `StorefrontPreOrderRejectView`, reason bắt buộc | `customer_reject_preorder()` | `rejected_by_customer`; notify dealer ref preorder. |
| Hoàn tất PO nhập hàng | Không phải buyer UI | Không phải buyer UI | Qua luồng `/api/purchase-orders/...` | purchase-order views/services | `_complete_order()` → `_import_dealer_inventory()` → `add_import_to_main_batch()` | Cộng `MAIN`, transaction `IMPORT`, rồi thử allocation. |
| Allocate đơn chờ | Không có nút UI trực tiếp | Không có | Không có endpoint riêng | `waiting_stock_services.py` | `try_allocate_waiting_orders()` → set `OrderItem.batch`, SALE, có thể status history | Khi mọi item có batch: `waiting_stock→processing`; notification qua `record_status_change()`. |
| Dealer đề xuất đổi ngày | `SalesOrder.jsx` + `ProposeDeliveryRescheduleModal` | Không có dealer mobile | POST `/api/customer-orders/{id}/propose-delivery-reschedule/`; `IsDealer` | `CustomerOrderViewSet.propose_delivery_reschedule`, `ProposeDeliveryRescheduleSerializer` | `dealer_propose_delivery_reschedule()` | Chỉ `waiting_stock`; chuyển `delivery_reschedule_proposed`; notify buyer. |
| Buyer nhận ngày mới | `OrderTracking/OrderDetailModal.jsx` | API/model buyer có order tracking | POST storefront `accept-delivery-reschedule` | `StorefrontOrderAcceptDeliveryRescheduleView` | `customer_accept_delivery_reschedule()` | Cập nhật `delivery_time`; về `waiting_stock`; notify dealer. |
| Buyer từ chối ngày mới | `OrderTracking/OrderDetailModal.jsx` | API buyer | POST storefront `reject-delivery-reschedule`, body `reason` | `StorefrontOrderRejectDeliveryRescheduleView` | `customer_reject_delivery_reschedule()` → `cancel_customer_order()` | `cancelled`; hoàn các item đã có batch; cancel COD pending; notify dealer. |

### 3.2. Hành vi partial-stock thực tế

Ví dụ buyer yêu cầu 10, kho có 4:

1. `check_items_stock()` trả `available_quantity=4`, `shortfall=6`, `order_available_quantity=4`, `needs_preorder=true`.
2. Frontend không tạo một tổ hợp `order 4 + preorder 6`.
3. Nếu chọn “Đặt 4 có sẵn”: tạo order thường quantity 4; 6 thiếu bị bỏ khỏi quy trình.
4. Nếu chọn “Gửi YC đặt trước (10)”: tạo preorder quantity 10; 4 đang có vẫn bán được cho người khác.
5. Nếu chọn “Bỏ khỏi đơn”: không có record backend.

Với nhiều sản phẩm, frontend có thể tạo một order thường và một preorder request cho **các sản phẩm khác nhau**. Hai POST chạy tuần tự, không cùng transaction. Nếu POST order thành công nhưng POST preorder lỗi, order thường vẫn tồn tại; frontend đi vào `catch` trước bước xóa cart và điều hướng.

### 3.3. Điều kiện tạo và xử lý preorder

- Mỗi dòng trong `PreOrderRequest` phải có `requested_quantity > available_quantity` tại lúc validate.
- Product phải thuộc đúng dealer, `DealerProduct.status=active`.
- Dealer phải `DealerProfile.status=active`.
- Địa chỉ phải thuộc customer.
- Ngày preorder từ hôm nay đến tối đa 120 ngày, đúng giờ bắt đầu slot 07:00 hoặc 16:00 và phải ở tương lai.
- API preorder không nhận `voucher_code`.
- Dealer có thể đề xuất số lượng lớn hơn số buyer yêu cầu; backend chỉ kiểm tra `>=1`.
- Dealer không bị buộc đề xuất quantity vẫn lớn hơn tồn hiện tại.
- Dealer xác nhận nguyên YC tạo order ngay; không kiểm tra lại tồn và không thử dùng tồn hiện có.
- `PreOrderRequestStatus.CANCELLED` có trong enum/model nhưng **KHÔNG TÌM THẤY TRONG SOURCE CODE** service/API chuyển YC sang trạng thái này.

---

## 4. State machine

### 4.1. `PreOrderRequest`

| Từ trạng thái | Thao tác | Sang trạng thái | Điều kiện / side effect |
|---|---|---|---|
| — | Buyer create | `submitted` | Snapshot address, requested quantity, available-at-submit; notify dealer. |
| `submitted` | Dealer confirm | `converted` | `confirmed_quantity=requested_quantity`; tạo order `waiting_stock`; COD pending. |
| `submitted` | Dealer propose | `customer_confirmation_pending` | Ghi proposed quantity/date; notify buyer. |
| `submitted` | Dealer reject | `rejected_by_dealer` | Lý do bắt buộc; notify buyer. |
| `customer_confirmation_pending` | Buyer accept | `converted` | Tạo order `waiting_stock`; notify dealer bằng ref order. |
| `customer_confirmation_pending` | Buyer reject | `rejected_by_customer` | Lý do serializer bắt buộc; notify dealer. |
| Bất kỳ | Cancel | `cancelled` | **KHÔNG TÌM THẤY TRONG SOURCE CODE**. |

Không có `PreOrderStatusHistory`; chỉ có timestamps trên record chính.

### 4.2. `Order` liên quan preorder

| Từ | Sang | Hàm |
|---|---|---|
| — | `waiting_stock` | `_convert_preorder_to_waiting_stock_order()` |
| `waiting_stock` | `processing` | `try_allocate_waiting_orders()` khi tất cả item có batch |
| `waiting_stock` | `delivery_reschedule_proposed` | `dealer_propose_delivery_reschedule()` |
| `delivery_reschedule_proposed` | `waiting_stock` | `customer_accept_delivery_reschedule()` |
| `delivery_reschedule_proposed` | `cancelled` | `customer_reject_delivery_reschedule()` |
| `waiting_stock` / `delivery_reschedule_proposed` | `cancelled` | dealer/admin cancel; buyer chỉ cancel được `delivery_reschedule_proposed`, không cancel trực tiếp `waiting_stock` |
| `processing` | `shipping` | `dealer_start_shipping()` |
| `shipping` | `completed` | `buyer_confirm_received()` |

Sau allocation, flow bỏ qua `confirmed` và đi thẳng `processing`.

---

## 5. Hồ sơ các hàm quan trọng

| Hàm | File | Input chính | Write/lock | Kết quả và giới hạn |
|---|---|---|---|---|
| `check_items_stock` | `backend/apps/orders/preorder_services.py` | dealer, list product/quantity | Gọi expire marking; không lock stock | Snapshot tức thời, có TOCTOU trước create. |
| `create_preorder_request` | cùng file | dealer/customer/address/date/items | `transaction.atomic`; tạo preorder + items | Không reserve/trừ kho. Notify được gọi trong transaction. |
| `dealer_confirm_preorder` | cùng file | preorder, dealer user | `transaction.atomic`; không `select_for_update` preorder | Chuyển trực tiếp thành order chờ. |
| `dealer_propose_preorder` | cùng file | date, item quantity map, note | `transaction.atomic`; không row lock | Chỉ chấp nhận trạng thái `submitted`; quantity chỉ min 1. |
| `_convert_preorder_to_waiting_stock_order` | cùng file | preorder, actors | Tạo Order/OrderItem/COD/history | Item `batch=NULL`; giá ban đầu là `retail_price`; discount 0. |
| `_allocate_batches` | `backend/apps/orders/services.py` | product, quantity | Query lô `MAIN` với `select_for_update` | Một batch phải đủ toàn bộ quantity. |
| `_build_order_items` | cùng file | order, items, voucher | Trừ `MAIN`; ghi SALE; có thể ghi PromotionUsage | Giá tuổi/khung giờ được tính trước voucher. |
| `_try_allocate_order_item` | `backend/apps/orders/waiting_stock_services.py` | OrderItem | Khóa batch qua `_active_batches_qs`; không khóa OrderItem | Chỉ allocate cả dòng; cập nhật giá item và trừ kho. |
| `try_allocate_waiting_orders` | cùng file | product id hoặc tất cả | `transaction.atomic` | Ưu tiên `delivery_time`, `created_at`, order/item id; chỉ status `waiting_stock`. |
| `_import_dealer_inventory` | `backend/apps/purchase_orders/services.py` | completed PO | Cộng lô `MAIN`, sau đó gọi allocator | Chỉ item PO đã approved và quantity còn lại sau return. |
| `dealer_propose_delivery_reschedule` | `backend/apps/orders/delivery_reschedule_services.py` | new date/reason | `transaction.atomic` | Chỉ `waiting_stock`; date mới phải là slot checkout đang khả dụng. |
| `CartVoucherService.apply_voucher` | `backend/apps/voucher/services.py` | customer, code, cart items | Read-only | Preview trên `DealerProduct.retail_price`; không usage. |
| `CartVoucherService.apply_voucher_to_order` | cùng file | order, code | Tạo `PromotionUsage`; không lock voucher/counter | Tính trên `OrderItem.subtotal`; yêu cầu saved. |
| `notify_account` | `backend/common/notifications.py` | account/message/ref | Tạo Notification + Receipt, push WS, gửi email | Push/email không dùng `transaction.on_commit`. |
| `serialize_notification_receipt_for_push` | `backend/apps/notifications/serializers_api.py` | receipt | Read reference status/code | Payload REST và WS dùng cùng shape. |

---

## 6. Bảng API, permission và tenant boundary

| API | Method | Permission | Tenant/ownership |
|---|---|---|---|
| `/api/storefronts/{slug}/check-stock/` | POST | `IsStorefrontCustomer` | Token buyer phải có `store_dealer.slug == slug`; product query lọc dealer. |
| `/api/storefronts/{slug}/preorder-requests/` | GET/POST | `IsStorefrontCustomer` | GET lọc customer + dealer; POST dealer lấy từ slug active. |
| `/api/storefronts/{slug}/preorder-requests/{id}/` | GET | `IsStorefrontCustomer` | Lọc customer + dealer trước `.get()`. |
| `.../{id}/accept/`, `.../{id}/reject/` | POST | `IsStorefrontCustomer` | Cùng queryset owner. |
| `/api/preorder-requests/` | GET | `IsAuthenticated + IsDealer` | `filter_customer_orders()` lọc `dealer__account=user`. |
| `/api/preorder-requests/{id}/confirm|propose|reject/` | POST | `IsDealer` | Object lấy từ queryset đã lọc dealer. |
| `/api/customer-orders/{id}/propose-delivery-reschedule/` | POST | `IsDealer` | Queryset lọc dealer; view kiểm tra lại `order.dealer.account_id`. |
| `/api/storefronts/{slug}/orders/{id}/accept-delivery-reschedule/` | POST | `IsStorefrontCustomer` | Query owner customer + dealer. |
| `/api/storefronts/{slug}/orders/{id}/reject-delivery-reschedule/` | POST | `IsStorefrontCustomer` | Query owner customer + dealer. |
| `/api/vouchers/` | CRUD | `IsActive + IsAdminOrDealer` | Admin tất cả; dealer chỉ `dealer__account=user`. |
| `/api/vouchers/{id}/verify/` | POST | `IsActive + IsAdmin` | Admin có thể verify mọi voucher trong queryset. |
| `/api/vouchers/available/` | GET | `IsActive + IsBuyer` | Dealer lấy từ `request.user.store_dealer`; query param `dealer_slug` không được đọc. |
| `/api/vouchers/saved/` | GET | `IsActive + IsBuyer` | Lọc customer; không lọc dealer/active/time. |
| `/api/vouchers/{id}/save/` | POST | `IsActive + IsBuyer` | Chỉ save promotion nằm trong available của `store_dealer`. |
| `/api/vouchers/{id}/unsave/` | DELETE | `IsActive + IsBuyer` | Xóa theo customer + `promotion_id=pk`. |
| `/api/vouchers/apply/` | POST | `IsActive + IsBuyer` | Customer từ token; product/dealer được kiểm tra bởi target/dealer logic. |
| `/api/notifications/my/` | GET | Global default `IsAuthenticated` | Chỉ receipt có `account=request.user`. |
| `/api/notifications/{notification_id}/mark_read/` | POST | Global default `IsAuthenticated` | Update receipt theo notification + current account. |
| `/api/notifications/mark_all_read/` | POST | Global default `IsAuthenticated` | Update mọi unread receipt của current account. |
| `/api/notifications/` và `/{id}/` | CRUD | `IsAdmin` | User thường không dùng retrieve detail này. |
| `/ws/notifications/?token=JWT` | WebSocket | JWT middleware + authenticated user | Group `notifications_{user.id}`. |

---

## 7. Model và dữ liệu được lưu

### 7.1. Preorder/order/inventory

| Model/bảng | Field quyết định | Ghi chú |
|---|---|---|
| `PreOrderRequest` / `preorder_requests` | customer, dealer, status, requested/confirmed/proposed delivery, notes, reject reason, converted_order | `converted_order` là FK nullable, không phải one-to-one và không có DB unique. |
| `PreOrderRequestItem` / `preorder_request_items` | requested, available-at-submit, confirmed, proposed quantity | Không có reserved/allocation quantity. |
| `Order` / `orders` | status, delivery/proposed time, reschedule reason, totals | Order từ preorder có status `waiting_stock`. |
| `OrderItem` / `order_items` | dealer_product, nullable batch, quantity, unit/import price, subtotal | `batch=NULL` là pending allocation. |
| `OrderStatusHistory` | old/new status, note, changed_by | Có cho Order, không có cho PreOrderRequest. |
| `DealerInventoryBatch` | `MAIN`, remaining quantity, dates, prices, status | Một lô canonical cho đường chạy. |
| `DealerInventoryTransaction` | type, before/change/after, reason, actor | Audit nhập/bán/hoàn tồn. |

### 7.2. Voucher

| Model/bảng | Ràng buộc / trạng thái |
|---|---|
| `Promotion` / `promotions` | `code` có `unique=True` toàn cục; status `draft/pending/active/inactive/expired/rejected`; dealer nullable nghĩa platform voucher. |
| `PromotionTarget` / `promotion_targets` | Model hỗ trợ `all/segment/product/category/customer`; serializer quản trị hiện chỉ chấp nhận `segment`. |
| `CustomerSavedVoucher` / `customer_saved_vouchers` | Unique `(customer, promotion)`; lưu không đồng nghĩa đã dùng. |
| `PromotionUsage` / `promotion_usages` | Unique `(promotion, order)`; discount snapshot; không có status reversed/cancelled. |

### 7.3. Notification/receipt

| Model/bảng | Field / semantics |
|---|---|
| `Notification` | title, content, type, nullable `reference_type`, nullable `reference_id`, created_by, created_at |
| `NotificationReceipt` | notification, account, nullable `read_at`, created_at; unique `(notification, account)` |

Recipient không nằm trên `Notification`; recipient thật là từng `NotificationReceipt.account`.

`CustomerPayment.receipt_file` trong `backend/apps/orders/models.py` là file biên lai thanh toán và không liên quan `NotificationReceipt`.

---

## 8. Phân bổ nhập hàng, ưu tiên và reschedule

### 8.1. Thứ tự allocation

`_order_items_pending_allocation(dealer_product_id)` chọn:

1. `batch IS NULL`;
2. order status đúng `waiting_stock`;
3. đúng `dealer_product_id`;
4. sort `order.delivery_time`, `order.created_at`, `order_id`, `item_id`.

Đây là ưu tiên theo hạn giao/tuổi order, không phải FIFO batch.

### 8.2. Allocation toàn phần và allocation một phần theo order

- Một item chỉ allocate khi lô `MAIN.remaining_quantity >= item.quantity`.
- Nếu không đủ, item giữ `batch=NULL`, không trừ một phần.
- Một order nhiều item có thể bị **phân bổ một phần theo số dòng**: item A đủ sẽ bị trừ kho và gắn batch; item B thiếu vẫn NULL.
- Order chỉ sang `processing` khi không còn item `batch=NULL`.
- Khi hủy, `_restore_order_inventory()` hoàn các item đã có batch và bỏ qua item NULL.

### 8.3. Trigger nhập hàng

Đường trigger tìm thấy:

`supplier final-payment verification` → `_complete_order()` → status PO `completed` → `_import_dealer_inventory()` → `get_or_create_canonical_dealer_product()` → `add_import_to_main_batch()` → `try_allocate_waiting_orders()`.

Nếu tồn được thay đổi bằng đường khác, trigger allocator tự động tương ứng: **KHÔNG TÌM THẤY TRONG SOURCE CODE** ngoài call trong `backend/apps/purchase_orders/services.py` và các test gọi trực tiếp.

### 8.4. Reschedule và not-on-time

Hành vi có thật:

- Dealer chỉ được đề xuất khi status chính xác là `waiting_stock`.
- Reason bắt buộc.
- Ngày mới phải khác ngày hiện tại.
- Serializer dùng `resolve_delivery_time()`, tức cửa sổ checkout ngắn theo system setting, không dùng cửa sổ preorder 120 ngày.
- Buyer accept: copy proposed vào `delivery_time`, xóa proposal/reason, status về `waiting_stock`.
- Buyer reject: xóa proposal/reason rồi cancel order.

Hành vi **KHÔNG TÌM THẤY TRONG SOURCE CODE**:

- Trạng thái `overdue`, `late`, `not_on_time`.
- Job/cron/Celery task quét `delivery_time < now`.
- Tự động báo dealer/buyer khi sắp trễ hoặc đã trễ.
- Tự động chuyển sang `delivery_reschedule_proposed`.
- SLA, deadline xử lý đề xuất hoặc auto-cancel.
- Chặn allocation/processing sau thời điểm giao đã qua.

Mismatch cụ thể: khi order đang `delivery_reschedule_proposed`, allocator không chọn order đó. Nếu hàng nhập trong lúc chờ buyer, không allocation. Khi buyer accept và order trở lại `waiting_stock`, service accept không gọi allocator; số hàng đã có chỉ được thử lại khi có một lần trigger allocation khác.

---

## 9. Voucher: tạo, duyệt, lưu, áp dụng, usage, limit, thời gian, target

### 9.1. Tạo và quản trị

Web dealer:

- `frontend/web-site/src/pages/Dealer/Discount/DealerDiscountPage.jsx`.
- Modal `CreateVoucherModal.jsx`.
- Service `voucherService.create()` → POST `/api/vouchers/`.
- UI buộc title/code/discount/date/segment; percent `<=100`; giá trị giảm `>0`; usage input `min=1`; daily start/end khác nhau.
- Payload target luôn `{target_type: "segment", segment: id}`.

Backend:

- `PromotionSerializer.create()` gán `dealer=request.user.dealer_profile` nếu có và `created_by=request.user`.
- Status là read-only, nên dùng default model `pending`.
- Admin create không có dealer profile nên tạo platform voucher `dealer=NULL`.
- Duplicate code được normalize uppercase và check toàn cục; `IntegrityError` được đổi thành validation error.
- Delete không xóa row: `perform_destroy()` chuyển `status=inactive`.

### 9.2. Admin verify

- Web `frontend/web-site/src/pages/Admin/Voucher.jsx`.
- `handleApprove()` gửi `{status:"active"}`.
- `handleReject()` gửi cả `rejection_reason` và `reject_reason`; backend chỉ đọc `reject_reason`.
- Backend `PromotionViewSet.verify()` chỉ admin, chấp nhận `active` hoặc `rejected`.
- Reject bắt buộc reason.
- Không kiểm tra voucher đang `pending`; admin có thể verify lại record ở trạng thái khác.
- Không tự chuyển `active→expired` khi qua `end_date`; kiểm tra khả dụng dựa cả status và thời gian.
- Notification cho dealer khi admin duyệt/từ chối voucher: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.

### 9.3. Available, save, saved, unsave

`_available_promotions_for_customer()` lọc:

- `status=active`;
- `start_date <= now <= end_date`;
- đúng dealer hiện tại hoặc platform;
- chưa đạt global/customer usage limit;
- target không có, `all`, segment match, customer match, hoặc có product/category target;
- `is_within_daily_time(now)`.

`save()` chỉ lưu voucher thuộc queryset available; dùng `get_or_create`.

`saved()` trả mọi voucher đã lưu của customer, kể cả đã inactive/expired/khác dealer; không gọi `_available_promotions_for_customer()`.

Web/mobile đều gửi query `dealer_slug` cho available/saved, nhưng backend không đọc query này mà dùng `request.user.store_dealer` cho available và không dealer-filter cho saved.

### 9.4. Apply preview và apply thật

Preview `/vouchers/apply/`:

1. Tìm voucher theo code toàn cục.
2. Validate status/date/daily time.
3. Bắt buộc `CustomerSavedVoucher`.
4. Đếm global/per-customer usages.
5. Validate customer target.
6. Load `DealerProduct`.
7. Tính `order_total` bằng `retail_price * quantity`.
8. Tính `eligible_total` theo dealer/product/category target.
9. Check `min_order_amount` trên toàn cart.
10. Tính percent/fixed, cap max và không vượt eligible total.
11. Không tạo usage.

Apply thật trong `create_customer_order()`:

1. Lock/trừ kho và tạo OrderItem với giá age/manual hiện hành.
2. Set `order.subtotal_amount`.
3. `apply_voucher_to_order()` validate lại.
4. Check min trên subtotal thật.
5. Tính eligible từ `OrderItem.subtotal`.
6. Tạo `PromotionUsage`.
7. Tính total/COD.

Do preview dùng `retail_price` còn order thật dùng age/manual effective price, preview và checkout write có thể trả kết quả khác nhau. Backend write là kết quả cuối.

### 9.5. Usage và giới hạn

- Global usage: `voucher.usages.count()`.
- Mỗi customer: usages có `order__customer=customer`.
- Usage được tạo ngay khi order được tạo, không chờ paid/completed.
- Hủy order không xóa/đảo `PromotionUsage`; lượt vẫn bị tính.
- Bỏ lưu voucher sau khi dùng không ảnh hưởng usage.
- Unique `(promotion, order)` ngăn cùng voucher ghi hai lần cho cùng order.
- Không có `select_for_update`, counter atomically increment hoặc constraint chống vượt `usage_limit`; nhiều checkout đồng thời có thể cùng đọc count còn chỗ rồi cùng tạo usage.

### 9.6. Thời gian

- `date_range`: chỉ start/end.
- `daily_time`: vẫn cần start/end campaign và thêm daily start/end.
- Khung qua nửa đêm được hỗ trợ: nếu start > end thì `current >= start OR current <= end`.
- Daily time dùng giờ Việt Nam qua `common.timezone.vn_current_time`.
- Start/end dùng aware datetime của Django.

### 9.7. Target

| Target model hỗ trợ | Admin/dealer serializer tạo được | Apply service hỗ trợ |
|---|---:|---:|
| `all` | Không | Có |
| `segment` | Có | Có |
| `product` | Không | Có |
| `category` | Không | Có |
| `customer` | Không | Có |

Nếu voucher không có customer-type target nhưng có product/category target, customer validation cho qua và product matcher quyết định eligible item.

### 9.8. Validation mismatch

- Backend `PromotionSerializer` không kiểm tra `discount_value > 0`.
- Backend không chặn percent > 100.
- Backend không chặn `min_order_amount` hoặc `max_discount_amount` âm.
- Serializer usage limit không khai báo `min_value=1`; model là `PositiveIntegerField`, nhưng validation API không diễn đạt đầy đủ rule UI.
- UI tạo voucher có các chặn trên; API trực tiếp không có cùng mức validation.
- `Promotion.code` vừa `unique=True` toàn cục vừa có conditional unique `(dealer, code)`; ràng buộc theo dealer không làm code tái sử dụng được vì unique toàn cục đã chặn.
- Error unique ghi “đã tồn tại trong gian hàng” dù phạm vi thật là toàn hệ thống.

---

## 10. Cross-reference giảm theo số lượng, giảm tuổi/khung giờ và voucher

| Cơ chế | Chủ thể cấu hình | Scope | Điểm tính | Snapshot | Quan hệ với preorder/voucher |
|---|---|---|---|---|---|
| Quantity discount | Supplier | all/category/supplier_product | `compute_wholesale_unit_price()` khi tạo/review `PurchaseOrderItem` | `base_unit_price`, effective `unit_price`, discount type/value/min, line discount | Chỉ B2B. Giá nhập đã giảm được đưa vào `DealerInventoryBatch.import_price`. Không trực tiếp giảm B2C preorder. |
| Age/time discount | Dealer | all/category/dealer_product | `compute_batch_effective_price()` khi tạo OrderItem thường hoặc allocate waiting item | Chỉ snapshot effective `OrderItem.unit_price/subtotal`; không snapshot policy id/reason | Áp dụng lại theo thời điểm allocation của preorder, không theo thời điểm gửi YC/convert. |
| Manual batch price | Dealer inventory batch | batch `MAIN` | Cùng age service; ưu tiên cao hơn policy | `OrderItem.unit_price` | Có thể áp dụng lúc order thường/allocate. |
| Voucher | Dealer/admin | customer + product/category logic | Preview cart và apply thật khi tạo order thường | `Order.discount_amount`, `PromotionUsage.discount_amount` | Không áp dụng cho preorder conversion. |

Thứ tự B2C đơn thường:

`retail_price` → manual/age effective item price → subtotal → voucher discount → shipping → total.

Đơn từ preorder:

- Lúc convert: item dùng `retail_price`; header total tính theo retail; voucher bằng 0.
- Lúc allocation: item được cập nhật sang manual/age effective price hiện tại.
- `try_allocate_waiting_orders()` không tính lại `Order.subtotal_amount`, `total_amount`, `debt_amount` hoặc `CustomerPayment.amount`.

Vì vậy nếu giá allocation khác retail, tổng item có thể không bằng header/COD của đơn `waiting_stock` đã convert. Đây là mismatch trực tiếp trong source.

Quantity discount gián tiếp ảnh hưởng nhập kho:

- `PurchaseOrderItem.unit_price` sau quantity discount trở thành `import_price` khi cộng `MAIN`.
- Với dealer product mới, `_import_dealer_inventory()` truyền giá đó làm `retail_price`.
- Với dealer product đã tồn tại, `get_or_create_canonical_dealer_product()` không cập nhật `retail_price`; chỉ có thể cập nhật product master/title.

---

## 11. Notification, receipt, recipient, reference, REST, WebSocket, email và refresh

### 11.1. Tạo notification và recipient

`backend/common/notifications.py`:

- `notify_account()` tạo một `Notification`, một `NotificationReceipt`, push WebSocket, gửi email.
- `notify_admins()` tạo một `Notification`, bulk-create receipt cho mọi account role admin, rồi push/email từng receipt.
- Title/content được làm plain text qua `plain_notification_text`.

Recipient của order:

- `notify_customer_order_status_change()` lấy tập `{dealer.account_id, customer.user_id}`.
- Nếu actor có id thì loại actor khỏi tập.
- Mỗi recipient nhận một `Notification` riêng, không phải một notification dùng chung nhiều receipts.

Recipient của preorder:

- submitted → dealer;
- dealer proposed/rejected → buyer;
- buyer rejected → dealer;
- convert → notification order cho bên không phải actor.

`notify_preorder_dealer_confirmed()` và `notify_preorder_converted_to_order()` được định nghĩa nhưng **KHÔNG TÌM THẤY TRONG SOURCE CODE** call site. Luồng confirm thực tế dùng `notify_customer_order_status_change()` sau convert.

### 11.2. Reference type/id

| Sự kiện | `reference_type` | `reference_id` |
|---|---|---|
| Preorder submitted/proposed/rejected | `customer_preorder_request` | `PreOrderRequest.id` |
| Preorder convert, waiting allocation, reschedule, order status | `customer_order` | `Order.id` |
| B2B purchase order | `purchase_order` | `PurchaseOrder.id` |

Serializer enrich:

- `reference_status`;
- `reference_order_code`;
- hỗ trợ đúng ba loại order/preorder trên bằng query model tương ứng.

### 11.3. REST list/read/read-all

`NotificationViewSet.my()`:

- Query `NotificationReceipt` của current account.
- Unread lên trước, rồi mới nhất trước.
- Response có `unread_count`, toàn bộ `unread[]`, và page `results[]`.
- `unread[]` không bị giới hạn theo page, nên response bell vẫn serialize toàn bộ unread receipts trước khi trả page 5.

Read một:

- POST `/api/notifications/{notification_id}/mark_read/`.
- Update theo notification id + current account.
- Nếu id không thuộc user, trả HTTP 200 với `updated=0`, không 404.

Read-all:

- POST `/api/notifications/mark_all_read/`.
- Update bulk mọi unread receipt của current account.

Frontend:

- `notificationService.js` có `mark_read()` nhưng không khai báo method gọi `mark_all_read`.
- `BuyerNotificationsPage.handleMarkAllRead()` gọi song song `mark_read` cho từng item đã tải.
- Trang buyer tải tối đa 20 page × 100 rồi mới read-all; nếu vượt safety cap, các receipt còn lại không được xử lý từ UI.
- `useSupplierNotifications.markAllRead()` cũng xử lý từng notification.
- Mobile chỉ có `markNotificationRead(id)`; read-all: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.

### 11.4. WebSocket

Backend:

1. URL `/ws/notifications/?token=...`.
2. `JwtAuthMiddleware` parse JWT query string, lấy `user_id`.
3. `NotificationConsumer.connect()` từ chối anonymous bằng code 4401.
4. Join group `notifications_{user.id}`.
5. `push_notification_to_account()` group-send event `notification.new`.
6. Consumer gửi JSON payload cho client.

Channel layer:

- Có `REDIS_URL` → `channels_redis`.
- Không Redis/test/local → `InMemoryChannelLayer`.
- In-memory chỉ có hiệu lực trong process; source comment xác nhận dùng cho local single-process.

Web:

- `notificationWebSocketManager.js` dùng một socket dùng chung cho subscribers, JWT query, retry 5 giây, reconnect khi tab visible/token đổi.
- `useNotificationWebSocketHandler()` prepend item, tăng unread, phát `sgm:notification:new`.
- `useOrderRealtimeRefresh()` nghe custom event, lọc `reference_type`, refetch list và detail sau debounce 400 ms.
- Khi WS reconnect, hook refetch để bù event bị lỡ.
- Các màn dùng hook gồm dealer sales order, dealer/buyer preorder, buyer tracking/history, dealer/supplier purchase order.

Mobile:

- `NotificationWebSocketService` retry 5 giây, deduplicate toast id.
- `NotificationRealtimeController` cập nhật bell/list; notification order gọi `OrderStatusRealtimeController.refreshNow()`.
- Mobile còn poll order mỗi 45 giây.

### 11.5. Email

`backend/common/notification_email.py`:

- Chỉ gửi khi `NOTIFICATION_EMAIL_ENABLED=True`.
- Bỏ qua account không có email.
- SMTP khi có `EMAIL_HOST`, nếu bật email nhưng không có host thì console backend.
- `NOTIFICATION_EMAIL_ASYNC=True` mặc định tạo daemon `threading.Thread`.
- Nội dung gồm type label, title, content, footer.
- Exception chỉ log, không làm request thất bại.
- Không có queue bền vững, retry, delivery status hay bảng email receipt.
- Email không chứa URL/reference id để click trực tiếp.

### 11.6. Reference action trên frontend

- Admin notification modal helper chỉ hỗ trợ category, supplier, supplier product, document, certification.
- `customer_order`, `purchase_order`, `customer_preorder_request` không nằm trong `SUPPORTED_REFERENCE_TYPES` của `notificationReferenceHelpers.js`.
- Order/preorder dùng notification để refresh màn chuyên biệt, nhưng admin generic notification reference modal không fetch/action các reference này.
- Buyer notification page đánh dấu đọc khi click nhưng không điều hướng theo `reference_type/id`; mobile điều hướng order-related notification tới order tracking.

### 11.7. Voucher notification

Notification khi voucher được tạo, admin duyệt/từ chối, buyer lưu, voucher gần hết hạn hoặc usage đạt limit: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.

---

## 12. Transaction, lock, race condition và tính nhất quán

| Vùng | Transaction/lock hiện có | Rủi ro chứng minh được từ code |
|---|---|---|
| Order thường | `create_customer_order()` atomic; lô `MAIN` dùng `select_for_update` | Check-stock chỉ preview; create tự khóa lại nên hai đơn thường không cùng trừ một tồn. |
| Preorder create/confirm/propose/reject | Atomic nhưng không khóa `PreOrderRequest` | Hai request action đồng thời có thể cùng đọc status cũ. |
| Convert preorder | Atomic, check `converted_order_id` nhưng không row lock/DB unique | Hai accept/confirm đồng thời có thể cùng tạo hai Order trước khi một transaction thấy update của transaction kia; order code `count()+1` cũng có race và unique collision. |
| Waiting allocation | Atomic, khóa batch `MAIN`; không khóa pending `OrderItem` | Hai allocator có thể cùng materialize một item `batch=NULL`; allocator sau khóa batch nhưng vẫn giữ object item stale và có thể trừ kho lần hai nếu batch còn đủ. |
| Multi-item waiting order | Atomic cho một invocation | Có partial allocation theo item trước khi toàn order đủ; đây là behavior chủ ý của vòng lặp hiện tại. |
| Status transition Order | Atomic nhưng `record_status_change()` không lock order | Hai action đồng thời có thể ghi history/status dựa trên state stale. |
| Restore inventory | `_restore_batch_quantity()` lấy batch bằng `select_for_update` | Batch restore được serialize; order cancel vẫn không lock order nên hai cancel đồng thời có thể cùng đi qua state check trước khi status đổi và hoàn tồn hai lần. |
| Voucher preview | Không write/lock | Chỉ là advisory. |
| Voucher apply thật | Nằm trong transaction tạo order nhưng `_validate_usage_limits()` chỉ `count()` | Hai order đồng thời có thể vượt global/per-customer limit. |
| Voucher duplicate code | Serializer precheck + DB `unique=True`; catch `IntegrityError` | Race duplicate được DB chặn. |
| Save voucher | `get_or_create` + unique customer/promotion | Duplicate save được ràng buộc. |
| Notification external effects | Tạo DB + push/email ngay trong business transaction | Nếu transaction rollback sau push/email, client/email có thể đã nhận event cho dữ liệu không commit. Client cũng có thể refetch trước commit. Không dùng `transaction.on_commit`. |
| Checkout split web/mobile | Hai HTTP request độc lập, order trước preorder | Không atomic xuyên request; có thể thành công một nửa. |

### Multi-tenant

- Storefront B2C được ràng bằng `IsStorefrontCustomer`: role buyer, có `store_dealer`, slug token phải khớp URL.
- Preorder/order buyer queryset lọc đồng thời customer và dealer.
- Dealer list/action lọc `dealer__account=user`.
- Voucher dealer CRUD lọc `dealer__account=user`; admin thấy tất cả.
- Voucher available không tin `dealer_slug` query; dùng dealer gắn trên account.
- Saved vouchers không lọc dealer, nên UI “voucher cửa hàng hiện tại” có thể nhận voucher đã lưu từ dealer khác; apply sẽ chặn ở product matcher nếu promotion có dealer khác.
- Notification receipt luôn lọc current account; WebSocket group theo account id.

---

## 13. Sai lệch, lỗ hổng chức năng và TODO được xác nhận từ source

### Mức nghiêm trọng cao

1. **Không reservation:** preorder không bảo đảm tồn hiện có/tương lai; `InventoryReservation` và `reserved_qty` **KHÔNG TÌM THẤY TRONG SOURCE CODE**.
2. **Không mua phần có + preorder phần thiếu cùng một dòng:** UI/API hiện tại làm mất một trong hai phần của nhu cầu.
3. **Header tiền không được recalculation sau allocation:** item waiting được đổi sang giá age/manual nhưng order total/debt/COD giữ giá retail lúc convert.
4. **Race double-convert preorder:** không lock preorder, không unique converted order.
5. **Race double-allocation/double-cancel:** batch có lock nhưng OrderItem/Order state không lock.
6. **Race usage limit voucher:** count rồi create, không khóa/counter.
7. **Checkout split không atomic:** order thường có thể commit dù preorder kế tiếp lỗi.
8. **External notification trước commit:** WebSocket/email có thể phát cho transaction rollback/chưa commit.

### Mức trung bình

1. Order `delivery_reschedule_proposed` không allocate khi hàng về; accept không trigger allocation lại.
2. Không có overdue/not-on-time automation, SLA hoặc cảnh báo.
3. Voucher preview retail price có thể khác giá item thực tế sau age/manual discount.
4. Voucher usage vẫn chiếm limit sau cancel.
5. Voucher không áp dụng cho preorder; UI vẫn có thể đang hiển thị voucher/discount trước khi buyer chọn preorder-only.
6. Backend validation voucher yếu hơn UI: âm, percent >100 và giới hạn.
7. Model target hỗ trợ năm loại nhưng write serializer chỉ hỗ trợ segment.
8. Saved voucher không lọc validity/dealer.
9. Allocation tự động chỉ thấy sau hoàn tất PO import; không có trigger chung cho mọi thay đổi tồn.
10. Lô `MAIN` ghi đè import date/import price, nên dữ liệu nhiều lần nhập không còn semantics FIFO/lô tuổi độc lập.

### Mức thấp / consistency

1. Comment/docstring “FIFO” và “tách nhiều dòng theo lô” không khớp canonical `MAIN`.
2. `PreOrderRequestStatus.CANCELLED` không có action.
3. Hai helper notification preorder được định nghĩa nhưng không được gọi.
4. Backend có read-all bulk nhưng frontend không dùng.
5. Generic admin notification reference modal không hỗ trợ order/preorder.
6. Buyer web notification click không điều hướng reference.
7. `unread[]` serialize toàn bộ unread trong mỗi `/my/` response, có thể lớn hơn page.
8. Admin voucher verify không giới hạn state nguồn.
9. Không có notification vòng đời voucher.
10. `Promotion.code` error nói phạm vi gian hàng nhưng constraint thật toàn cục.

### TODO audit

| TODO | Trạng thái source hiện tại |
|---|---|
| Reservation model/field/release lifecycle | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Allocation record hỗ trợ nhiều batch/item | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| FIFO thật theo import/expiry batch | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Recalculate order/payment sau waiting allocation | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Overdue detector và notification | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Lock preorder/order/order-item trong transition | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Atomic voucher usage counter | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Reversal usage khi cancel | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Voucher cho preorder | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Notification `on_commit` | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Frontend gọi endpoint read-all bulk | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |
| Email queue/retry/delivery receipt | **KHÔNG TÌM THẤY TRONG SOURCE CODE** |

---

## 14. File nguồn trọng yếu đã đối chiếu

### Backend

- `backend/apps/orders/models.py`
- `backend/apps/orders/preorder_services.py`
- `backend/apps/orders/preorder_views.py`
- `backend/apps/orders/preorder_serializers.py`
- `backend/apps/orders/waiting_stock_services.py`
- `backend/apps/orders/delivery_reschedule_services.py`
- `backend/apps/orders/services.py`
- `backend/apps/orders/views.py`
- `backend/apps/orders/storefront_views.py`
- `backend/apps/orders/delivery_slots.py`
- `backend/apps/orders/notifications.py`
- `backend/apps/orders/preorder_notifications.py`
- `backend/apps/dealer_products/models.py`
- `backend/apps/dealer_products/canonical_inventory.py`
- `backend/apps/dealer_products/inventory_queries.py`
- `backend/apps/dealer_products/age_discount.py`
- `backend/apps/supplier_products/quantity_discount.py`
- `backend/apps/purchase_orders/services.py`
- `backend/apps/promotions/models.py`
- `backend/apps/voucher/serializers.py`
- `backend/apps/voucher/services.py`
- `backend/apps/voucher/views.py`
- `backend/apps/notifications/models.py`
- `backend/apps/notifications/views.py`
- `backend/apps/notifications/serializers_api.py`
- `backend/apps/notifications/realtime.py`
- `backend/apps/notifications/consumers.py`
- `backend/apps/notifications/middleware.py`
- `backend/common/notifications.py`
- `backend/common/notification_email.py`
- `backend/common/notification_messages.py`

### Web

- `frontend/web-site/src/pages/User/Order.jsx`
- `frontend/web-site/src/utils/buyerPreorderUtils.js`
- `frontend/web-site/src/services/api/Buyer/buyerPreorder.js`
- `frontend/web-site/src/pages/User/Profile/PreOrderRequestsPage.jsx`
- `frontend/web-site/src/pages/Dealer/PreOrder/DealerPreOrderPage.jsx`
- `frontend/web-site/src/components/Dealer/PreOrder/PreOrderProposeModal.jsx`
- `frontend/web-site/src/pages/Dealer/SalesOrder/SalesOrder.jsx`
- `frontend/web-site/src/components/Dealer/SalesOrder/ProposeDeliveryRescheduleModal.jsx`
- `frontend/web-site/src/components/User/OrderTracking/OrderDetailModal.jsx`
- `frontend/web-site/src/components/Dealer/Discount/CreateVoucherModal.jsx`
- `frontend/web-site/src/pages/Admin/Voucher.jsx`
- `frontend/web-site/src/pages/User/Profile/UserVoucherPage.jsx`
- `frontend/web-site/src/services/api/Buyer/buyerVoucherService.js`
- `frontend/web-site/src/services/api/notificationService.js`
- `frontend/web-site/src/services/notificationWebSocketManager.js`
- `frontend/web-site/src/hooks/useNotificationBellData.js`
- `frontend/web-site/src/hooks/useOrderRealtimeRefresh.js`
- `frontend/web-site/src/pages/User/Profile/BuyerNotificationsPage.jsx`

### Mobile

- `frontend/mobile/lib/modules/checkout/controllers/checkout_controller.dart`
- `frontend/mobile/lib/modules/checkout/views/stock_shortfall_sheet.dart`
- `frontend/mobile/lib/core/utils/preorder_utils.dart`
- `frontend/mobile/lib/data/providers/buyer_api_provider.dart`
- `frontend/mobile/lib/shared/services/notification_websocket_service.dart`
- `frontend/mobile/lib/shared/controllers/realtime_controller.dart`
- `frontend/mobile/lib/modules/notification/views/notification_view.dart`
