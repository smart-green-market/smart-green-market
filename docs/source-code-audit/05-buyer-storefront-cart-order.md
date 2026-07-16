# 05 — Audit source code Buyer Storefront, Cart và Order

## 1. Phạm vi, phương pháp và kết luận nhanh

- Source được đối chiếu tại commit `14b4df2f98a63ad8699bfe5e35bfc12e993da600`.
- Phạm vi: buyer web React, buyer mobile Flutter/GetX, dealer web xử lý đơn, Django REST backend, model tồn kho/đơn/review/notification.
- Chỉ ghi nhận hành vi nhìn thấy trực tiếp trong source. Chỗ không có implementation được ghi đúng cụm **KHÔNG TÌM THẤY TRONG SOURCE CODE**.
- Luồng chuẩn thực sự đang chạy là: storefront theo slug → catalog/detail → giỏ cục bộ → checkout gọi stock-check → `POST orders` → trừ lô `MAIN` ngay → dealer `pending → confirmed → processing → shipping` → buyer xác nhận `shipping → completed`.
- Backend **không có bước thực thi `shipping → delivered → completed`**. `buyer_confirm_received()` chuyển thẳng `shipping → completed` và đặt đồng thời `delivered_at`, `completed_at`. Các UI/constant còn hiển thị `delivered` là lệch pha.
- Web có checkout thật tại `/cua-hang/:dealerSlug/dat-hang`, nhưng vẫn route checkout mock tại `/cua-hang/:dealerSlug/dat-hang-1`; trang `/thanh-toan` cũng chỉ dùng mock.
- Giỏ hàng không có API/model backend. Web lưu `sessionStorage`; mobile lưu `GetStorage` bền qua phiên. Giá/tồn trong giỏ chỉ là snapshot client, backend tính lại giá và khóa lô khi tạo đơn.
- Tạo đơn thường có `transaction.atomic` và khóa lô bằng `select_for_update()`. Chuyển trạng thái, hủy, duyệt trả, phân bổ waiting-stock không khóa row `Order`/`OrderReturn` trước khi kiểm tra trạng thái; có race check-then-act.
- Không có “reserve” tồn cho đơn thường: tồn bị **deduct ngay**. Pre-order không reserve/deduct lúc gửi; order `waiting_stock` chỉ deduct khi `try_allocate_waiting_orders()` phân bổ được lô.
- Multi-tenant chính được bảo vệ ở permission JWT theo slug và mọi queryset order/review/catalog đều lọc dealer + buyer. Một điểm lệch đáng chú ý: preview voucher `apply_voucher()` không nhận/ràng buộc dealer slug ở service, trong khi tạo order vẫn ràng buộc sản phẩm theo dealer và áp voucher lại.

## 2. Bản đồ route và điểm vào

| Kênh | Route UI / API | Component / router / view | Auth | Trạng thái |
|---|---|---|---|---|
| Web | `/` | `frontend/web-site/src/App.jsx` → `DealerSlugEntryPage` | Public | Nhập slug, lưu `store_dealer_slug` vào `localStorage` |
| Web | `/cua-hang/:dealerSlug/trang-chu` | `App.jsx` → `StorefrontSlugSync` → `UserLayout` → `HomePage` | Public | Storefront thật |
| Web | `/cua-hang/:dealerSlug/san-pham`, `/san-pham/:id` | `ProductsPage`, `ProductDetailPage` | Public | Catalog/detail thật |
| Web | `/cua-hang/:dealerSlug/gio-hang` | `CartPage` trong `BuyerRouteProtect` | Buyer | Giỏ cục bộ thật |
| Web | `/cua-hang/:dealerSlug/dat-hang` | `OrderPage` | Buyer | Checkout/order thật |
| Web | `/cua-hang/:dealerSlug/dat-hang-1` | `CheckoutPage` | Buyer | **Mock nhưng vẫn được route** |
| Web | `/cua-hang/:dealerSlug/thanh-toan` | `PaymentPage` | Buyer | **Mock/TODO** |
| Web | `/cua-hang/:dealerSlug/theo-doi-don-hang` | `OrderTrackingPage` | Buyer | Tracking thật |
| Web | `/cua-hang/:dealerSlug/tai-khoan/lich-su-don-hang` | `OrderHistoryPage` | Buyer | Lịch sử/cancel/return thật |
| Web dealer | `/dai-ly/ban-hang` | `DealerSalesOrderPage` | Dealer | Confirm/process/ship/cancel/review return thật |
| Mobile | `/store/:slug/main`, `/products`, `/product/:id` | `frontend/mobile/lib/app/routes/app_pages.dart` | Public | Storefront/catalog/detail thật |
| Mobile | `/store/:slug/cart`, `/checkout`, `/orders/tracking`, `/orders/history` | `AppPages.routes` + `AuthMiddleware` | Buyer | Cart/checkout/order thật |
| Backend | `/api/storefronts/<dealer_slug>/...` | `backend/apps/customers/urls.py` | Tùy endpoint | Router trung tâm storefront |
| Backend dealer | `/api/customer-orders/...` | `backend/apps/orders/urls.py` → `CustomerOrderViewSet` | Dealer/Admin | Xử lý lifecycle |

`frontend/web-site/src/App.jsx` import `OrderStatusPage` và `StorefrontEntryRedirect` nhưng không route hai component này. `OrderStatusPage` vì vậy là UI chết theo router hiện tại.

## 3. Storefront theo dealer slug, catalog và detail

### 3.1 Trace web

