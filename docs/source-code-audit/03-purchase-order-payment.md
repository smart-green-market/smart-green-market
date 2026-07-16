# Audit source code: PurchaseOrder và thanh toán

## 1. Phạm vi và kết luận ngắn

Tài liệu này chỉ mô tả hành vi đọc được từ function body tại thời điểm audit. Không suy diễn từ tên enum, comment hay tài liệu API nếu function body không thực hiện hành vi tương ứng.

Luồng thực thi chính:

`dealer catalog → tạo draft → POST PurchaseOrder → supplier confirm/reject/điều chỉnh → dealer approve hoặc cancel → QR cọc → upload biên lai → supplier verify → processing → shipping → dealer nhận hàng → trả hàng (nếu có) → QR cuối → upload biên lai → supplier verify → completed → nhập kho dealer`.

Kết luận quan trọng:

- Backend có thể nhận một giỏ nhiều NCC và tách thành nhiều `PurchaseOrder` trong một transaction của `create_purchase_orders`; UI hiện tại lại tách draft theo NCC rồi gọi API tuần tự từng phiếu. Vì vậy lỗi ở phiếu sau có thể để lại các phiếu trước đã tạo thành công.
- Không có action “dealer reject adjustment”. Dealer chỉ có `approve-adjustment` hoặc `cancel`.
- `deposit_paid`, `return_approved`, `return_rejected` tồn tại trong `PurchaseOrderStatus` nhưng không được service nào chuyển tới.
- Không có bước “NCC đánh dấu processing” riêng; duyệt cọc chuyển thẳng `deposit_pending_verification → processing`.
- “Refund” chỉ giảm `total_amount`, tính `debt_amount`/`credit_amount` và được báo cáo như cash-out. Không có model giao dịch hoàn tiền, API thực hiện chuyển tiền, timestamp hoàn tiền hay xác nhận đã hoàn tiền.
- Nhập kho dùng lô canonical `MAIN`; field `DealerInventoryBatch.purchase_order_item` tồn tại nhưng `add_import_to_main_batch` và `_import_dealer_inventory` không gán field này. Liên kết lô–`PurchaseOrderItem` vì vậy không được tạo trong luồng hoàn tất.
- Các service có `transaction.atomic`, nhưng gần như không khóa `PurchaseOrder`/`PurchaseOrderPayment`/`PurchaseOrderReturn`; nhiều check-then-write có race condition.

## 2. File và đối tượng trong phạm vi

### Backend PurchaseOrder

| Path | Đối tượng chính |
|---|---|
| `backend/apps/purchase_orders/models.py` | `PurchaseOrder`, `PurchaseOrderItem`, `PurchaseOrderPayment`, `PurchaseOrderStatusHistory`, `PurchaseOrderReturn`, `PurchaseOrderReturnItem`; toàn bộ enum trạng thái |
| `backend/apps/purchase_orders/serializers.py` | serializer create/detail/payment/return/confirm/cancel |
| `backend/apps/purchase_orders/views.py` | `PurchaseOrderViewSet`, ownership check, response |
| `backend/apps/purchase_orders/services.py` | state machine, tài chính, QR, hoàn tất, nhập kho |
| `backend/apps/purchase_orders/urls.py` | router `purchase-orders` |
| `backend/apps/purchase_orders/notifications.py` | thông báo đổi trạng thái và thông báo điều chỉnh |
| `backend/apps/purchase_orders/item_return_status.py` | trạng thái trả hàng suy ra cho từng item |
| `backend/common/business_rules.py` | giới hạn tổng tiền, ngày giao, tỷ lệ cọc |
| `backend/common/vietqr.py` | sinh URL VietQR |
| `backend/common/querysets.py` | lọc catalog và ownership list/retrieve |
| `backend/common/permission.py` | role permissions |
| `backend/common/notifications.py` | ghi notification, receipt, push realtime, email async |
| `backend/common/notification_messages.py` | nội dung/type notification |
| `backend/config/urls.py`, `backend/common/urls.py` | prefix `/api/`, config và bank API |

### Catalog, giá và kho

| Path | Đối tượng chính |
|---|---|
| `backend/apps/supplier_products/views.py` | catalog dealer `SupplierProductViewSet.list/retrieve` |
| `backend/apps/supplier_products/serializer.py` | `SupplierProductListSerializer.quantity_discount_tiers` |
| `backend/apps/supplier_products/quantity_discount.py` | chọn policy/tier và tính đơn giá |
| `backend/apps/supplier_products/order_demand.py` | nhu cầu chờ duyệt/chuẩn bị theo PO |
| `backend/apps/dealer_products/canonical_inventory.py` | tạo/tìm sản phẩm canonical và cộng lô `MAIN` |
| `backend/apps/dealer_products/models.py` | `DealerProduct`, `DealerInventoryBatch`, `DealerInventoryTransaction` |
| `backend/apps/dealer_products/migrations/0003_dealerinventorybatch_purchase_order_item.py` | thêm FK `purchase_order_item` |
| `backend/apps/suppliers/finance_services.py` | coi payment verified là cash-in và return approved là cash-out |

### Frontend

| Path | Vai trò |
|---|---|
| `frontend/web-site/src/components/Dealer/PurchaseOrder/CreatePurchaseOrder.jsx` | catalog, giỏ, preview giá, draft theo NCC |
| `frontend/web-site/src/pages/Dealer/PurchaseOrder/DraftOrderPreviewPage.jsx` | submit tuần tự từng draft |
| `frontend/web-site/src/services/api/purchaseOrderService.js` | API dealer |
| `frontend/web-site/src/pages/Dealer/PurchaseOrder/PurchaseOrderDetail.jsx` | handler approve/cancel/delivery/return, điều kiện hiển thị |
| `frontend/web-site/src/components/Dealer/PurchaseOrderDetail/PaymentQrSection.jsx` | lấy QR và upload chứng từ |
| `frontend/web-site/src/services/api/orderService.js` | API supplier |
| `frontend/web-site/src/components/Supplier/Order/DetailOrderModal/index.jsx` | handler confirm/reject/payment/ship/return |
| `frontend/web-site/src/components/Supplier/Order/DetailOrderModal/components/PaymentReceiptCard.jsx` | xem và duyệt/từ chối chứng từ |
| `frontend/web-site/src/components/Supplier/Order/DetailOrderModal/components/ReturnRequestCard.jsx` | duyệt/từ chối return |