| Bước | UI handler / state | Hook/service và request | Backend router/view/service | Serializer/model/response | Cập nhật state / kết luận |
|---|---|---|---|---|---|
| 1. Nhập slug | `DealerSlugEntryPage` normalize và lưu `STORE_DEALER_SLUG_KEY` | `buyerDealerService.getDealer(slug)` → `GET /storefronts/{slug}/` | `customers/urls.py` → `StorefrontDealerProfileView.get()` → `_get_dealer_profile_for_about()` | `StorefrontDealerProfileSerializer(DealerProfile)` | Chỉ dealer + account active được trả về |
| 2. Đồng bộ route | `StorefrontSlugSync`; `useDealerSlug()` ưu tiên `useParams().dealerSlug`, fallback localStorage | `useStorefrontPaths()` sinh toàn bộ URL có prefix slug | Không gọi backend | Không có model | Mọi route buyer giữ slug |
| 3. Danh mục + catalog | `useBuyerCatalog()` / `useBuyerCatalogProducts()` | `buyerCatalogService.getCategory`, `getProducts`; `loadCatalog()` có `Map` cache theo slug | `StorefrontCategoryListView`, `StorefrontProductListView` → `catalog_services` | `StorefrontCategorySerializer`, `StorefrontProductListSerializer` | State `categories`, `products`, pagination; cache không có TTL |
| 4. Lọc/tìm/sort | `ProductsPage`, search hook | Query `category`, `search`, `ordering`, pagination | `apply_storefront_product_filters()` | `DealerProduct` active, đúng `dealer_profile`; stock annotate | Backend sort `price` theo `retail_price`, không theo `effective_price` |
| 5. Detail | `ProductDetailPage.loadProduct()` | song song `fetchBuyerProductById()` + `buyerReviewService.productRating()`; sau đó related | `StorefrontProductDetailView`; review summary view; related view | `StorefrontProductDetailSerializer` | `product`, `reviewSummary`, `related` |
| 6. View history | `addRecentlyViewed(paths.slug, product)` | localStorage theo slug | Không API | Không model | Lưu client, có prune TTL trong utility |
| 7. Interaction view | `recordProductView()` | `POST /storefronts/{slug}/interactions/`; debounce view bằng `sessionStorage` | `StorefrontInteractionTrackView` | Marketing model/service | Chỉ gọi khi đủ slug/product; web ghi add-cart cả khi guest để log trạng thái skip/auth |

### 3.2 Trace mobile

| Bước | Controller / handler | Repository/provider | API/backend | State/storage | Khác web |
|---|---|---|---|---|---|
| 1. Nhập slug | `StorefrontController.setSlug()` | `BuyerRepository.validateDealer()` → `BuyerApiProvider.getDealer()` | `GET /storefronts/{slug}/` | `slug`, `dealer`; lưu `StorageKeys.dealerSlug` trong `GetStorage` | Normalize lowercase |
| 2. Catalog | `ProductListController.loadData()/loadMore()` | `getCategories`, `getProducts` | Cùng API web | Rx `products`, `categories`, `hasMore`; generation token chống response cũ | Phân trang thật |
| 3. Detail | `ProductDetailController.loadDetail()` | `Future.wait(getProduct, getRelated, getProductReviewSummary)` | Cùng API web | Rx `product`, `related`, `reviewSummary` | Nếu một request lỗi thì cả `Future.wait` lỗi; web cho rating fail độc lập |
| 4. Interaction | `loadDetail()` sau khi load | `recordView()` | `POST interactions` | Không debounce trong controller | Chỉ ghi khi đã login |

### 3.3 Nguồn tồn và giá catalog

- `backend/apps/customers/catalog_services.py::_storefront_products_base_qs()` luôn lọc `dealer_profile=dealer`, `status=active`.
- `backend/apps/dealer_products/services.py::annotate_dealer_product_stock()` cộng `remaining_quantity` từ lô bán được.
- `backend/apps/dealer_products/inventory_queries.py::get_sellable_batches_qs()` chỉ lấy batch `MAIN`, `active`, `remaining_quantity > 0`, chưa soft-delete.
- Hàm này ghi rõ **không lọc HSD**; `mark_expired_inventory_batches()` chỉ được gọi ở stock-check/tạo order, không được gọi trực tiếp trước mọi GET catalog. Catalog có thể hiển thị snapshot trước lần đánh dấu hết hạn gần nhất.
- `StorefrontProductListSerializer._pricing()` → `product_display_price_to_dict()` → `compute_product_display_price()`: ưu tiên `manual_sale_price`, sau đó policy giảm giá đang active, cuối cùng `retail_price`.
- `StorefrontProductDetailSerializer._batch_dates()` lấy ngày của lô `MAIN` bán được.
- Web `formatBuyerProduct()` và mobile `ProductModel.displayPrice` dùng `effective_price`.

## 4. Giỏ hàng add/update/delete: storage cục bộ, không có API

### 4.1 Web

| Bước | Handler/function | Kiểm tra | Storage/API | State update | Điểm đáng chú ý |
|---|---|---|---|---|---|
| Add từ detail/card | `ProductDetailPurchase.handleAddToCart()` / `AddToCartButton` → `CartProvider.addToCart()` | buyer auth, product id, `isProductPurchasable`, duplicate | `sessionStorage`; interaction API riêng | append `buildCartItemFromProduct()` | Duplicate không cộng quantity; spam guard chỉ feedback |
| Buy now | `ProductDetailPurchase.handleBuyNow()` | purchasable; auth | React Router `location.state.buyNow` | Không thêm giỏ | Quantity có thể vượt tồn; checkout stock-check xử lý |
| Tăng | `CartProvider.increaseQuantity()` | Không check/max stock | sessionStorage qua effect | `quantity + 1` | UI cho vượt tồn để tách order/preorder |
| Giảm/set | `decreaseQuantity()`, `setItemQuantity()` | normalize min 1 | sessionStorage | map item | Không xóa khi về 0 |
| Chọn | `toggleSelectItem()`, `toggleAll()` | Không | sessionStorage | đổi `selected` | Chỉ item selected đi checkout |
| Xóa | `removeItem()` | id string compare | sessionStorage | filter item | Không API |
| Đồng bộ tồn | `CartPage` → `useBuyerCatalog()` → `syncItemsWithCatalog()` | Chỉ cập nhật sản phẩm có trong catalog response | GET toàn catalog | update `availableQuantity` | **Không cập nhật lại tên/giá/ảnh/unit** |
| Persist | `loadCartFromSession()/saveCartToSession()` | key `gm_cart_{slug}_{buyerId|guest}` | `sessionStorage` | hydrate/save | Giỏ mất khi đóng tab/session; guest và buyer tách key |

### 4.2 Mobile

| Bước | Handler/function | Kiểm tra | Storage/API | State update | Điểm lệch |
|---|---|---|---|---|---|
| Add | `ProductDetailController.addToCart()` → `CartController.addProduct()` | login, `product.inStock`, duplicate | `GetStorage`; interaction API | Rx list append | **Chặn hoàn toàn sản phẩm hết tồn**, không cho pre-order như web |
| Buy now | `ProductDetailController.buyNow()` | login + `inStock` | route arguments | Không thêm giỏ | Hết tồn không thể buy-now/preorder |
| Set quantity | `CartController.setQuantity()` | item tồn > 0; min 1 | `GetStorage` | mutate + refresh | Không giới hạn theo tồn |
| Select | `toggleSelect()` | chặn item out-of-stock | `GetStorage` | toggle | `syncWithCatalog()` tự bỏ chọn item hết tồn |
| Delete | `removeItem()` | Không | `GetStorage` | remove | Không API |
| Sync | `syncWithCatalog()` | chỉ stock map | catalog API | update stock | Không refresh giá/name/image |
| Persist | `_cartKey = CartUtils.sessionKey(slug,buyerId)` | key giống web | `GetStorage` | lưu JSON | Dù tên là `sessionKey`, đây là persistent storage, không phải session storage |

### 4.3 Kết luận cart

- API cart backend: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.
- Model cart backend: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.
- Merge guest cart vào buyer cart sau login: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.
- Đồng bộ cart web ↔ mobile: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.
- Giá trong cart không được tin bởi backend: payload order chỉ gửi `dealer_product_id`, `quantity`; backend tính lại.

## 5. Địa chỉ và delivery slots

### 5.1 Địa chỉ

| Bước | Web | Mobile | Backend | Model/transaction | Kết quả |
|---|---|---|---|---|---|
| List | `useBuyerAddresses.loadAddresses()` | `CheckoutController._loadAddresses()`, `ProfileController` | `StorefrontCustomerAddressViewSet.list()` | `CustomerAddress` lọc `customer__user=request.user` | Tenant theo user/token |
| Create | hook `createAddress()`; checkout `AddressFormModal` | checkout/profile `createAddress()` | `perform_create()` gắn `request.user.customer_profile` | Serializer bỏ default cũ nếu default mới | Response address; FE reload/append |
| Update | hook `updateAddress()` | Provider/repository có method, nhưng UI/controller sửa địa chỉ mobile: **KHÔNG TÌM THẤY TRONG SOURCE CODE** | `put/patch addresses/{id}` | `CustomerAddressSerializer.update()` | Web có UI/profile |
| Delete | hook xóa rồi tự set default kế tiếp bằng request thứ hai | `ProfileController.deleteAddress()` chỉ xóa local list | `destroy()` | DB không tự chọn default mới | Có thể còn danh sách không có default |
| Default | Web gọi PUT full payload với `is_default=true` | Mobile create hỗ trợ flag; UI set-default riêng: **KHÔNG TÌM THẤY TRONG SOURCE CODE** | `_unset_other_defaults()` dùng bulk update | Unique constraint `unique_default_customer_address` | Không bọc transaction trong serializer/view |
| Limit 5 | `MAX_BUYER_ADDRESSES=5` | `AppConstants.maxBuyerAddresses=5` | Validation/model limit 5: **KHÔNG TÌM THẤY TRONG SOURCE CODE** | Chỉ unique default | Client có thể bị bypass |

`Order` lưu cả FK `customer_address` và snapshot `receiver_name`, `receiver_phone`, `delivery_address`; sửa/xóa địa chỉ sau đặt không làm đổi snapshot đơn.

### 5.2 Delivery slots

| Bước | Function | Nguồn dữ liệu | Validation | Response/state |
|---|---|---|---|---|
| Load | Web `buyerOrder.getDelivery()`, mobile `getDeliverySlots()` | `StorefrontDeliverySlotsView.get()` → `get_available_delivery_slots()` | Dealer slug phải active; endpoint public | `dates[].slots[]`, `available`, `delivery_time` |
| Chọn mặc định | Web `findFirstAvailableDeliverySelection()`; mobile loop slot | Response backend | FE disable/chọn `available` | `selectedDate`, `selectedSlot` |
| Submit | `buildCreateOrderPayload()` / mobile map | Chỉ `delivery_date`, `delivery_slot` | `OrderCreateSerializer.validate()` → `resolve_delivery_time()` kiểm tra lại | Backend là nguồn xác thực |
| Rule | `delivery_slots.py::is_slot_available()` | System settings | booking window, lead time, cutoff sáng hôm sau, slot chưa qua | Sáng 07:00–09:00; chiều 16:00–19:00 |

Lệch UI: `frontend/web-site/src/utils/orderUtils.js::DELIVERY_SLOT_WINDOWS` fallback hiển thị sáng `06:00–11:00`, chiều `13:00–18:00`, khác định nghĩa backend. Khi có `delivery_time` thì UI ưu tiên datetime nên lệch chỉ lộ ở fallback.

## 6. Checkout, stock-check, pricing/discount snapshot và tạo đơn chuẩn

### 6.1 Trace end-to-end theo từng bước