## 3. Models và dữ liệu snapshot

### `PurchaseOrder`

- Ownership: `supplier` (`PROTECT`) và `dealer` (`PROTECT`).
- Giao nhận: `delivery_address`, `requested_delivery_time`, `confirmed_delivery_time`, `receiver_name`, `receiver_phone`, `note`.
- Tài chính: `total_amount`, `deposit_percent`, `deposit_amount`, `paid_amount`, `debt_amount`, `credit_amount`.
- Mốc thời gian nghiệp vụ: `confirmed_at`, `delivered_at`, `completed_at`, `cancelled_at`; không có `processing_at`, `shipping_at`, `returned_at`, `refunded_at`.
- Hủy: `cancelled_by`, `cancel_reason`.
- Audit chung: `created_at`, `updated_at`.

### `PurchaseOrderItem`

- `quantity`: số lượng hiện tại sau supplier review.
- `original_quantity`: snapshot số lượng dealer đặt ban đầu.
- `base_unit_price`: snapshot `SupplierProduct.wholesale_price` tại lần tính gần nhất.
- `unit_price`: giá hiệu lực sau quantity discount.
- Snapshot discount: `discount_type`, `discount_value`, `discount_min_quantity`, `line_discount_amount`.
- `subtotal = quantity × unit_price`.
- `review_status`: `pending|approved|rejected`; item bị reject được set `quantity=0`, `subtotal=0`, `line_discount_amount=0`, nhưng vẫn giữ `original_quantity`.
- Không snapshot `policy_id` hoặc `tier_id`, dù `WholesalePriceResult` có hai giá trị này.

### `PurchaseOrderPayment`

- Hai loại: `deposit`, `final_payment`.
- Trạng thái: `pending`, `verified`, `rejected`, `cancelled`.
- Chứng từ: `receipt_file`; metadata tự khai báo gồm `payment_method`, `payment_provider`, `transaction_code`, `note`, `paid_at`.
- Xác minh: `verified_by`, `verified_at`, `rejection_reason`.
- Không có unique constraint theo `(purchase_order, payment_type, status)`, idempotency key hoặc transaction-code uniqueness.

### Return

- `PurchaseOrderReturn` giữ `status`, `reason`, `evidence_file`, `refund_amount`, người yêu cầu/duyệt, `review_note`, `resolved_at`.
- `PurchaseOrderReturnItem` liên kết đúng `PurchaseOrderItem`, giữ `quantity` và lý do dòng.
- Không có trạng thái “đã hoàn tiền” trong `PurchaseOrderReturnStatus`; chỉ `requested|approved|rejected`.

### Kho dealer

- `DealerProduct` liên kết `supplier_product`, có thể liên kết `product_master`; unique có điều kiện theo dealer + master hoặc dealer + lowercase title.
- `DealerInventoryBatch` có FK nullable `purchase_order_item`, nhưng lô canonical dùng chung `batch_number="MAIN"` cho mỗi `DealerProduct`.
- `DealerInventoryTransaction` ghi `IMPORT` với before/change/after, reason và user.

## 4. Dealer catalog, tạo phiếu, validation và tính tiền

### 4.1 Truy vết catalog UI → API

| Bước | Truy vết thực tế |
|---|---|
| UI tải NCC | `CreatePurchaseOrder.fetchMeta` → `supplierService.getAll()` → `GET /api/suppliers/` |
| UI tải sản phẩm | `CreatePurchaseOrder.fetchProducts` → `supplierService.getSupplierProducts(selectedSupplier, params)` → `GET /api/supplier-products/?supplier_id=&category=&search=&page=` |
| Router/view | `backend/config/urls.py` → `apps.supplier_products.urls` → `SupplierProductViewSet.list` |
| Quyền | Dealer phải qua `IsDealer` + `IsActive` cho list/retrieve |
| Query | `filter_supplier_products_for_dealer`: chỉ product `active`, NCC `approved`, account NCC `active`, `wholesale_price IS NOT NULL`; optional `supplier_id` |
| Response | `SupplierProductListSerializer`, gồm supplier/category/images/giá/capacity và `quantity_discount_tiers` |

UI chỉ dùng `daily_production_capacity` để hiển thị/cảnh báo. Backend create không kiểm tra quantity có vượt năng lực ngày.

### 4.2 Preview giá ở frontend

`CreatePurchaseOrder.getLinePricing` gọi `computeDiscountedUnitPrice` trong `frontend/web-site/src/utils/quantityDiscountUtils.js` trên `basePrice`, quantity và tiers từ API. Giá preview không được gửi làm dữ liệu authoritative khi create. `DraftOrderPreviewPage` chỉ gửi `supplier_product_id`, `quantity`, `note` và giao nhận; backend tính lại.

Chênh lệch:

- UI chặn mỗi nhóm NCC dưới `500000` bằng hằng số trong `CreatePurchaseOrder.handleCreateOrder`.
- Backend dùng `SystemSettings.min_order_amount` và `max_order_amount` qua `validate_order_amount`.
- UI tạo đơn không gọi `GET /api/purchase-order-config/`; nếu admin đổi min/max, UI và backend có thể không đồng nhất.

### 4.3 Submit UI → backend

`CreatePurchaseOrder.handleCreateOrder` nhóm cart theo supplier và tạo `draftDataList`. `DraftOrderPreviewPage.handleConfirmOrder` lặp từng draft, gọi:

`purchaseOrderService.create(payload)` → `POST /api/purchase-orders/` → router `PurchaseOrderViewSet.create` → `PurchaseOrderCreateSerializer.is_valid/save` → `PurchaseOrderCreateSerializer.create` → `services.create_purchase_orders` → từng `create_purchase_order` → response `{"orders": [PurchaseOrderDetailSerializer...]}`.

UI bỏ `supplier_id` khỏi payload, nên mỗi request hiện chỉ chứa item của một NCC nhưng backend vẫn tự group.

### 4.4 Validation create chính xác

| Nơi | Điều kiện |
|---|---|
| `PurchaseOrderItemWriteSerializer` | `quantity >= 0.01`, decimal 2 chữ số; `supplier_product_id` integer |
| `validate_items` | ít nhất một item |
| `validate_supplier_id` | nếu gửi: Supplier tồn tại, verification `approved`, account `active` |
| serializer `create` | user có `dealer_profile`; từng `SupplierProduct` tồn tại |
| `merge_purchase_order_items` | gộp trùng product id, cộng quantity; nối note khác nhau bằng `"; "` |
| `create_purchase_order` | `dealer_profile.status == active` |
| `validate_supplier_for_dealer_order` | NCC approved, account active |
| `validate_items_for_supplier` | product đúng NCC, `active`, có `wholesale_price` |
| `validate_requested_delivery_time` | không sớm hơn `now + min_delivery_lead_days` nếu setting > 0 |
| `validate_order_amount` | tổng từng PO nằm trong min/max động |
| Không tìm thấy | Giới hạn quantity theo `daily_production_capacity`, kiểm tra tồn kho NCC, min quantity riêng của product, định dạng phone, chống product bị đổi đồng thời sau lần serializer query |

### 4.5 Calculation và snapshot

`build_order_items` gọi `compute_wholesale_unit_price(product, quantity)` cho từng dòng:

1. Lấy policy active của cùng supplier.
2. Chỉ giữ policy match product/category/all.
3. Ưu tiên scope `supplier_product > category > all`, rồi `priority`, rồi `id` giảm dần.
4. Trong policy đầu tiên có tier phù hợp, chọn tier có `min_quantity` lớn nhất; tie-break `sort_order`, `id`.
5. Percent: `base × (1 - value/100)`; fixed: `max(base - value, 0)`.
6. Ghi snapshot giá/discount và `subtotal`.
7. `order.total_amount = Σ subtotal`; ban đầu `debt_amount = total_amount`.

Khi supplier đổi quantity, `_apply_item_reviews` tính lại toàn bộ snapshot theo policy đang active tại thời điểm confirm. Do đó snapshot lúc create có thể bị thay bằng giá/policy mới lúc confirm; `original_quantity` vẫn giữ quantity ban đầu.

## 5. Ma trận chuyển trạng thái chính xác

Mọi chuyển trạng thái qua `record_status_change` tạo `PurchaseOrderStatusHistory(old_status,new_status,note,changed_by,created_at)`, save `order.status`/`updated_at`, rồi gọi notification. Notification mặc định gửi cho phía còn lại trong dealer/supplier, không gửi actor; tạo `Notification`, `NotificationReceipt`, push realtime và gọi email async. Admin không phải target mặc định.

| Từ | Sang | Actor/API/function | Điều kiện trong function body | Timestamp thay đổi | Notification | Side effect |
|---|---|---|---|---|---|---|
| không có | `pending_supplier_confirmation` | Dealer `POST /purchase-orders/` → `create_purchase_order` | Toàn bộ validation create đạt | `created_at`, `updated_at`; history `created_at` | Supplier nhận status notification | Tạo PO/items, snapshot giá, total/debt |
| `pending_supplier_confirmation` | `confirmed` | Supplier `POST .../confirm/` → `supplier_confirm_order` | ngày hợp lệ; ít nhất 1 item approved; total hợp lệ; cọc hợp lệ; không đổi ngày và không đổi/reject item | `confirmed_at=now`, `confirmed_delivery_time`; history | Dealer nhận status notification | Review items, tính lại giá/total/deposit/debt/credit |
| `pending_supplier_confirmation` | `pending_dealer_confirmation` | Supplier confirm như trên | ngày khác requested hoặc quantity đổi hoặc item reject | như trên | Dealer nhận 2 notification: status chung và `notify_adjustment_pending_dealer` | Lưu adjustment trước khi dealer duyệt |
| `pending_dealer_confirmation` | `confirmed` | Dealer `POST .../approve-adjustment/` → `dealer_approve_adjustment` | đúng state; service kiểm tra ownership dealer | chỉ `updated_at`; history | Supplier nhận status notification | Không tính lại dữ liệu |
| `pending_dealer_confirmation` | `cancelled` | Dealer `POST .../cancel/` → `cancel_order` | lý do không rỗng; state thuộc `DEALER_CANCELLABLE` | `cancelled_at=now`, `cancelled_by`; history | Supplier nhận status notification | Pending payment nếu có bị cancelled (trạng thái này thực tế chưa có payment) |
| `pending_supplier_confirmation` | `rejected` | Supplier `POST .../reject/` → `supplier_reject_order` | đúng state; reason không rỗng | chỉ `updated_at`; history | Dealer nhận error notification | Ghi `order.rejection_reason`; terminal |
| `confirmed` | `deposit_pending_verification` | Dealer `POST .../submit-deposit/` → `dealer_submit_payment` | đúng state; chưa có deposit payment pending | payment `created_at`, `paid_at`; order `updated_at`; history | Supplier nhận warning notification | Tạo payment pending, amount=`deposit_amount` |
| `deposit_pending_verification` | `confirmed` | Supplier reject deposit → `supplier_verify_payment` | payment đang pending; reason không rỗng | payment `verified_at`; order `updated_at`; history | Dealer nhận status notification | Payment=`rejected`, set verifier/reason; paid total không đổi |
| `deposit_pending_verification` | `processing` | Supplier approve deposit | payment pending | payment `verified_at`; order/history | Dealer nhận status notification | Payment verified; tính lại paid/debt/credit từ mọi payment verified |
| `processing` | `shipping` | Supplier `POST .../ship/` → `supplier_start_shipping` | đúng state | order `updated_at`; history | Dealer nhận status notification | Không có shipment model/tracking/timestamp |
| `shipping` | `delivered` | Dealer `POST .../confirm-delivery/` → `dealer_confirm_delivery` | đúng state | `delivered_at=now`; history | Supplier nhận status notification | Không nhập kho tại đây |
| `delivered` | `return_requested` | Dealer `POST .../request-return/` → `dealer_request_return` | reason/items; không có return requested khác; item thuộc PO và approved; qty không vượt còn lại | return `created_at`; order/history | Supplier nhận warning notification | Tạo return/items, tính `refund_amount = Σ unit_price × qty` |
| `return_requested` | `delivered` | Supplier reject return → `supplier_review_return` | return requested; reason reject không rỗng | `resolved_at=now`; history | Dealer nhận status notification | Return=`rejected`; tài chính không đổi |
| `return_requested` | `delivered` | Supplier approve partial return | chưa trả hết mọi approved item | `resolved_at=now`; history | Dealer nhận status notification | Return=`approved`; giảm total; tính lại deposit/debt/credit |
| `return_requested` | `returned` | Supplier approve full return | tổng approved return quantity của mọi approved item >= item quantity | `resolved_at=now`; history | Dealer nhận error notification | Return=`approved`; total/debt/deposit có thể về 0, credit có thể >0; terminal |
| `delivered` | `final_payment_pending_verification` | Dealer `POST .../submit-final-payment/` → `dealer_submit_payment` | đúng state; chưa có final pending; `debt_amount > 0` | payment `created_at`, `paid_at`; order/history | Supplier nhận warning notification | Tạo payment pending amount=`debt_amount` tại thời điểm submit |
| `final_payment_pending_verification` | `delivered` | Supplier reject final payment | payment pending; reason không rỗng | payment `verified_at`; order/history | Dealer nhận status notification | Payment=`rejected`; paid total không đổi |
| `final_payment_pending_verification` | `completed` | Supplier approve final payment → `_complete_order` | payment pending; function không so lại state/amount/debt | payment `verified_at`; `completed_at=now`; history | Dealer nhận success notification | Refresh paid/debt/credit; nhập kho dealer; thử allocate waiting customer orders |
| state thuộc `DEALER_CANCELLABLE` | `cancelled` | Dealer cancel | pending supplier/dealer hoặc confirmed; reason | `cancelled_at`, history | Supplier nhận notification | Cancel payment pending |
| mọi state không terminal | `cancelled` | Admin cancel | `is_admin=True`; reason | như trên | Dealer và supplier đều nhận vì actor admin không bị trùng target | Cancel payment pending |