| # | UI handler/state | Service/API | Router/view/serializer/service | DB/model + lock | Response và state sau |
|---|---|---|---|---|---|
| 1 | `OrderPage` lấy `buyNow` hoặc cart item selected; mobile `checkoutItems` tương tự | Không API | Không | Client snapshot | Tính subtotal client để hiển thị |
| 2 | Load address/slot/voucher | GET addresses, delivery-slots, vouchers | Các view tương ứng | Read-only | Set selection/default |
| 3 | Apply voucher preview | Web `buildVoucherApplyPayload()` có `dealer_slug`; mobile payload không có slug | `POST /vouchers/apply/` → `CartVoucherService.apply_voucher()` | Đọc `Promotion`, `DealerProduct`, usage | Preview dùng `retail_price`, không dùng effective batch price |
| 4 | Nhấn xác nhận | Web `handleOpenConfirm()`; mobile `prepareCheckout()` | `POST /storefronts/{slug}/check-stock/` | `StorefrontCheckStockView` → `check_items_stock()` | Không lock; chỉ snapshot available |
| 5 | Thiếu tồn | Web `StockShortfallModal`; mobile bottom sheet | Không API khi chọn | Không | Split `orderItems`, `preorderItems`, removed IDs |
| 6 | Tạo order thường | `submitCheckout()` / `_submitCheckout()` | `POST /storefronts/{slug}/orders/` | `OrderCreateSerializer` xác minh product active + dealer | Gọi `create_customer_order()` |
| 7 | Validate server | — | `_validate_delivery_time`, `_resolve_customer_address`, `_validate_order_items` | Address phải thuộc customer; product phải thuộc dealer | Reject nếu stale/tenant sai |
| 8 | Tạo header | — | `Order.objects.create()` | `Order`, status `pending` | Snapshot address/note/time |
| 9 | Allocate/deduct | — | `_build_order_items()` → `_allocate_batches()` → `_deduct_batch()` | `transaction.atomic`; query batch `select_for_update`; `DealerInventoryTransaction(SALE)` | Tồn trừ ngay, không reserve |
| 10 | Giá | — | `price_for_order_allocation(batch, qty)` | `OrderItem.unit_price`, `subtotal`, `import_price` snapshot | Giá được tính lại tại thời điểm lock lô |
| 11 | Voucher final | — | `apply_voucher_to_order()` | `PromotionUsage`, `Order.discount_amount` | Validate lại, require saved |
| 12 | Total/payment | — | `_create_cod_payment()` | shipping fee system setting; `CustomerPayment(CASH,COD,PENDING)` | `total`, `debt`; paid=0 |
| 13 | Side effects | — | favorite category, purchase interaction, status history, notification | Trong cùng atomic, nhưng notify không `on_commit` | Trả `OrderDetailSerializer`, HTTP 201 |
| 14 | Client success | Web/mobile xóa product IDs khỏi local cart | Không cart API | Client storage | Navigate tracking/preorders |

### 6.2 Giá và discount snapshot

- Catalog/cart hiển thị `effective_price`.
- Order chuẩn **không dùng giá client**. `OrderItem.unit_price` được lấy từ lô đã khóa qua `price_for_order_allocation()`.
- Snapshot được lưu: `OrderItem.product_title`, `unit`, `quantity`, `unit_price`, `import_price`, `subtotal`; header lưu subtotal/discount/shipping/total/paid/debt.
- Lý do/chính sách discount cụ thể (`policy_id`, `age_discount_reason`, base retail price) không được snapshot trên `OrderItem`: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.
- Preview voucher `CartVoucherService.apply_voucher()` tính `order_total` và eligible total bằng `DealerProduct.retail_price`.
- Final voucher `apply_voucher_to_order()` tính eligible total bằng `OrderItem.subtotal` đã dùng effective batch price. Vì vậy số preview có thể khác số final.
- Web/mobile hiển thị shipping fee hard-code `10000`; backend dùng `get_system_settings().shipping_fee`. Nếu config khác 10.000, modal trước submit lệch response thực tế.

### 6.3 Stock-check so với commit order

- `check_items_stock()` không lock và chỉ phục vụ UX.
- Bảo vệ cuối cùng nằm ở `_allocate_batches()` trong transaction tạo order; batch được `select_for_update`.
- Nếu buyer khác mua sau stock-check, request create sau sẽ đợi lock rồi kiểm tra `remaining_quantity`; không đủ thì raise và rollback toàn order.
- Order thường chỉ dùng một batch canonical `MAIN`; comment “FIFO/tách nhiều dòng” trong `_build_order_items()` không còn phản ánh implementation `_allocate_batches()` hiện tại.

## 7. Batch deduct/reserve reality và pre-order/waiting-stock

| Luồng | Lúc tạo | Reserve/deduct | Giá | Chuyển tiếp |
|---|---|---|---|---|
| Order thường | `create_customer_order()` | Deduct `MAIN` ngay, transaction `SALE` | Effective price tại allocation | `pending` |
| Check-stock | `check_items_stock()` | Không reserve, không deduct, không lock | Không tính giá | Chỉ trả snapshot |
| Pre-order request | `create_preorder_request()` | Không reserve, không deduct | Chưa tạo OrderItem giá | `submitted` |
| Dealer confirm pre-order | `dealer_confirm_preorder()` | Vẫn không deduct | Tạo order `waiting_stock` bằng **retail_price**, batch null | PreOrder `converted`, Order `waiting_stock` |
| Buyer accept proposal | `customer_accept_preorder()` | Vẫn không deduct ngay | Cùng `_convert_preorder_to_waiting_stock_order()` | Order `waiting_stock` |
| Hàng về | `try_allocate_waiting_orders()` | Khi đủ nguyên dòng mới lock lô và deduct | Ghi đè `unit_price`, `subtotal`, `import_price` của item | Đủ toàn đơn → `processing` |

Các điểm xác thực:

- Partial reservation của một dòng waiting-stock: **KHÔNG TÌM THẤY TRONG SOURCE CODE**; `_try_allocate_order_item()` chỉ allocate khi batch đủ toàn `quantity`.
- Recompute header `subtotal_amount`, `total_amount`, `debt_amount`, COD payment amount sau khi waiting-stock item đổi từ retail price sang effective price: **KHÔNG TÌM THẤY TRONG SOURCE CODE**. Source chỉ cập nhật từng `OrderItem`, nên header/payment có thể giữ giá cũ.
- `waiting_stock → confirmed`: **KHÔNG TÌM THẤY TRONG SOURCE CODE**. Khi đủ hàng, service chuyển thẳng `waiting_stock → processing`.
- Mobile chặn item `isOutOfStock` trước stock-check và chặn add hết tồn; vì vậy mobile không vào pre-order cho tồn bằng 0 từ storefront, dù API/controller pre-order tồn tại. Web cho phép.

## 8. Lifecycle order chính xác

### 8.1 Các transition thực sự có implementation

| Từ | Sang | Actor | UI handler | API | Service | Tác động phụ |
|---|---|---|---|---|---|---|
| Không có | `pending` | Buyer | `OrderPage.submitCheckout`; mobile `_submitCheckout` | `POST storefronts/{slug}/orders/` | `create_customer_order()` | Deduct, COD pending, history, notification |
| `pending` | `confirmed` | Dealer | `handleSingleConfirm` / bulk | `POST customer-orders/{id}/confirm/` | `dealer_confirm_order()` | History + notification |
| `confirmed` | `processing` | Dealer | `handleStartProcessing` / bulk | `POST .../start-processing/` | `dealer_start_processing()` | History + notification |
| `processing` | `shipping` | Dealer | `handleShipOrder` / bulk | `POST .../ship/` | `dealer_start_shipping()` | History + notification |
| `shipping` | `completed` | Buyer | Web `handleConfirmDelivery`; mobile `confirmReceived` | `POST storefronts/{slug}/orders/{id}/confirm-received/` | `buyer_confirm_received()` | Set cả delivered/completed time, COD paid, customer stats, history, notification |
| `pending` | `cancelled` | Buyer | Cancel modal/mobile action | `POST .../cancel/` | `cancel_customer_order(actor=buyer)` | Restore batch, cancel payment |
| `delivery_reschedule_proposed` | `cancelled` | Buyer | reject reschedule | `POST .../reject-delivery-reschedule/` | `customer_reject_delivery_reschedule()` | Clear proposal, restore batch, cancel payment |
| `pending/confirmed/processing/waiting_stock/delivery_reschedule_proposed` | `cancelled` | Dealer/Admin | Dealer cancel single/bulk | `POST customer-orders/{id}/cancel/` | `cancel_customer_order()` | Restore item có batch; item batch null bị skip |
| `completed` | `return_requested` | Buyer | Return modal/mobile action | `POST .../request-return/` | `buyer_request_return()` | Tạo full-return + refund subtotal |
| `return_requested` | `completed` | Dealer/Admin reject | `handleRejectReturnConfirm()` | `POST .../returns/{returnId}/review/` | `dealer_review_return(approved=false)` | Return `rejected`, history/notification |
| `return_requested` | `returned` | Dealer/Admin approve | `handleApproveReturn()` | Cùng API | `dealer_review_return(approved=true)` | Restore batch, refund payment flag, giảm customer total_spent |
| Không có | `waiting_stock` | Pre-order conversion | Pre-order UI | accept/confirm preorder API | `_convert_preorder_to_waiting_stock_order()` | OrderItem batch null, không deduct |
| `waiting_stock` | `processing` | System/import flow | Không phải nút order | Gọi từ luồng nhập kho | `try_allocate_waiting_orders()` | Allocate/deduct đủ toàn đơn |
| `waiting_stock` | `delivery_reschedule_proposed` | Dealer | `handleProposeRescheduleSubmit()` | `POST .../propose-delivery-reschedule/` | `dealer_propose_delivery_reschedule()` | Lưu ngày/lý do |
| `delivery_reschedule_proposed` | `waiting_stock` | Buyer | accept reschedule | `POST .../accept-delivery-reschedule/` | `customer_accept_delivery_reschedule()` | Áp ngày mới |

### 8.2 Trạng thái khai báo nhưng không có transition thực thi

- `delivered`: có enum/model/UI/filter/report, nhưng service buyer chuyển thẳng `shipping → completed`. Transition tạo `delivered`: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.
- `return_approved`, `return_rejected` ở `OrderStatus`: UI có label/filter, nhưng service chỉ dùng `OrderReturn.status=approved/rejected`; order trở về `completed` khi reject hoặc sang `returned` khi approve. Transition order tới hai status này: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.
- `cancel_requested`, `delivery_failed`: enum có, transition/action: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.
- Web `OrderDetailModal` có footer cho `delivered` gọi lại chính endpoint chỉ chấp nhận `shipping`; nếu DB có order `delivered`, nút “hoàn thành” sẽ nhận validation error.
- Mobile `OrderStatusUtils.canConfirmReceived()` trả true cho `shipping || delivered`, cùng mismatch.

## 9. Cancel, return review và restore inventory

### 9.1 Cancel

`cancel_customer_order()` được bọc `transaction.atomic`:

1. Kiểm tra actor/status.
2. `_restore_order_inventory()` duyệt item có batch.
3. Mỗi batch được lấy lại bằng `select_for_update()`.
4. Cộng `remaining_quantity`, đổi `depleted → active`.
5. Ghi `DealerInventoryTransaction(type=CANCEL_RESTORE)`.
6. Set cancel snapshot, debt=0, payment pending → cancelled.
7. `record_status_change(...cancelled...)`.