### Trạng thái không có transition thực thi

- `PurchaseOrderStatus.DEPOSIT_PAID`: **KHÔNG TÌM THẤY TRONG SOURCE CODE** lời gọi `record_status_change(..., DEPOSIT_PAID, ...)`.
- `PurchaseOrderStatus.RETURN_APPROVED`: **KHÔNG TÌM THẤY TRONG SOURCE CODE** transition. Approve một phần quay về `delivered`; toàn phần tới `returned`.
- `PurchaseOrderStatus.RETURN_REJECTED`: **KHÔNG TÌM THẤY TRONG SOURCE CODE** transition. Reject return quay về `delivered`.
- Dealer “reject adjustment”: **KHÔNG TÌM THẤY TRONG SOURCE CODE** endpoint/action/service riêng. UI cung cấp approve hoặc hủy PO.
- Supplier đánh dấu `delivered`: **KHÔNG TÌM THẤY TRONG SOURCE CODE**; chỉ dealer xác nhận delivery.
- Hoàn tất thủ công/admin: **KHÔNG TÌM THẤY TRONG SOURCE CODE**; chỉ verify final payment gọi `_complete_order`.

## 6. Supplier confirm/reject và dealer adjustment

### `supplier_confirm_order`

1. Chặn terminal và yêu cầu state `pending_supplier_confirmation`.
2. `validate_confirmed_delivery_time`:
   - bắt buộc;
   - không sớm hơn `now + min_delivery_lead_days`;
   - không muộn hơn `requested_delivery_time + max_delivery_delay_days`;
   - được phép sớm hơn requested nếu vẫn qua lead time.
3. `_normalize_confirm_items`:
   - không gửi items: approve tất cả với quantity hiện tại;
   - có gửi: tập id phải đúng bằng toàn bộ item id của PO;
   - reject item bắt buộc reason;
   - approved quantity > 0.
4. `_apply_item_reviews` khóa item rows bằng `select_for_update`, reject hoặc cập nhật quantity và tính lại giá.
5. Ít nhất một item approved; tổng mới phải qua min/max.
6. Cọc dùng payload hoặc `default_deposit_percent`, rồi validate theo setting.
7. Lưu total/deposit/debt/credit/date/`confirmed_at`.
8. Nếu ngày hoặc item thay đổi: `pending_dealer_confirmation`; nếu không: `confirmed`.

Điểm UI không đồng bộ: supplier modal hardcode cọc `10–50%`, trong khi backend dùng `min_deposit_percent/max_deposit_percent` động.

### Dealer adjustment

`dealer_approve_adjustment` chỉ đổi state sang `confirmed`; dữ liệu item/date/tiền đã được supplier ghi trước đó. Nếu dealer không đồng ý, UI `handleRejectOrCancelOrder` gọi `cancel`, ghi cả PO thành `cancelled`; không có negotiation/version mới.

## 7. Thanh toán, QR, chứng từ và xác minh

### 7.1 QR

Dealer detail chỉ render `PaymentQrSection` khi:

- deposit: state `confirmed` và `depositAmount > 0`;
- final: state `delivered` và `remainingAmount > 0`.

Trace:

`PaymentQrSection.useEffect` → `purchaseOrderService.getPaymentQr` → `GET /api/purchase-orders/{id}/payment-qr/?payment_type=...` → `PurchaseOrderViewSet.payment_qr` → role/ownership → `services.get_payment_qr` → `build_supplier_payment_qr` → `PaymentQrSerializer`.

Điều kiện backend trùng state ở trên. Payload gồm `qr_image_url`, bank BIN/name/account, amount, transfer content=`order.order_code`, type/id/code/template.

`build_supplier_payment_qr` yêu cầu `supplier.account_name`; resolve BIN từ BIN 6 số hoặc bank name; `build_vietqr_image_url` yêu cầu account number. URL trỏ `https://img.vietqr.io/image/{bin}-{account}-{template}.png?...`.

Không có gọi cổng thanh toán, webhook hoặc đối soát tự động: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.

### 7.2 Upload evidence

`PaymentQrSection.handleSubmit` tạo `FormData` với `payment_method` (mặc định `bank_transfer`), `receipt_file`, optional provider/note. UI không gửi `transaction_code` hoặc `paid_at`, dù serializer hỗ trợ.

Backend:

- `SubmitPaymentSerializer` bắt buộc `receipt_file`;
- không gọi validator file type/size chuyên biệt trong serializer này;
- amount không nhận từ client: deposit lấy `order.deposit_amount`, final lấy `order.debt_amount`;
- `paid_at` mặc định `timezone.now()`;
- chặn một payment pending cùng type bằng `.exists()`;
- payment rejected cũ không chặn nộp lại.

Mặc dù `payment_method` cho phép `cash|bank_transfer|e_wallet`, mọi phương thức vẫn bắt buộc `receipt_file`; QR luôn là bank transfer.

### 7.3 Supplier verification

Trace:

`DetailOrderModal.verifyPaymentAction` → `orderService.verifyPayment` → `POST /api/purchase-orders/{orderId}/verify-payment/` → `VerifyPaymentSerializer` → view lấy payment bằng `pk + purchase_order` → `supplier_verify_payment`.

- View bắt buộc supplier sở hữu PO.
- Reject bắt buộc `rejection_reason`, set payment rejected/verifier/time rồi trả state về `confirmed` hoặc `delivered`.
- Approve set verified/verifier/time, `_refresh_payment_totals` sum toàn bộ payment verified.
- Deposit approved → `processing`.
- Final approved → `_complete_order`.

Service không kiểm tra payment type có khớp state hiện tại; nó dựa vào payment pending được truyền vào. Trong request bình thường, payment được tạo từ state đúng, nhưng concurrent/stale call không được bảo vệ bằng row lock.

### 7.4 Completion

`_complete_order`:

1. set `completed_at`;
2. chuyển `completed`;
3. `_import_dealer_inventory`.

Không kiểm tra rõ `debt_amount == 0` sau `_refresh_payment_totals`. Amount final là snapshot debt lúc submit, nên luồng tuần tự bình thường trả đủ; function body không khẳng định invariant này.

Nếu sau approved return một phần `debt_amount == 0` nhưng PO vẫn `delivered`, `get_payment_qr` và `dealer_submit_payment(final)` đều từ chối vì amount <= 0; không có route khác để complete. PO có thể kẹt `delivered`. Nếu trả toàn bộ, state là terminal `returned`.

## 8. Shipping, delivery, cancel, return và refund

### Shipping/delivery

- `supplier_start_shipping`: chỉ `processing → shipping`; không tạo shipment, tracking code, carrier, `shipped_at`.
- `dealer_confirm_delivery`: chỉ `shipping → delivered`; set `delivered_at`.
- `confirmed_delivery_time` là cam kết, không tự động chuyển state khi đến hạn.

### Cancel

- Dealer: chỉ pending supplier, pending dealer, confirmed.
- Admin: mọi state không thuộc `rejected|completed|cancelled|returned`.
- Supplier không có cancel action; supplier chỉ reject lúc pending supplier.
- Cancel bulk-update mọi payment pending thành `cancelled`, gán verifier/time/reason.
- Payment verified không bị đảo, `paid_amount`, `debt_amount`, `credit_amount` không được tính lại; không có refund cho tiền đã verified khi admin hủy sau cọc.

### Return

Return chỉ yêu cầu được khi PO đúng `delivered`. Vì final payment approved chuyển ngay terminal `completed`, return sau completion bị `_ensure_not_terminal` chặn. Do đó source code hỗ trợ trả sau nhận hàng nhưng trước hoàn tất thanh toán cuối, không hỗ trợ hậu mãi sau completion.

Validation:

- một return `requested` tại một thời điểm;
- item phải thuộc PO và `review_status=approved`;
- serializer và service đều chặn duplicate item id;
- quantity > 0 từ serializer;
- tổng approved-return trước đó + request mới không vượt item quantity;
- rejected return không làm giảm returnable quantity;
- refund line dùng `unit_price` đã giảm, không dùng `base_unit_price`.

Approve return:

- giảm `order.total_amount` theo `refund_amount`;
- tính lại `deposit_amount` từ total mới;
- `debt=max(total-paid,0)`;
- `credit=max(paid-total,0)`;
- partial trở lại `delivered`, full thành `returned`.

“Refund” thực tế:

- `PurchaseOrderReturn.refund_amount` là giá trị tính toán.
- `credit_amount` là số NCC cần hoàn nếu đã trả thừa.
- `backend/apps/suppliers/finance_services.py` cộng return approved thành `cash_out`, dù không có bản ghi chuyển tiền.
- UI supplier hiển thị `Đã hoàn` từ `approved_refund_total`.
- API thực hiện refund, payment refund model, receipt refund, `refunded_at`, actor xác nhận refund: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.

## 9. Nhập kho dealer và liên kết POItem

### Trình tự

`supplier_verify_payment(final approved)` → `_complete_order` → `_import_dealer_inventory`.

Với mỗi item approved:

1. `get_or_create_canonical_dealer_product`:
   - ưu tiên match `product_master_id`;
   - fallback match title chuẩn hóa;
   - nếu tồn tại, có thể cập nhật master/title nhưng không cập nhật retail price/category;
   - nếu tạo mới: retail price=`item.unit_price`, category chỉ copy khi category supplier là `SYSTEM + ACTIVE`, status=`active`.
2. `_remaining_import_quantity = max(int(item.quantity - approved_returned), 0)`.
3. `add_import_to_main_batch`:
   - lấy/tạo batch `MAIN`, có `select_for_update` khi batch đã tồn tại;
   - cộng cả `quantity` và `remaining_quantity`;
   - overwrite `import_price` và `import_date` bằng lần nhập mới nhất;
   - ghi `DealerInventoryTransaction(type=IMPORT)`;
   - gọi `try_allocate_waiting_orders`.

### Discrepancy dữ liệu

- `PurchaseOrderItem.quantity` là `DecimalField`, nhưng nhập kho ép `int(...)`. Phần lẻ bị cắt, không làm tròn và không báo lỗi.
- `DealerInventoryBatch.quantity` là `PositiveIntegerField`, nên model kho không biểu diễn quantity thập phân.
- `DealerInventoryBatch.purchase_order_item` có trong model/migration, nhưng `get_or_create_main_batch` không nhận item và `add_import_to_main_batch` không gán item. Search toàn backend không tìm thấy assignment field này trong luồng import.
- Vì một batch `MAIN` cộng dồn nhiều PO, một FK đơn tới `PurchaseOrderItem` cũng không thể biểu diễn đầy đủ provenance của nhiều lần nhập. Provenance hiện chỉ còn text `reason="Nhập từ phiếu {order_code}"` trên transaction; transaction không có FK PO/POItem.
- Nếu lỗi ở `try_allocate_waiting_orders`, nó nằm trong transaction outer của verify payment; toàn bộ completion, payment verified và import có thể rollback.

## 10. API scope, quyền và response

Prefix từ `backend/config/urls.py`: `/api/`; router từ `backend/apps/purchase_orders/urls.py`.

| Method/path | Action | Permission cấp action | Ownership và response |
|---|---|---|---|
| `GET /api/purchase-orders/` | `list` | default `IsAdminOrSupplier` (thực tế class cho admin/supplier/dealer) | `filter_purchase_orders`: admin all, supplier own, dealer own; paginated `PurchaseOrderListSerializer` + count status |
| `GET /api/purchase-orders/{id}/` | `retrieve` | default như trên | ownership qua queryset; `PurchaseOrderDetailSerializer` |
| `POST /api/purchase-orders/` | `create` | `IsDealer` | dealer profile từ user; response 201 `{"orders":[detail...]}` |
| `POST .../{id}/confirm/` | `confirm` | `IsSupplier` | view check `order.supplier.account_id`; detail |
| `POST .../{id}/reject/` | `reject` | `IsSupplier` | supplier ownership; detail |
| `POST .../{id}/approve-adjustment/` | `approve_adjustment` | rơi vào default `IsAdminOrSupplier`, class này vẫn cho dealer | view và service check dealer ownership; detail |
| `GET .../{id}/payment-qr/` | `payment_qr` | `IsAuthenticated` | chỉ dealer owner hoặc admin; supplier bị 403; `PaymentQrSerializer` |
| `POST .../{id}/submit-deposit/` | `submit_deposit` | `IsDealer` | dealer ownership; 201 `PurchaseOrderPaymentReadSerializer` |
| `POST .../{id}/submit-final-payment/` | `submit_final_payment` | `IsDealer` | dealer ownership; 201 payment |
| `POST .../{id}/verify-payment/` | `verify_payment` | `IsSupplier` | supplier ownership; payment phải thuộc order; response payment, không trả detail |
| `POST .../{id}/ship/` | `ship` | `IsSupplier` | supplier ownership; detail |
| `POST .../{id}/confirm-delivery/` | `confirm_delivery` | `IsDealer` | dealer ownership; detail |
| `POST .../{id}/cancel/` | `cancel` | `IsAuthenticated` | admin hoặc dealer owner; detail |
| `POST .../{id}/request-return/` | `request_return` | `IsDealer` | dealer ownership; 201 `PurchaseOrderReturnReadSerializer` |
| `POST .../{id}/returns/{return_id}/review/` | `review_return` | `IsSupplier` | supplier ownership; return phải thuộc order; return response |
| `GET /api/purchase-order-config/` | config | `AllowAny` | min/max amount, min/max/default deposit, lead/delay days |
| `GET /api/banks/` | bank list | view riêng | dùng cấu hình bank |
| `GET /api/supplier-products/` | catalog | dealer read khi active | product active/NCC approved+active/giá sỉ có |

Tên `IsAdminOrSupplier` và docstring không khớp implementation: class cho cả dealer. Đây là lý do list/retrieve và `approve_adjustment` vẫn hoạt động với dealer dù action không được liệt kê riêng trong `get_permissions`.

Không có object permission class; ownership được bảo đảm chủ yếu bởi `get_queryset` và các check tay trong action. Các service như `supplier_confirm_order`, `supplier_reject_order`, `supplier_start_shipping`, `supplier_verify_payment`, `supplier_review_return` không tự kiểm tra supplier ownership; chúng phụ thuộc caller/view.

## 11. Trace handler → service → endpoint → response theo từng bước