Web buyer chỉ cho cancel `pending` qua `canCancelBuyerOrder()`, đúng đường chính. Backend còn cho buyer cancel `delivery_reschedule_proposed`. Mobile `canCancel()` lại cho `pending || waiting_stock`, nhưng backend buyer không cho cancel trực tiếp `waiting_stock`; action đó sẽ lỗi nếu UI hiện.

### 9.2 Return

| Bước | Implementation | Dữ liệu | Restore/refund |
|---|---|---|---|
| Request | `buyer_request_return()` | Chỉ order `completed`; tạo một `OrderReturn` requested; tạo `OrderReturnItem` cho toàn bộ item | `refund_amount = sum(item.subtotal)`, không gồm shipping |
| Evidence | Web multipart có `evidence_file`; mobile request JSON chỉ có reason | `OrderReturn.evidence_file` | Mobile không upload evidence |
| Reject | `dealer_review_return(approved=false)` | Return status rejected, order về completed | Không restore/refund |
| Approve | `dealer_review_return(approved=true)` | Return status approved, order sang returned | `RETURN_RESTORE`, giảm paid/customer total_spent theo subtotal, payment paid → refunded |

Không có xác nhận hàng trả đã thực sự về kho trước restore: dealer bấm “Duyệt trả hàng” là restore ngay.

Return từng item/số lượng có serializer/model `OrderReturnItemWriteSerializer`, nhưng endpoint buyer `RequestOrderReturnSerializer` chỉ nhận reason/evidence và service luôn tạo full return. Partial return UI/API: **KHÔNG TÌM THẤY TRONG SOURCE CODE**.

## 10. Reviews

### 10.1 Trace

| Bước | Web | Mobile | Backend | Tenant/validation | State |
|---|---|---|---|---|---|
| Public list/summary | `ProductReviews`, `buyerReviewService.productReviews/productRating` | Detail chỉ load summary; public list UI: **KHÔNG TÌM THẤY TRONG SOURCE CODE** | `StorefrontProductReviewListView/SummaryView` | Dealer + active product id | Paginated reviews/aggregate |
| Pending | Profile review page → `pendingReview()` | `ReviewController.loadData()` | `StorefrontPendingReviewsView` → `get_pending_review_items()` | completed order của buyer + dealer | pending list |
| Create | `CreateReviewModal` multipart | `ReviewController.submitReview()` multipart | `ProductReviewCreateSerializer` → `create_product_review()` | Order completed, buyer owner, product thuộc order/dealer, unique | Reload list |
| Update | `UpdateReviewModal`, ảnh add/delete | Provider/repository có update/image methods nhưng controller/view gọi sửa ảnh/review: **KHÔNG TÌM THẤY TRONG SOURCE CODE** | Detail PATCH/image endpoints | `_get_review_for_user()` | Web refetch detail |
| Delete | Web + mobile | `deleteReview()` | `delete_product_review()` | Owner + dealer | Reload |

DB unique constraint `(customer_profile, dealer_product, order)` là bảo vệ cuối cùng chống duplicate review. Service vẫn có check `.exists()` trước create; race sẽ bị DB constraint chặn nhưng có thể nổi thành `IntegrityError` thay vì validation message vì không catch.

## 11. Notifications và cập nhật realtime

| Nguồn | Backend | Web | Mobile | Nhận xét |
|---|---|---|---|---|
| Order status | `record_status_change()` → `notify_customer_order_status_change()` | `NotificationRealtimeProvider`, bell, order refresh hook | `NotificationRealtimeController` | Gửi cho dealer và buyer, bỏ actor |
| Persist | `Notification`, `NotificationReceipt` | `GET /notifications/my/`, mark read | Cùng REST | Tenant theo `account=request.user` |
| Realtime | `push_notification_to_account()` → Channels group `notifications_{user.id}` | WebSocket hook/provider | `NotificationWebSocketService` | JWT query token map user id |
| Email | `notify_account()` → `send_notification_email_async()` | Không liên quan UI | Không liên quan UI | Gọi cùng luồng notify |
| Poll order | Web order realtime utilities/hooks | Ứng dụng refresh list/detail | Mobile poll 45 giây + snapshot `GetStorage` | Bổ sung cho WS |

`notify_account()` được gọi bên trong nhiều `transaction.atomic`, nhưng source không dùng `transaction.on_commit()`. Notification row nằm cùng transaction và rollback được; WebSocket/email được kích hoạt ngay nên có khả năng phát sự kiện trước commit hoặc phát “phantom” nếu transaction rollback sau đó.

Web bell `getBuyerNotificationRoute()` trả `orderStatusPath` cho mọi loại reference, không chỉ `customer_order`. Trang notification đầy đủ chỉ mark read, không navigate theo reference. Mobile chỉ navigate tracking nếu parser xác định notification liên quan order.

## 12. Hồ sơ các hàm quan trọng

| Hàm | File | Input | Output/tác động | Transaction/lock | Tenant guard |
|---|---|---|---|---|---|
| `loadCatalog()` | `frontend/web-site/src/hooks/useBuyerCatalog.js` | slug | category + all product cache | Không | Cache key slug |
| `CartProvider.addToCart()` | `frontend/web-site/src/contexts/cartProvider.jsx` | product, quantity | local item + interaction | Client only | Cart key slug+buyer |
| `OrderPage.submitCheckout()` | `frontend/web-site/src/pages/User/Order.jsx` | checkout state | order và/hoặc preorder | Hai HTTP call độc lập | slug route/token |
| `CheckoutController._submitCheckout()` | `frontend/mobile/lib/modules/checkout/controllers/checkout_controller.dart` | split/items/address/slot | order/preorder, clear cart | Hai HTTP call độc lập | currentSlug/token |
| `OrderCreateSerializer.create()` | `backend/apps/orders/serializers.py` | validated request | `Order` | Delegate atomic service | Product query dealer+active |
| `create_customer_order()` | `backend/apps/orders/services.py` | dealer/customer/address/items | Order COD pending | `atomic`; batch row lock | Address customer; product dealer |
| `_allocate_batches()` | Cùng file | product, qty | `(MAIN batch, qty)` | `select_for_update()` | Batch qua product đã validated |
| `_build_order_items()` | Cùng file | order/items/voucher | snapshot item, totals | Trong outer atomic | Voucher/product checks |
| `dealer_confirm_order()` | Cùng file | order/user | confirmed | `atomic`, **không lock Order** | View queryset/owner |
| `buyer_confirm_received()` | Cùng file | order/user | completed | `atomic`, **không lock Order** | Storefront order queryset |
| `cancel_customer_order()` | Cùng file | order/user/reason/actor | cancelled + restore | `atomic`; lock batch, **không lock Order** | Status actor + view tenant |
| `buyer_request_return()` | Cùng file | order/user/reason/evidence | full return requested | `atomic`, **không lock Order** | View buyer/dealer |
| `dealer_review_return()` | Cùng file | return/user/decision | reject hoặc returned | `atomic`; lock batch, **không lock OrderReturn/Order** | View finds return under order |
| `try_allocate_waiting_orders()` | `backend/apps/orders/waiting_stock_services.py` | optional product id | allocate + processing | `atomic`; batch lock, **không lock OrderItem/Order** | Product/order query |
| `create_product_review()` | `backend/apps/reviews/services.py` | buyer/dealer/order/product | review + images | `atomic`, DB unique | Triple ownership checks |
| `notify_account()` | `backend/common/notifications.py` | account/message/reference | receipt + WS + email | Không `on_commit` | Explicit account |

## 13. Transaction, select_for_update, race condition

### 13.1 Có bảo vệ

- Tạo order chuẩn: toàn bộ header, item, deduct, voucher usage, payment, history nằm trong `transaction.atomic`.
- Batch deduct dùng `get_sellable_batches_qs(...for_update=True)`.
- Cancel/return restore lấy batch lại bằng `DealerInventoryBatch.objects.select_for_update()`.
- DB có unique order code, voucher usage/order, review/order/product/customer, default address và payment transaction code.

### 13.2 Race còn tồn tại trực tiếp từ cấu trúc check-then-act

| Race | Bằng chứng source | Hậu quả có thể xảy ra |
|---|---|---|
| Sinh mã order/preorder | `count()+1`, không lock/counter/retry | Hai transaction đồng thời có thể sinh cùng code; unique constraint làm một request lỗi |
| Confirm/process/ship | View lấy object thường; service atomic nhưng không `select_for_update(Order)` | Hai request cùng đọc status cũ và cùng ghi/history/notify |
| Buyer receive | Không lock Order trước `_mark_cod_paid`, `_update_customer_stats` | Double request có thể cộng `total_orders/total_spent` nhiều lần |
| Cancel vs confirm/ship | Mỗi service kiểm tra object stale, không lock Order | Transition/restore có thể xen kẽ |
| Request return | Check pending/approved `.exists()` rồi create, không constraint “một pending return/order” | Hai request có thể tạo hai return requested |
| Review return | Không lock `OrderReturn`/`Order` | Hai reviewer có thể cùng restore/refund |
| Waiting-stock allocation | Query pending items không `select_for_update`; batch có lock | Hai worker có thể xử lý cùng OrderItem tuần tự nhưng dùng object stale |
| Voucher usage limits | `count()` rồi create usage; không lock promotion/usage quota | Vượt global/per-customer usage limit khi đồng thời |
| Set default address | Bulk unset + save, không atomic | Request đồng thời có thể đụng unique constraint/trạng thái không mong muốn |
| Notification | Push/email trước transaction commit | Event ngoài DB có thể đi trước commit/rollback |

## 14. Multi-tenant isolation

| Bề mặt | Guard trong source | Đánh giá |
|---|---|---|
| JWT storefront | `IsStorefrontCustomer`: buyer, `store_dealer_id`, token dealer slug == URL slug | Chặt |
| Public dealer/catalog | `_get_dealer_or_404`; product queryset `dealer_profile=dealer` | Chặt |
| Address | permission slug + queryset `customer__user=request.user` | Chặt |
| Order list/detail/action buyer | `_buyer_orders_qs`: customer profile + dealer | Chặt |
| Order dealer | `filter_customer_orders()` + explicit `order.dealer.account_id == request.user.id` | Chặt |
| Review | dealer-filtered queryset + owner check; create kiểm tra order/customer/dealer/product | Chặt |
| Notification | receipt filter theo request.user; WS group theo user id | Chặt theo account |
| Cart client | key slug + buyer id | Tách local; không phải security boundary |
| Voucher preview | Service lấy product theo global IDs; mobile không gửi dealer_slug | Lệch isolation ở preview; final order vẫn dealer-scoped |

## 15. Mock, routed/dead UI và FE/BE mismatch