| Nghiệp vụ | UI handler/component | FE service | Backend action/serializer | Business service | Response UI dùng |
|---|---|---|---|---|---|
| Tạo | `DraftOrderPreviewPage.handleConfirmOrder` | `purchaseOrderService.create` | `create` / `PurchaseOrderCreateSerializer` | `create_purchase_orders` | detail list; UI chỉ đếm thành công |
| Supplier confirm | `DetailOrderModal.confirmOrder` | `orderService.confirmOrder` | `confirm` / `SupplierConfirmSerializer` | `supplier_confirm_order` | parse/merge detail |
| Supplier reject PO | `DetailOrderModal.rejectOrder` | `orderService.rejectOrder` | `reject` / `SupplierRejectSerializer` | `supplier_reject_order` | detail |
| Dealer approve adjustment | `handleApproveAdjustmentConfirm` | `purchaseOrderService.approveAdjustment` | `approve_adjustment` / `NoteSerializer` | `dealer_approve_adjustment` | detail rồi refetch |
| Dealer reject adjustment | **KHÔNG TÌM THẤY TRONG SOURCE CODE** | — | — | — | UI dùng cancel thay thế |
| Lấy QR | `PaymentQrSection` effect | `getPaymentQr` | `payment_qr` / `PaymentQrSerializer` | `get_payment_qr` | QR/bank/amount |
| Nộp cọc/cuối | `PaymentQrSection.handleSubmit` | `submitDeposit`/`submitFinalPayment` | action tương ứng / `SubmitPaymentSerializer` | `dealer_submit_payment` | payment; parent refetch detail |
| Verify/reject payment | `DetailOrderModal.verifyPaymentAction` | `orderService.verifyPayment` | `verify_payment` / `VerifyPaymentSerializer` | `supplier_verify_payment` | payment; UI refetch detail |
| Ship | `DetailOrderModal.confirmShipping` | `orderService.confirmShipping` | `ship` / `NoteSerializer` | `supplier_start_shipping` | detail |
| Delivery | `handleConfirmDelivery` | `purchaseOrderService.confirmDelivery` | `confirm_delivery` / `NoteSerializer` | `dealer_confirm_delivery` | detail/refetch |
| Cancel | `handleCancelOrderConfirm` | `purchaseOrderService.cancel` | `cancel` / `CancelOrderSerializer` | `cancel_order` | detail/refetch |
| Request return | `handleRequestReturnConfirm` | `purchaseOrderService.requestReturn` | `request_return` / `RequestPurchaseOrderReturnSerializer` | `dealer_request_return` | return; refetch |
| Review return | `DetailOrderModal.reviewReturnAction` | `orderService.reviewReturn` | `review_return` / `ReviewReturnSerializer` | `supplier_review_return` | return; parser gọi `parseOrderDetail` trên return response rồi vẫn refetch |

Discrepancy frontend return multipart: dealer append key dạng ``items[${index}]purchase_order_item_id`` (không có dấu `.` hoặc `]` trước field). Serializer yêu cầu nested list `items`. Việc parser hiện tại có chuyển đúng key này thành list hay không không được custom code xử lý tại PurchaseOrder; **KHÔNG TÌM THẤY TRONG SOURCE CODE** parser nested multipart riêng.

## 12. Transaction, lock, race và rollback

### Transaction boundaries

Các hàm có `@transaction.atomic`:

- `create_purchase_order`, `create_purchase_orders`;
- `supplier_confirm_order`, `dealer_approve_adjustment`, `supplier_reject_order`;
- `dealer_submit_payment`, `supplier_verify_payment`;
- `supplier_start_shipping`, `dealer_confirm_delivery`, `cancel_order`;
- `dealer_request_return`, `supplier_review_return`;
- `add_import_to_main_batch`.

`create_purchase_orders` gọi nested `create_purchase_order`; một request backend nhiều NCC rollback toàn bộ nếu một nhóm lỗi. Nhưng UI gọi nhiều request, nên không có transaction xuyên request.

Notification DB records được tạo trong cùng atomic call trước commit. Push websocket/email async được kích hoạt ngay, không dùng `transaction.on_commit`; nếu phần sau rollback (đặc biệt notification `completed` được gửi trước import kho), client/email có thể đã nhận sự kiện của transaction cuối cùng rollback.

### `select_for_update`

- `_apply_item_reviews`: khóa `PurchaseOrderItem` rows, nhưng không khóa `PurchaseOrder`.
- `add_import_to_main_batch`: `get_or_create_main_batch(..., for_update=True)` khóa batch nếu đã tồn tại.
- `PurchaseOrder`, `PurchaseOrderPayment`, `PurchaseOrderReturn`: **KHÔNG TÌM THẤY TRONG SOURCE CODE** `select_for_update`.

### Race cụ thể

| Vùng | Race/rollback đọc được từ code |
|---|---|
| Mã PO | `generate_order_code` dùng `count()+1`; hai transaction cùng dealer/ngày có thể sinh cùng code. Unique constraint sẽ làm một request `IntegrityError`; không có retry |
| Confirm/reject/cancel | state được check trên object lấy trước transaction service và không lock order; hai request có thể cùng qua check rồi ghi transition chồng nhau |
| Submit payment | `.exists()` rồi `.create()` không lock/unique; hai request song song có thể tạo hai payment pending cùng type và hai history |
| Verify payment | check `payment.status` rồi save không lock; approve/reject đồng thời có thể last-write-wins, cộng tiền hoặc complete không nhất quán |
| Return request | check pending return và returned quantity rồi create không lock; hai request có thể cùng tạo pending return hoặc vượt tổng returnable |
| Review return | return/order không lock; hai reviewer có thể cùng apply giảm total |
| Canonical product | find rồi create; unique constraint giảm duplicate nhưng có thể phát sinh `IntegrityError`, không retry lấy row thắng |
| Batch `MAIN` mới | `select_for_update` không khóa row chưa tồn tại; hai create có thể đụng unique `(dealer_product,batch_number)`, không retry |
| Completion/import | concurrent final verify có thể gọi import nhiều lần; terminal/status/payment checks không được khóa |
| File upload | file storage side effect có thể không rollback cùng DB khi transaction lỗi |

### Rollback tốt đang có

- Lỗi validation sau khi đã tạo order/items trong `create_purchase_order` rollback DB.
- `_apply_item_reviews` có thể đã save item trước khi phát hiện `approved_count==0`; atomic confirm rollback các item.
- Return object/items tạo trước khi validation dòng sau lỗi; atomic rollback DB.
- Nếu import kho hoặc allocate waiting order lỗi, transaction verify payment rollback DB changes của payment/order/inventory.