| Mức | Vị trí | Phát hiện xác thực |
|---|---|---|
| Cao | `frontend/web-site/src/pages/User/CheckoutPage.jsx` | Toàn bộ address/items/place-order là mock; vẫn route `/dat-hang-1` |
| Cao | `frontend/web-site/src/pages/User/Payment.jsx` | Dùng `mockData`, button chỉ `console.log`; vẫn route `/thanh-toan` |
| Cao | `frontend/web-site/src/pages/User/OrderStatus.jsx` | Import nhưng không route; còn lọc status `received`, `preparing` không phải flow backend |
| Cao | `services.py::buyer_confirm_received()` vs UI | Backend `shipping→completed`; UI mô hình `shipping→delivered→completed` |
| Cao | Mobile cart/checkout | Chặn hết tồn nên không thể dùng pre-order hết tồn như web/API |
| Cao | Waiting-stock pricing | Item được reprice khi allocate nhưng header/payment không recompute |
| Cao | Split checkout web/mobile | Tạo order và preorder là hai request tuần tự, không transaction chung; order có thể thành công rồi preorder lỗi, UI catch nhưng order đã tồn tại và cart chưa được clear theo nhánh success |
| Trung bình | Voucher preview/final | Preview retail price; final effective item subtotal |
| Trung bình | Shipping fee | FE hard-code 10.000; backend config động |
| Trung bình | Address limit | FE giới hạn 5; backend không enforce |
| Trung bình | Mobile order cancel | UI utility cho `waiting_stock`; backend buyer không cho cancel trực tiếp status đó |
| Trung bình | Mobile confirm receive | Utility cho `delivered`; backend chỉ nhận `shipping` |
| Trung bình | Web order status labels | Có `return_approved/rejected`, nhưng order service không bao giờ set |
| Trung bình | `buyerOrder.js` comment | Comment nói `shipping→delivered` hoặc `delivered→completed`; endpoint thực chỉ `shipping→completed` |
| Thấp | `dealerCustumerOrder.js` | Service trùng/legacy; comment `Processing` sai mô tả; UI chính dùng `dealerOrderService.js` |
| Thấp | Catalog sort | Sort “price” theo retail, trong khi card hiển thị effective |
| Thấp | Mobile review | Provider/repository có update/upload/delete-image, nhưng UI/controller không gọi |
| Thấp | Notification routing web | Bell điều hướng mọi notification sang order tracking |

## 16. API và model liên quan

### 16.1 API chính

- Public: dealer profile, categories, products, product detail, bestsellers, related, product reviews, review summary, delivery slots.
- Buyer storefront: auth, profile, addresses CRUD, interactions, orders list/create/detail/cancel/confirm-received/reschedule/return, stock-check, preorder, reviews CRUD/images/pending.
- Dealer/Admin: `customer-orders` list/detail/confirm/start-processing/ship/cancel/propose-reschedule/review-return.
- Notification: `/notifications/my/`, `/{id}/mark_read/`, `/mark_all_read/`, WebSocket `/ws/notifications/?token=...`.

### 16.2 Model chính

| Model | File | Vai trò snapshot/quan hệ |
|---|---|---|
| `DealerProfile` | `backend/apps/dealers/models.py` | Tenant storefront theo slug |
| `DealerProduct` | `backend/apps/dealer_products/models.py` | Sản phẩm bán của dealer |
| `DealerInventoryBatch` | Cùng file | Lô canonical `MAIN`, tồn/import/manual price |
| `DealerInventoryTransaction` | Cùng file | IMPORT/SALE/CANCEL_RESTORE/RETURN_RESTORE/... |
| `CustomerProfile`, `CustomerAddress` | `backend/apps/customers/models.py` | Buyer riêng dealer và địa chỉ |
| `Order` | `backend/apps/orders/models.py` | Header, address/time/amount/status snapshots |
| `OrderItem` | Cùng file | Product/title/unit/price/import/batch snapshot |
| `CustomerPayment` | Cùng file | COD pending/paid/refunded/cancelled |
| `OrderStatusHistory` | Cùng file | Audit transition |
| `OrderReturn`, `OrderReturnItem` | Cùng file | Full return/review/refund |
| `PreOrderRequest`, item | Cùng file | Yêu cầu trước khi thành waiting-stock order |
| `ProductReview`, `ReviewImage` | `backend/apps/reviews/models.py` | Review đã mua |
| `PromotionUsage`, `CustomerSavedVoucher` | `backend/apps/promotions/models.py` | Voucher usage/save |
| `Notification`, `NotificationReceipt` | `backend/apps/notifications/models.py` | Notification và trạng thái đọc theo account |

## 17. Các mục KHÔNG TÌM THẤY TRONG SOURCE CODE

1. API/model cart backend.
2. Đồng bộ cart web-mobile hoặc merge guest cart sau login.
3. Reservation inventory cho order thường; implementation hiện tại deduct ngay.
4. Partial reserve cho waiting-stock.
5. Transition order thực `shipping → delivered` và `delivered → completed`.
6. Transition order tới `cancel_requested`, `delivery_failed`, `return_approved`, `return_rejected`.
7. Partial return theo item/quantity trên storefront buyer.
8. Backend enforce tối đa 5 địa chỉ.
9. Snapshot ID/lý do policy giảm tuổi lô trên `OrderItem`.
10. Recompute header/payment khi waiting-stock allocation đổi giá item.
11. `transaction.on_commit()` cho notification realtime/email.
12. Row lock `Order`/`OrderReturn` trong các action lifecycle.
13. Idempotency key cho create order, confirm-received, cancel, return review.
14. Transaction chung cho cặp create standard-order + create pre-order từ split checkout.
15. Mobile UI sửa review, thêm/xóa ảnh review dù repository đã có method.
16. Mobile public product review list trong trang detail; chỉ summary được load.
17. Mobile luồng đặt trước trực tiếp cho sản phẩm tồn bằng 0.

## 18. Kết luận audit

Luồng standard order có backend thực, tenant guard rõ và khóa batch đúng tại điểm deduct. Nguồn quyết định giá/tồn cuối cùng là backend, không phải cart client. Tuy nhiên lifecycle đang có một “đường thật” ngắn hơn UI (`shipping → completed`), nhiều status chỉ tồn tại ở enum/UI, và các action sau tạo đơn thiếu row lock/idempotency. Phần waiting-stock/pre-order không reserve và còn lệch snapshot tổng tiền sau allocation. Hai trang web mock vẫn được route, còn mobile chủ động chặn sản phẩm hết tồn nên không đạt parity với luồng pre-order web/backend.