## 13. Permissions, ownership và dữ liệu nhạy cảm

- Create yêu cầu role dealer nhưng không thêm `IsActive`; trạng thái hoạt động được kiểm tra trên `DealerProfile`, không trực tiếp `Account.status`.
- Supplier actions dùng role supplier và view ownership.
- Dealer actions dùng role dealer và view ownership; approve adjustment rơi vào permission mặc định nhưng ownership vẫn check.
- Admin đọc tất cả, lấy QR tất cả và cancel mọi non-terminal; admin không verify payment/confirm/ship vì action permission chỉ supplier.
- Buyer nhận queryset none/default permission deny.
- Detail response trả `supplier_bank` cho supplier/dealer/admin có quyền xem PO. QR action chỉ dealer owner/admin.
- `receipt_file` được serialize trực tiếp; access control file phụ thuộc media serving, không có signed URL trong PurchaseOrder code.

## 14. Discrepancies và khoảng trống có bằng chứng

1. Enum chết: `deposit_paid`, `return_approved`, `return_rejected` không có transition.
2. `order_demand.PREPARATION_STATUSES` vẫn chứa `deposit_paid`; harmless về query nhưng state không phát sinh.
3. Không có dealer reject adjustment; cancel là lựa chọn duy nhất.
4. Không có refund execution; số `refund_amount` được báo cáo như tiền đã chi.
5. Không có hoàn tiền khi admin cancel sau payment verified.
6. Không có return sau `completed`.
7. Không có completion khi `delivered` nhưng debt đã về 0 do partial return.
8. Không có lock/idempotency cho state transition/payment/return.
9. Notification push/email không chờ commit.
10. `PurchaseOrderItem` decimal bị ép int khi nhập kho.
11. `DealerInventoryBatch.purchase_order_item` không được gán; provenance chỉ là text reason.
12. UI min order hardcode 500.000đ; backend setting động.
13. Supplier UI cọc hardcode 10–50%; backend setting động.
14. UI nói VietQR “tự động xác nhận nhanh”, nhưng không có webhook/auto verify.
15. UI nói file tối đa 5MB; `SubmitPaymentSerializer` không gọi validator size/type.
16. Supplier UI dùng `supplier?.[0]` để hiển thị thông tin đại diện, không chọn supplier theo `order.supplier`; có thể hiển thị NCC đầu danh sách thay vì NCC của PO.
17. `orderService.reviewReturn` parse return response bằng `parseOrderDetail` dù endpoint trả `PurchaseOrderReturnReadSerializer`; UI sau đó refetch nên dữ liệu cuối vẫn lấy detail.
18. `PurchaseOrderStatusHistory` ghi transition nhưng không snapshot các giá trị item/tiền trước-sau; audit adjustment phải đọc current item và note text.
19. Không có optimistic version/ETag; UI realtime refresh không ngăn submit state cũ.
20. Không có endpoint trả hàng vật lý đã nhận/đã hoàn kho; approve return chỉ điều chỉnh PO. Do return xảy ra trước completion, kho dealer chưa được import; completion sau partial return mới trừ approved returned quantity.

## 15. Hồ sơ các function quan trọng

| Function | Input/chủ thể | Writes | Guard chính | Lock |
|---|---|---|---|---|
| `create_purchase_orders` | dealer, delivery, mixed items | nhiều PO/items/history/notification/interactions | items, forced supplier consistency | không |
| `create_purchase_order` | một supplier group | PO/items/history | dealer/supplier/product/date/amount | không |
| `build_order_items` | PO + items | item snapshots, total/debt | phụ thuộc caller | không |
| `supplier_confirm_order` | PO/supplier/date/cọc/items | items, total/deposit/date/state/history | exact pending state, rules | khóa item |
| `dealer_approve_adjustment` | PO/dealer | state/history | state + ownership | không |
| `supplier_reject_order` | PO/supplier/reason | rejection/state/history | exact pending + reason | không |
| `get_payment_qr` | PO/type | không DB write | exact state, positive amount, bank config | không |
| `dealer_submit_payment` | PO/dealer/type/form | payment/state/history | exact state, no pending same type | không |
| `supplier_verify_payment` | payment/supplier/decision | payment, balances, state, có thể inventory | pending payment | không |
| `_refresh_payment_totals` | PO | paid/deposit/debt/credit | sum verified | không |
| `supplier_start_shipping` | PO/supplier | state/history | processing | không |
| `dealer_confirm_delivery` | PO/dealer | delivered_at/state/history | shipping | không |
| `cancel_order` | PO/dealer/admin | cancel fields, pending payments, state/history | role do caller, state/reason | không |
| `dealer_request_return` | PO/dealer/items | return/items/state/history | delivered, ownership do view, quantities | không |
| `supplier_review_return` | return/supplier | return, PO money/state/history | requested state | không |
| `_complete_order` | PO/supplier | completed_at/state/inventory | phụ thuộc caller | không |
| `_import_dealer_inventory` | completed PO | dealer product/batch/transaction | approved items, remaining qty | batch lock trong callee |
| `add_import_to_main_batch` | product/int qty | batch + inventory transaction | qty > 0 | khóa batch hiện hữu |

## 16. Kết luận theo source

Happy path tuần tự được nối đầy đủ từ catalog tới nhập kho và có history/notification ở mọi lần đổi `PurchaseOrder.status`. Backend giữ quyền quyết định giá, amount thanh toán và state. Tuy nhiên, tính đúng đắn khi concurrent chưa được bảo đảm vì atomic không đi kèm lock trên aggregate root; “refund” chưa phải nghiệp vụ chuyển tiền; và provenance kho tới `PurchaseOrderItem` chưa được ghi dù schema có field. Những hành vi vắng mặt đã được đánh dấu **KHÔNG TÌM THẤY TRONG SOURCE CODE** thay vì suy đoán.
