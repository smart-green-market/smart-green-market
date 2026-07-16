# Kiểm toán source code: kiến trúc, xác thực và xác minh Supplier/Dealer

## 1. Cấu trúc module

Phạm vi dưới đây chỉ ghi nhận thành phần đã đọc trực tiếp trong source. Điểm vào backend là `backend/config/urls.py::urlpatterns`; cấu hình runtime là `backend/config/settings.py`; web bắt đầu tại `frontend/web-site/src/App.jsx::App`; mobile định tuyến tại `frontend/mobile/lib/app/routes/app_pages.dart::AppPages.routes`.

```text
smart-green-market/
├─ backend/
│  ├─ config/
│  │  ├─ settings.py                 # Django/DRF/JWT/CORS/DB/media/email/channels
│  │  └─ urls.py                     # /api/ và Swagger/Redoc
│  ├─ apps/
│  │  ├─ accounts/                   # Account, JWT, profile, tài liệu, khóa đăng nhập
│  │  ├─ suppliers/                  # hồ sơ NCC, duyệt, trạng thái account
│  │  ├─ dealers/                    # hồ sơ đại lý, slug, duyệt, storefront link
│  │  ├─ customers/                  # buyer storefront, profile, địa chỉ, tenant permission
│  │  ├─ categories/                 # danh mục
│  │  ├─ product_catalog/            # dữ liệu sản phẩm chuẩn
│  │  ├─ supplier_products/          # sản phẩm NCC
│  │  ├─ dealer_products/            # sản phẩm/kho đại lý
│  │  ├─ purchase_orders/            # phiếu nhập Dealer→Supplier
│  │  ├─ orders/                     # đơn buyer và preorder
│  │  ├─ marketing/                  # segment/tương tác
│  │  ├─ promotions/, voucher/       # khuyến mại/voucher
│  │  ├─ reviews/, certifications/   # đánh giá/chứng nhận
│  │  ├─ notifications/              # thông báo DB/WebSocket
│  │  ├─ dashboard/, statistical/    # dashboard/thống kê
│  │  ├─ system_config/              # giới hạn nghiệp vụ động
│  │  └─ training_models/            # mô hình gợi ý
│  └─ common/                        # permission, validator, notification, pagination
├─ frontend/
│  ├─ web-site/
│  │  └─ src/
│  │     ├─ pages/                   # User, Supplier, Dealer, Admin
│  │     ├─ components/              # UI theo vai trò
│  │     ├─ contexts/                # auth và protected routes
│  │     ├─ services/api/            # Axios services
│  │     ├─ services/token/          # lưu/refresh token
│  │     ├─ layouts/                 # layout và đồng bộ storefront slug
│  │     └─ utils/                   # buyer auth/validation
│  └─ mobile/
│     └─ lib/
│        ├─ app/routes/, middleware/ # GetX routes và auth middleware
│        ├─ core/network/            # Dio, interceptor, refresh
│        ├─ data/providers/          # REST calls
│        ├─ data/repositories/       # repository buyer
│        ├─ modules/                 # entry/auth/home/product/cart/checkout/order/...
│        └─ shared/controllers/      # auth/storefront/cart/realtime
└─ docs/source-code-audit/           # tài liệu kiểm toán
```

Nguồn xác nhận module backend: `backend/config/settings.py::INSTALLED_APPS`. Nguồn xác nhận module web và route theo vai trò: `frontend/web-site/src/App.jsx::App`. Nguồn xác nhận module mobile: `frontend/mobile/lib/app/routes/app_pages.dart::AppPages.routes`.

## 2. Danh sách quy trình đã xác minh

| # | Quy trình thực sự có trong source | Điểm vào và hàm chính | Kết luận |
|---|---|---|---|
| 1 | Đăng ký account Admin/Supplier/Dealer và phát JWT | `backend/apps/accounts/views.py::RegisterView.post`; `backend/apps/accounts/serializers.py::RegisterSerializer.validate/create` | Có; Supplier/Dealer nhận `pending`; API không cho đăng ký Buyer chung |
| 2 | Đăng nhập chung, khóa tạm do sai mật khẩu, role routing web | `backend/apps/accounts/serializers.py::CustomTokenObtainPairSerializer.validate`; `backend/apps/accounts/login_guard.py::check_login_allowed/record_failed_login/reset_login_attempts`; `frontend/web-site/src/contexts/authProvider.jsx::AuthProvider.login` | Có |
| 3 | Refresh JWT có rotation/blacklist | `backend/apps/accounts/views.py::RefreshView`; `frontend/web-site/src/services/token/refreshTokenManager.js::refreshAccessToken`; `frontend/mobile/lib/core/network/api_interceptor.dart::ApiInterceptor.onError` | Có |
| 4 | Logout blacklist refresh | `backend/apps/accounts/views.py::LogoutView.post` | Backend có; web/mobile gọi thiếu body `refresh`, nên request hiện tại không đáp ứng serializer |
| 5 | Protected route Admin/Supplier/Dealer/Buyer | `frontend/web-site/src/contexts/*ProtectedRoute.jsx`; `frontend/mobile/lib/app/middleware/auth_middleware.dart::AuthMiddleware.redirect` | Có kiểm tra role/login; không kiểm tra trạng thái profile/account trên route |
| 6 | Storefront slug validation công khai | `frontend/web-site/src/layouts/StorefrontSlugSync.jsx::StorefrontSlugSync`; `frontend/mobile/lib/shared/controllers/storefront_controller.dart::StorefrontController.setSlug`; `backend/apps/customers/services.py::get_active_dealer_by_slug` | Có |
| 7 | Buyer đăng ký/đăng nhập riêng theo dealer slug | `backend/apps/customers/storefront_views.py::StorefrontRegisterView.post/StorefrontLoginView.post`; `backend/apps/customers/storefront_serializers.py::StorefrontRegisterSerializer/StorefrontLoginSerializer` | Có |
| 8 | Tenant isolation Buyer theo dealer | `backend/apps/customers/permissions.py::IsStorefrontCustomer.has_permission`; `backend/apps/accounts/models.py::Account.Meta.constraints` | Có ở backend và DB |
| 9 | Buyer xem/cập nhật profile và avatar | `backend/apps/customers/views.py::StorefrontCustomerProfileViewSet.retrieve/partial_update`; `backend/apps/customers/serializers.py::CustomerProfileUpdateSerializer.update` | Có |
| 10 | Supplier onboarding account → profile → 3 tài liệu | `frontend/web-site/src/pages/Supplier/Step1.jsx::handleSubmit`; `Step2.jsx::handleSubmit`; `Step3.jsx::handleSubmit` | Có, nhưng FE đăng nhập thừa sau register và parse response create sai |
| 11 | Dealer onboarding account → profile → 3 tài liệu, resume | `frontend/web-site/src/pages/Dealer/Register/Step1.jsx::handleSubmit`; `Step2.jsx::handleSubmit`; `Step3.jsx::handleSubmit`; `dealerRegistrationHelpers.js::attemptResumeDealerRegistration` | Có; profile và tài liệu là hai request, không atomic |
| 12 | Admin duyệt/từ chối từng tài liệu | `frontend/web-site/src/pages/Admin/Document.jsx::handleApprove/handleReject`; `backend/apps/accounts/document_views.py::AccountDocumentViewSet.verify` | Có |
| 13 | Admin duyệt/từ chối Supplier sau khi đủ tài liệu | `frontend/web-site/src/pages/Admin/Suppiler.jsx::handleApprove/handleReject`; `backend/apps/suppliers/views.py::SupplierViewSet.verify` | Có |
| 14 | Admin duyệt/từ chối/khóa/mở Dealer | `frontend/web-site/src/pages/Admin/Dealer.jsx::handleApprove/handleReject/handleLock/handleUnlock`; `backend/apps/dealers/views.py::DealerProfileViewSet.verify/account_status` | Có |
| 15 | Supplier/Dealer cập nhật account/profile/logo/avatar | `frontend/web-site/src/pages/Supplier/SupplierInfoPage.jsx::handleSavePersonal/handleSaveCompany/handleConfirmAvatar`; `frontend/web-site/src/pages/Dealer/Info/DealerInfoPage.jsx::handleSavePersonal/handleSaveStore` | Có |
| 16 | Thông báo khi tài liệu/profile/status được xử lý | `backend/common/notifications.py::notify_account/notify_admins`; `backend/common/notification_email.py::send_notification_email_async` | Có DB receipt, WebSocket và email tùy cấu hình |
| 17 | Password reset/forgot password | KHÔNG TÌM THẤY TRONG SOURCE CODE | Không có endpoint/UI trong phạm vi repo đã rà |
| 18 | Xác minh email/OTP/MFA | KHÔNG TÌM THẤY TRONG SOURCE CODE | Không có |
| 19 | Mobile cho Admin/Supplier/Dealer | KHÔNG TÌM THẤY TRONG SOURCE CODE | Mobile hiện chỉ triển khai buyer storefront |

## 3. Công nghệ và cấu hình

| Lớp | Công nghệ/config đã xác minh | Nguồn chính xác |
|---|---|---|
| Backend | Python, Django 6.0.5, DRF 3.17.1, SimpleJWT 5.5.1, drf-spectacular, PostgreSQL, Cloudinary/FileSystem, WhiteNoise | `backend/requirements.txt`; `backend/config/settings.py::INSTALLED_APPS/DATABASES/STORAGES` |
| Realtime | ASGI/Daphne, Channels, Redis hoặc InMemory channel layer | `backend/config/settings.py::ASGI_APPLICATION/CHANNEL_LAYERS` |
| Auth backend | `JWTAuthentication`; mặc định `IsAuthenticated`; access 2 giờ, refresh 7 ngày, rotate + blacklist | `backend/config/settings.py::REST_FRAMEWORK/SIMPLE_JWT` |
| Web | React 19.2.6, React Router 7.18.1, Axios 1.18.1, Vite 8, Tailwind 4, Sonner, Recharts, Vitest | `frontend/web-site/package.json`; `frontend/web-site/vite.config.js::defineConfig` |
| Web API base | `VITE_API_URL`, fallback hiện tại `http://127.0.0.1:8000/api` | `frontend/web-site/src/config/apiConfig.js::API_BASE_URL`; `frontend/web-site/.env.example` |
| Mobile | Flutter/Dart SDK `^3.11.4`, GetX, Dio, GetStorage, WebSocket, image_picker | `frontend/mobile/pubspec.yaml` |
| Mobile API base | Hard-code `https://smart-green-market-api.onrender.com/api` | `frontend/mobile/lib/core/constants/api_constants.dart::ApiConstants.defaultBaseUrl` |
| CORS | Mặc định cho mọi origin và cho credentials | `backend/config/settings.py::CORS_ALLOW_ALL_ORIGINS/CORS_ALLOW_CREDENTIALS` |
| Email | Tắt mặc định; SMTP/console; có thread daemon tùy `NOTIFICATION_EMAIL_ASYNC` | `backend/config/settings.py::NOTIFICATION_EMAIL_*`; `backend/common/notification_email.py::send_notification_email_async` |

Ghi nhận cấu hình: `backend/.env.example` chứa một giá trị `DB_PASSWORD=Nguyen+man1`; đây là mật khẩu mẫu được commit trong source, không chứng minh là credential production nhưng nên thay bằng placeholder.

## 4. Kiến trúc API và xác thực

### 4.1 API calling, JWT, refresh và logout

| Hành vi | Web | Mobile | Backend |
|---|---|---|---|
| Gắn access token | `frontend/web-site/src/services/api/axiosClient.js::request interceptor` đọc `getAccessToken()` và đặt `Authorization: Bearer` | `frontend/mobile/lib/core/network/api_interceptor.dart::ApiInterceptor.onRequest` đọc `StorageKeys.accessToken` | `backend/config/settings.py::REST_FRAMEWORK.DEFAULT_AUTHENTICATION_CLASSES` dùng `JWTAuthentication` |
| Lưu token | `frontend/web-site/src/services/token/authTokenStorage.js::saveAuthTokens` ghi localStorage | `frontend/mobile/lib/shared/controllers/auth_controller.dart::AuthController._persistSession` ghi GetStorage | Backend chỉ phát token; không lưu access token ứng dụng |
| Refresh khi 401 | `axiosClient` đánh `_retry`, gọi `refreshAccessToken`, xếp hàng trong `refreshQueue`, retry request | `ApiInterceptor.onError` dùng `QueuedInterceptor`, `_queue`, `_retryRequest` | `backend/apps/accounts/views.py::RefreshView` kế thừa `TokenRefreshView`; rotation/blacklist theo settings |
| Refresh thất bại | `clearAuthStorage`, phát event `unauthorized`, `redirectToLoginByPath` | Xóa access/refresh/user; trả lỗi, không tự route trong interceptor | SimpleJWT trả 401 |
| Logout đúng contract | Service phải gửi `{refresh: token}` theo `backend/apps/accounts/serializers.py::LogoutSerializer` | KHÔNG TÌM THẤY TRONG SOURCE CODE | `backend/apps/accounts/views.py::LogoutView.post` blacklist `RefreshToken` |
| Logout thực tế | `authAdminService.js::authService.logout` và `Buyer/authBuyerService.js::logout` gọi `POST /logout/` không body; `AuthProvider.logout` vẫn xóa local trong `finally` | `buyer_api_provider.dart::BuyerApiProvider.logout` gọi `POST /logout/` không body; `AuthController.logout` vẫn xóa local trong `finally` | Request thiếu `refresh` bị `LogoutSerializer.is_valid` từ chối trước blacklist |
| Thu hồi access ngay | KHÔNG TÌM THẤY TRONG SOURCE CODE | KHÔNG TÌM THẤY TRONG SOURCE CODE | `LogoutView.post` chỉ blacklist refresh; access tồn tại đến tối đa 2 giờ |

### 4.2 Login chung và role routing

| Bước | Trace thực tế |
|---|---|
| UI event | Supplier: `frontend/web-site/src/pages/Supplier/SupplierLogin.jsx::handleSubmit`; Dealer: `frontend/web-site/src/pages/Dealer/DealerLogin.jsx::handleSubmit`; Admin đi qua cùng context từ trang admin |
| FE handler/service | `frontend/web-site/src/contexts/authProvider.jsx::AuthProvider.login` → `frontend/web-site/src/services/api/authAdminService.js::authService.login` |
| HTTP | `POST {API_BASE_URL}/login/`, URL backend `/api/login/`; map tại `backend/apps/accounts/urls.py::urlpatterns` |
| Backend | `backend/apps/accounts/views.py::LoginView` → `backend/apps/accounts/serializers.py::CustomTokenObtainPairSerializer.validate` |
| Validator/model | `check_login_allowed`; SimpleJWT xác thực username/password; cấm storefront buyer dùng login chung; chặn `banned/inactive`; nạp `Supplier`/`DealerProfile`/`CustomerProfile` |
| Response | `access`, `refresh`, `account`, `supplier_profile`, `dealer_profile`, `customer_profile` theo `LoginResponseSerializer` |
| UI state/routing | `AuthProvider.login` kiểm `expectedRole`, lưu token/user; Admin→`/quan-tri`, Supplier→`/nha-cung-cap`, Dealer→`/dai-ly` |

`pending` không bị `CustomTokenObtainPairSerializer.validate` chặn. Protected routes `AdminProtectedRoute`, `SupplierProtectedRoute`, `DealerProtectedRoute` chỉ kiểm `user.role`, không kiểm `user.status` hay trạng thái profile. Đây là hành vi trực tiếp tại `frontend/web-site/src/contexts/adminProtectedRoute.jsx::AdminProtectedRoute`, `supplierProtectedRoute.jsx::SupplierProtectedRoute`, `dealerProtectedRoute.jsx::DealerProtectedRoute`.

### 4.3 Account state

| State | Nơi sinh/chuyển | Tác động được đọc thấy |
|---|---|---|
| `active` | Buyer storefront tạo active tại `StorefrontRegisterSerializer.create`; Supplier/Dealer được kích hoạt trong `SupplierViewSet.verify`/`DealerProfileViewSet.verify`; admin có thể đặt bằng `account_status` | Login được phép; `common/permission.py::IsActive.has_permission` cho qua |
| `pending` | Supplier/Dealer register tại `RegisterSerializer.create`; profile bị reject đưa account về pending trong hai `verify` action | Login chung vẫn được phép; một số API chỉ role-check nên vẫn truy cập được |
| `inactive` | Admin gọi `SupplierViewSet.account_status` hoặc `DealerProfileViewSet.account_status` | Login chung/storefront bị từ chối; `IsActive` từ chối |
| `banned` | Cùng hai action account status | Login chung/storefront bị từ chối |

`Account.is_active` kế thừa `AbstractUser` tồn tại nhưng luồng nghiệp vụ kiểm `Account.status`; KHÔNG TÌM THẤY TRONG SOURCE CODE thao tác đồng bộ `is_active` với `status`.

## 5. Buyer storefront: auth, token và dealer isolation

### 5.1 Đăng ký Buyer

| UI event | FE handler/service | Method, endpoint, URL | Backend view/action | Serializer/service/model | Notification/response/UI |
|---|---|---|---|---|---|
| Web submit form | `UserRegisterPage.handleSubmit` → `buyerAuthUtils.registerBuyer` → `authBuyerService.register` | POST `/storefronts/{dealerSlug}/register/`; URL đầy đủ `{API_BASE_URL}/storefronts/{slug}/register/` | `StorefrontRegisterView.post` | `StorefrontRegisterSerializer.validate/create` → `get_active_dealer_by_slug`, `storefront_buyer_exists`, `build_storefront_username` → `Account`, `CustomerProfile`; signal `assign_default_segment_on_create` | Không có notification auth; `build_storefront_auth_response` trả token/account/profile/store; FE `saveBuyerSession`, `syncSession`, route storefront |
| Mobile nhấn Đăng ký | `RegisterView._submit` → `AuthPageController.register` → `AuthController.register` → `BuyerRepository.register` → `BuyerApiProvider.register` | POST cùng endpoint | Cùng backend | Cùng serializer/model | `AppSnackbar.success`; `_persistSession`; route `AppRoutes.main(slug)` |

Ràng buộc tenant ở DB là `Account.Meta.constraints::unique_buyer_email_per_dealer`; email Buyer có thể lặp giữa hai dealer nhưng không lặp trong cùng dealer. Account Buyer còn giữ FK `store_dealer` với `on_delete=CASCADE` tại `backend/apps/accounts/models.py::Account.store_dealer`.

### 5.2 Đăng nhập Buyer

| UI event | FE handler/service | Method, endpoint, URL | Backend view/action | Serializer/validator/model | Response/UI |
|---|---|---|---|---|---|
| Web submit | `UserLoginPage.handleSubmit` → `loginBuyer` → `authBuyerService.login` | POST `/storefronts/{slug}/login/` | `StorefrontLoginView.post` | `StorefrontLoginSerializer.validate`: lấy dealer active đúng slug, query `Account(role=buyer, store_dealer=dealer, email__iexact)`, login guard, password, account status | `build_storefront_auth_response`; FE lưu token/user/slug và quay lại `location.state.from` hoặc trang chủ |
| Mobile nhấn Đăng nhập | `LoginView._submit` → `AuthPageController.login` → `AuthController.login` → repository/provider | POST cùng endpoint | Cùng backend | Cùng serializer | Snackbar, lưu session, redirect cũ hoặc main |

`StorefrontRefreshToken.for_user` thêm `auth_scope`, `store_dealer_id`, `store_dealer_slug` vào refresh và access. Backend tenant enforcement cho API không chỉ tin claim: `IsStorefrontCustomer.has_permission` kiểm `request.user.role`, `request.user.store_dealer_id` và `request.user.store_dealer.slug == dealer_slug`.

### 5.3 Slug isolation và route guard

| Lớp bảo vệ | Cơ chế | Phát hiện |
|---|---|---|
| Public storefront | `backend/apps/customers/services.py::get_active_dealer_by_slug` chỉ trả DealerProfile `active` và Account `active` | Tốt |
| Endpoint buyer | `backend/apps/customers/permissions.py::IsStorefrontCustomer.has_permission` so tenant DB với URL slug | Tốt; token dealer A bị 403 ở URL dealer B |
| Query profile/address | `StorefrontCustomerProfileViewSet.get_queryset/get_object`; `StorefrontCustomerAddressViewSet.get_queryset` lọc theo `request.user` | Tốt |
| Web route | `BuyerRouteProtect` chỉ gọi `isBuyerUser`; `StorefrontSlugSync` lưu slug URL nhưng không so với `user.store_dealer_slug` | Thiếu guard tenant phía UI; backend vẫn chặn API |
| Mobile route | `AuthMiddleware.redirect` chỉ kiểm `auth.isLoggedIn`; `AuthController.matchesDealer` có nhưng KHÔNG TÌM THẤY TRONG SOURCE CODE nơi gọi hàm này | Thiếu guard tenant phía UI; backend vẫn chặn API |
| Token refresh | Refresh dùng endpoint chung `/api/refresh/`; claim storefront nằm trong refresh do `StorefrontRefreshToken.for_user` | Có scope trong token; permission quyết định truy cập |

### 5.4 Cập nhật profile Buyer

| UI event | FE/mobile service | HTTP | Backend | Model/response/UI |
|---|---|---|---|---|
| Web modal lưu profile | `frontend/web-site/src/components/User/Profile/EditProfileModal.jsx` qua `frontend/web-site/src/hooks/useBuyerProfile.js`; service `Buyer/buyerProfileService.js` | PATCH/PUT `/storefronts/{slug}/me/` tùy service caller | `StorefrontCustomerProfileViewSet.partial_update/update` → `CustomerProfileUpdateSerializer.update` | Cập nhật `CustomerProfile.favorite_category`, `Account.full_name/phone/avatar`; trả `CustomerProfileSerializer`; UI cập nhật hook state |
| Mobile update | `BuyerRepository.updateProfile` → `BuyerApiProvider.updateProfile` | PUT `/storefronts/{slug}/me/` | `update` chuyển thẳng sang `partial_update` | Trả map profile; không có notification |

## 6. Supplier/Dealer registration và xác minh

### 6.1 Supplier onboarding

| Bước/UI event | FE handler/service | Method/endpoint | Backend trace | Response/notification/UI state |
|---|---|---|---|---|
| 1. Nhấn Tiếp tục tạo account | `Supplier/Step1.jsx::handleSubmit` → `accountService.create`; sau đó `authService.login` | POST `/register/`, rồi POST `/login/` | `RegisterView.post` → `RegisterSerializer.validate/create` → `Account(status=pending, role=supplier)` → `RefreshToken.for_user`; login qua `LoginView` | Register đã trả token nhưng FE không dùng; FE login lại, lưu token, sang bước 2 |
| 2. Lưu hồ sơ doanh nghiệp | `Supplier/Step2.jsx::handleSubmit` → `supplierService.create` | POST `/suppliers/` | `SupplierViewSet.create/perform_create` mặc định → `SupplierSerializer.validate/create` → `Supplier` | Backend trả trực tiếp object 201; FE đọc `res.data.data`, vì vậy `result` là `undefined` nhưng side effect tạo profile vẫn có và UI vẫn gọi `onNext` |
| 3. Hoàn tất tải 3 file | `Supplier/Step3.jsx::handleSubmit` → `supplierDocumentService.upload` | multipart POST `/account-documents/` | `AccountDocumentViewSet.create` → `AccountDocumentBulkUploadSerializer.validate/create` → ba `update_or_create` | Mỗi tài liệu gọi `_notify_admins_new_document` → `notify_admins`; FE sang hoàn tất |

Sai nhãn UI: `Supplier/Step3.jsx::DOC_TYPES` hiển thị `tax_certificate` là “Chứng nhận sản phẩm/VietGAP”, trong khi model `AccountDocumentType.TAX_CERTIFICATE` là “Giấy chứng nhận thuế”.

### 6.2 Dealer onboarding

| Bước/UI event | FE handler/service | Method/endpoint | Backend trace | Response/notification/UI state |
|---|---|---|---|---|
| 1. Tạo account | `Dealer/Register/Step1.jsx::handleSubmit` → `accountService.create` → `authService.login`; nếu trùng gọi `attemptResumeDealerRegistration` | POST `/register/`, POST `/login/` | Cùng `RegisterView`/`LoginView`; role dealer, account pending | Lưu token/user; resume có thể gọi profile và documents hiện có |
| 2. Nhập cửa hàng | `Dealer/Register/Step2.jsx::handleSubmit` | Không gọi API; chỉ `onNext` giữ draft | Không có backend | UI sang bước 3 |
| 3. Hoàn tất | `Dealer/Register/Step3.jsx::handleSubmit` → `dealerService.completeRegistration` | GET `/dealers/`; POST hoặc PATCH `/dealers/{id}/`; sau đó POST `/account-documents/` | `DealerProfileViewSet` + `DealerProfileSerializer.create/validate`; `DealerProfile.save` → `assign_unique_store_code`; sau đó document flow | `perform_create` báo admin có profile mới; document create báo admin cho từng file; UI hoàn tất |

`dealerService.completeRegistration` không phải một transaction: nếu profile thành công nhưng upload tài liệu thất bại, profile vẫn tồn tại. Resume cố khôi phục bằng `attemptResumeDealerRegistration`.

### 6.3 Admin duyệt tài liệu

| UI event | FE handler/service | Method/endpoint | Backend action | Validator/model/notification | UI state |
|---|---|---|---|---|---|
| Duyệt | `Admin/Document.jsx::handleApprove` → `accountDocumentService.verify` | POST `/account-documents/{document_id}/verify/`, body `status=approved` | `AccountDocumentViewSet.verify` | `VerifyAccountDocumentSerializer.validate` → `_apply_document_verification`: status, verified_by, verified_at → `_notify_document_review` → `notify_account` | Đóng modal, `refresh()` danh sách |
| Từ chối | `Admin/Document.jsx::handleReject` → cùng service, body rejected + reason | Cùng endpoint | Cùng action | `require_rejection_reason`; model chỉ lưu status/reviewer/time; reason chỉ đưa vào nội dung notification | Đóng modal, refresh |

`AccountDocument` KHÔNG có trường `rejection_reason` tại `backend/apps/accounts/models.py::AccountDocument`; lý do từ chối tài liệu không thể đọc lại từ API sau khi notification đã phát.

### 6.4 Admin duyệt Supplier

| UI event | FE handler/service | Method/endpoint | Backend action | Validator/service/model | Notification/response/UI |
|---|---|---|---|---|---|
| Mở chi tiết | `Admin/Suppiler.jsx::handleViewSupplier` → `supplierService.getById` | GET `/suppliers/{id}/` | `SupplierViewSet.retrieve` | `SupplierDetailSerializer` nạp account/documents/certifications/products | FE chỉ map một phần detail và không giữ `documents`, nên modal Supplier không hiển thị tài liệu từ object này |
| Duyệt | `handleApprove` → `supplierService.verify` | POST `/suppliers/{id}/verify/`, `verification_status=approved` | `SupplierViewSet.verify` | `VerifySupplierSerializer`; `_validate_supplier_ready_for_approval` yêu cầu đủ 3 tài liệu approved; lưu Supplier approved; nếu Account pending thì active | `supplier_verification_updated` → `notify_account`; response `SupplierDetailSerializer`; FE refresh |
| Từ chối | `handleReject` → service | Cùng URL, `verification_status=rejected` + reason | Cùng action | Lưu Supplier rejected/reason/reviewer/time; Account→pending | Notification buyer account; FE đóng modal + refresh |

### 6.5 Admin duyệt và khóa Dealer

| UI event | FE handler/service | Method/endpoint | Backend action | Validator/model/notification | UI state |
|---|---|---|---|---|---|
| Mở detail | `Admin/Dealer.jsx::handleViewDealer` → `dealerService.getById` | GET `/dealers/{id}/` | `DealerProfileViewSet.retrieve` | `DealerProfileDetailSerializer` gồm account/documents/products | Modal nhận full detail |
| Duyệt | `handleApprove` kiểm `getDealerApprovalDocumentError`, rồi `dealerService.verify` | POST `/dealers/{id}/verify/`, status active | `DealerProfileViewSet.verify` | Backend kiểm lại `_validate_dealer_ready_for_approval`; Dealer active; Account pending→active; notification | Đóng modal + refresh |
| Từ chối | `handleReject` | Cùng URL, status rejected + reason | Cùng action | Dealer rejected; Account pending; notification | Đóng modal + refresh |
| Khóa/mở | `handleLock/handleUnlock` → `dealerService.statusUpdate` | POST `/dealers/{id}/account-status/`, inactive/active | `DealerProfileViewSet.account_status` | `SupplierAccountStatusSerializer`; chỉ đổi `Account.status`; `notify_account` | Đóng modal + refresh |

Service backend có `SupplierViewSet.account_status` và FE có `supplierService.status`, nhưng KHÔNG TÌM THẤY TRONG SOURCE CODE UI Admin Supplier gọi `supplierService.status`; trang Admin Supplier hiện chỉ duyệt/từ chối profile.

## 7. Profile update sau đăng ký

| Đối tượng | UI handler → service | Endpoint → backend | Fields/model | UI state |
|---|---|---|---|---|
| Account Supplier | `SupplierInfoPage.handleSavePersonal` → `accountService.updateProfile`; avatar qua `handleConfirmAvatar` → `updateAvatar` | PUT `/profile/` → `ProfileView.put` → `ProfileSerializer`; POST `/profile/avatar/` → `AvatarView.post` → `AvatarUploadSerializer` | full_name/email/phone; avatar qua `save_account_avatar` | Merge state/localStorage; toast |
| Supplier profile | `SupplierInfoPage.handleSaveCompany` → `supplierService.update` | PATCH `/suppliers/{id}/` → `SupplierViewSet.partial_update` → `SupplierSerializer.validate` | company/tax/phone/address/description/bank fields/logo | Merge local state; toast |
| Account Dealer | `DealerInfoPage.handleSavePersonal` → `accountService.updateProfile/updateAvatar` | Cùng account endpoints | Account text/avatar | Merge state/localStorage; toast |
| Dealer profile | `DealerInfoPage.handleSaveStore` → `dealerService.update`; gọi lại storefront link | PATCH `/dealers/{id}/` → `DealerProfileViewSet.partial_update` → `DealerProfileSerializer.validate` | store_name/address/description/logo; slug read-only không đổi | Merge profile, toast |

Sau Supplier/Dealer profile update, KHÔNG TÌM THẤY TRONG SOURCE CODE logic reset trạng thái profile về `pending`, reset `verified_by/verified_at`, hoặc buộc admin duyệt lại. Tương tự, thay tài liệu có reset tài liệu về pending trong `AccountDocumentBulkUploadSerializer.create`, nhưng profile đã approved không tự hạ trạng thái.

## 8. Bảng API trong phạm vi

| Method | URL repo | View/action | Permission thực tế | Serializer chính |
|---|---|---|---|---|
| POST | `/api/register/` | `RegisterView.post` | `AllowAny` | `RegisterSerializer` |
| POST | `/api/login/` | `LoginView` | `AllowAny` | `CustomTokenObtainPairSerializer` |
| POST | `/api/refresh/` | `RefreshView` | Token refresh công khai | SimpleJWT serializer |
| POST | `/api/verify/` | `VerifyView` | Công khai | SimpleJWT verify serializer |
| POST | `/api/logout/` | `LogoutView.post` | Mặc định `IsAuthenticated` | `LogoutSerializer` |
| GET/PUT | `/api/profile/` | `ProfileView.get/put` | Mặc định `IsAuthenticated` | `ProfileSerializer` |
| POST/DELETE | `/api/profile/avatar/` | `AvatarView.post/delete` | `IsAuthenticated` | `AvatarUploadSerializer` |
| POST | `/api/change-password/` | `ChangePasswordView.post` | Mặc định `IsAuthenticated` | `ChangePasswordSerializer` |
| CRUD | `/api/account-documents/` | `AccountDocumentViewSet` | write Supplier/Dealer; verify Admin; list mặc định `IsAdminOrSupplier` (thực tế gồm Dealer) | bulk/read/write serializers |
| POST | `/api/account-documents/{id}/verify/` | `AccountDocumentViewSet.verify` | `IsAdmin` | `VerifyAccountDocumentSerializer` |
| CRUD | `/api/suppliers/` | `SupplierViewSet` | write Supplier; review Admin; catalog Dealer theo action | Supplier serializers |
| POST | `/api/suppliers/{id}/verify/` | `SupplierViewSet.verify` | `IsAdmin` | `VerifySupplierSerializer` |
| POST | `/api/suppliers/{id}/account-status/` | `SupplierViewSet.account_status` | `IsAdmin` | `SupplierAccountStatusSerializer` |
| CRUD | `/api/dealers/` | `DealerProfileViewSet` | write Dealer; review Admin | Dealer serializers |
| GET | `/api/dealers/me/` | `DealerProfileViewSet.me` | `IsDealer` | `DealerProfileDetailSerializer` |
| GET | `/api/dealers/me/storefront-link/` | `DealerProfileViewSet.storefront_link` | `IsDealer` | `DealerStorefrontLinkSerializer` |
| POST | `/api/dealers/{id}/verify/` | `DealerProfileViewSet.verify` | `IsAdmin` | `VerifyDealerSerializer` |
| POST | `/api/dealers/{id}/account-status/` | `DealerProfileViewSet.account_status` | `IsAdmin` | `SupplierAccountStatusSerializer` |
| POST | `/api/storefronts/{slug}/register/` | `StorefrontRegisterView.post` | `AllowAny` | `StorefrontRegisterSerializer` |
| POST | `/api/storefronts/{slug}/login/` | `StorefrontLoginView.post` | `AllowAny` | `StorefrontLoginSerializer` |
| GET/PUT/PATCH | `/api/storefronts/{slug}/me/` | `StorefrontCustomerProfileViewSet` | `IsStorefrontCustomer` | profile read/update serializers |

Lưu ý tên permission: `IsAdminOrSupplier` tại `backend/common/permission.py::IsAdminOrSupplier.has_permission` thực tế cho cả Admin, Supplier và Dealer; tên class/docstring không đồng nhất với hành vi.

## 9. Bảng model và quan hệ

| Model | Trường/state trọng yếu | Ràng buộc/quan hệ | Nguồn |
|---|---|---|---|
| `Account` | role admin/supplier/dealer/buyer; status active/inactive/banned/pending; email, avatar, deleted_at | Buyer FK `store_dealer`; email unique có điều kiện cho vai trò global; `(store_dealer,email)` unique cho Buyer | `backend/apps/accounts/models.py::Account/AccountRole/AccountStatus` |
| `LoginAttempt` | username, failed_count, locked_until | username unique | `backend/apps/accounts/models.py::LoginAttempt` |
| `AccountDocument` | type business_license/id_card/tax_certificate; status pending/approved/rejected | FK account; unique `(account, document_type)`; reviewer FK | `backend/apps/accounts/models.py::AccountDocument` |
| `Supplier` | company/tax/contact/bank; verification pending/approved/rejected; rejection_reason | OneToOne Account; tax_code unique | `backend/apps/suppliers/models.py::Supplier` |
| `DealerProfile` | store_name, random slug, address/logo; status pending/active/inactive/rejected | OneToOne Account; slug unique; `save` tự gán slug | `backend/apps/dealers/models.py::DealerProfile` |
| `CustomerProfile` | favorite_category, order metrics, note | OneToOne Account; dealer suy từ `user.store_dealer` | `backend/apps/customers/models.py::CustomerProfile` |
| `CustomerAddress` | receiver/address/default | FK CustomerProfile; unique một default/customer | `backend/apps/customers/models.py::CustomerAddress` |

## 10. State transition

### 10.1 Account

```text
Supplier/Dealer register
  -> pending
  -> profile approved: active
  -> profile rejected: pending
  -> admin account-status: active | inactive | banned

Buyer storefront register
  -> active
  -> không có UI/API chuyên biệt trong scope để dealer khóa Buyer
```

Nguồn: `RegisterSerializer.create`, `StorefrontRegisterSerializer.create`, `SupplierViewSet.verify/account_status`, `DealerProfileViewSet.verify/account_status`.

### 10.2 Supplier profile

```text
create -> pending
pending/rejected/approved -> approved | rejected | pending
```

`VerifySupplierSerializer` chấp nhận cả `pending`, `approved`, `rejected`; UI Admin chỉ gửi approved/rejected. Approval yêu cầu đủ ba tài liệu approved tại `_validate_supplier_ready_for_approval`.

### 10.3 Dealer profile

```text
create -> pending
pending/rejected -> active | rejected
```

`VerifyDealerSerializer` chỉ cho `active` hoặc `rejected`; model còn `inactive` nhưng action verify không nhận inactive. Account lock không đổi `DealerProfile.status`.

### 10.4 AccountDocument

```text
upload/update_or_create -> pending
pending/approved/rejected -> approved | rejected
upload lại -> pending, reviewer/time reset null
```

Nguồn: `AccountDocumentBulkUploadSerializer.create`, `VerifyAccountDocumentSerializer`, `_apply_document_verification`.

## 11. Permission, multi-tenant và transaction

| Finding | Mức | Bằng chứng chính xác |
|---|---|---|
| Backend mặc định yêu cầu JWT | Tốt | `backend/config/settings.py::REST_FRAMEWORK.DEFAULT_PERMISSION_CLASSES` |
| Buyer tenant được đối chiếu theo quan hệ DB và URL slug | Tốt | `backend/apps/customers/permissions.py::IsStorefrontCustomer.has_permission` |
| Dealer customer list/update lọc đúng dealer | Tốt | `backend/apps/customers/views.py::DealerCustomerViewSet.get_queryset/perform_update` |
| Supplier/Dealer queryset tự scope theo account | Tốt | `SupplierViewSet.get_queryset`; `DealerProfileViewSet.get_queryset`; helpers trong `backend/common/querysets.py` |
| Protected route web không kiểm account/profile state | Trung bình | `AdminProtectedRoute`, `SupplierProtectedRoute`, `DealerProtectedRoute`, `BuyerRouteProtect` |
| `IsSupplier`/`IsDealer` không yêu cầu status active | Trung bình | `backend/common/permission.py::BaseRolePermission.has_permission` |
| Buyer UI web/mobile không chặn session tenant khác | Trung bình | `BuyerRouteProtect`; `AuthMiddleware.redirect`; `AuthController.matchesDealer` không được gọi |
| Supplier/Dealer approval gồm nhiều save + notification, không atomic | Cao về tính nhất quán | KHÔNG TÌM THẤY TRONG SOURCE CODE `transaction.atomic` trong `SupplierViewSet.verify`, `DealerProfileViewSet.verify`, `_apply_document_verification` |
| Bulk 3 tài liệu không atomic | Cao về tính nhất quán | `AccountDocumentBulkUploadSerializer.create` lặp `update_or_create`; KHÔNG TÌM THẤY TRONG SOURCE CODE transaction |
| Buyer register Account rồi CustomerProfile không atomic | Cao về tính nhất quán | `StorefrontRegisterSerializer.create`; KHÔNG TÌM THẤY TRONG SOURCE CODE transaction |
| Dealer onboarding FE profile rồi documents là hai request | Cao về tính nhất quán | `frontend/web-site/src/services/api/dealerService.js::completeRegistration` |
| Notification DB/receipt không bọc cùng transaction nghiệp vụ | Trung bình | `backend/common/notifications.py::notify_account/notify_admins` |

## 12. Hồ sơ hàm quan trọng

| Hàm | Input | Side effect/output | Quy tắc quan trọng |
|---|---|---|---|
| `RegisterSerializer.validate/create` | account fields + role | Tạo Account hash password | Cấm Buyer; global-role email unique; Supplier/Dealer pending |
| `CustomTokenObtainPairSerializer.validate` | username/password | JWT + nested profiles | login guard; chặn storefront Buyer ở login chung; chặn inactive/banned |
| `LogoutView.post` | refresh string | blacklist refresh | Access không bị thu hồi ngay |
| `StorefrontRegisterSerializer.create` | dealer từ context + buyer form | Account + CustomerProfile | username nội bộ; Buyer active |
| `StorefrontLoginSerializer.validate` | slug/email/password | Account đúng tenant | dealer phải active; login guard; status check |
| `StorefrontRefreshToken.for_user` | Account buyer | refresh/access claims | thêm auth_scope/dealer id/slug |
| `IsStorefrontCustomer.has_permission` | request + `dealer_slug` | allow/403 | so role, store_dealer và slug DB |
| `AccountDocumentBulkUploadSerializer.create` | ba file | 3 update_or_create | upload lại reset review state |
| `_validate_supplier_ready_for_approval` | Supplier prefetched docs | raise hoặc pass | đủ đúng ba type và tất cả approved |
| `SupplierViewSet.verify` | supplier id + status/reason | profile/account/notification | approved kích hoạt pending account; rejected đưa account pending |
| `_validate_dealer_ready_for_approval` | Dealer docs | raise hoặc pass | cùng quy tắc ba tài liệu |
| `DealerProfileViewSet.verify` | dealer id + status/reason | profile/account/notification | active kích hoạt pending account |
| `DealerProfile.save` | model | tự sinh slug | slug không đổi khi đổi tên |
| `notify_account/notify_admins` | account(s), title/content/reference | Notification, Receipt, WS, email | email tùy settings; không transaction với caller |
| `refreshAccessToken` web | refresh localStorage | token mới + reconnect WS | khóa concurrent refresh bằng queue |
| `ApiInterceptor.onError` mobile | Dio 401 | refresh, retry, queue | xóa local auth khi refresh thất bại |

## 13. Sai lệch, lỗi và TODO

| Ưu tiên | Sai lệch/phát hiện | Bằng chứng | Hệ quả |
|---|---|---|---|
| P0 | Web và mobile logout không gửi refresh | `authAdminService.js::logout`, `authBuyerService.js::logout`, `BuyerApiProvider.logout` so với `LogoutSerializer` | Backend trả 400, refresh không bị blacklist; UI vẫn xóa local |
| P0 | Các flow nhiều bản ghi không atomic | Các hàm nêu tại mục 11; KHÔNG TÌM THẤY TRONG SOURCE CODE `transaction.atomic` | Có thể lưu trạng thái dở dang khi lỗi giữa chừng |
| P1 | Supplier create service parse sai response | `suppilerService.js::supplierService.create` dùng `res.data.data`; `SupplierViewSet` trả object trực tiếp | FE nhận `undefined`; hiện vẫn đi tiếp vì không dùng result |
| P1 | Account create service parse sai response | `accountService.js::accountService.create` dùng `res.data.data`; `RegisterView.post` trả object trực tiếp | FE nhận `undefined`; token register bị bỏ, rồi login lại |
| P1 | Supplier onboarding login lại dù register đã trả JWT | `Supplier/Step1.jsx::handleSubmit`; `RegisterView.post` | Request thừa; phụ thuộc pending account vẫn login được |
| P1 | Lý do từ chối tài liệu không được lưu | `VerifyAccountDocumentSerializer` nhận reason nhưng `AccountDocument` không có field; `_apply_document_verification` chỉ dùng reason cho notification | Không audit/re-display được reason từ document API |
| P1 | Cập nhật profile/tài liệu không kéo profile approved về pending | `SupplierSerializer`, `DealerProfileSerializer`, `AccountDocumentBulkUploadSerializer.create` | Hồ sơ có thể vẫn approved sau thay đổi dữ liệu trọng yếu |
| P1 | Web/mobile route buyer không so session slug | `BuyerRouteProtect`; `AuthMiddleware.redirect`; `matchesDealer` không có caller | UI coi đã login tại tenant khác; API trả 403 |
| P1 | Password mới không gọi Django password validators | `RegisterSerializer.create`, `ChangePasswordView.post`; KHÔNG TÌM THẤY TRONG SOURCE CODE `validate_password` | Backend không thực thi các validator cấu hình khi đăng ký/đổi mật khẩu |
| P2 | UI Supplier Admin không có lock/unlock dù API/service có | `Admin/Suppiler.jsx`; `supplierService.status`; `SupplierViewSet.account_status` | Quản trị trạng thái Supplier chưa nối UI |
| P2 | Admin Supplier detail bỏ `documents` khi map modal | `Admin/Suppiler.jsx::handleViewSupplier` | Admin phải sang màn tài liệu riêng; modal không thể kiểm trực tiếp |
| P2 | Filter `document_type` FE không được backend áp dụng | `Admin/Document.jsx::buildQuery` gửi `document_type`; `AccountDocumentViewSet._apply_document_list_filters` chỉ search/status | Tab loại tài liệu có thể không lọc server |
| P2 | Nhãn `tax_certificate` Supplier sai nghĩa | `Supplier/Step3.jsx::DOC_TYPES` so với `AccountDocumentType.TAX_CERTIFICATE` | Người dùng có thể tải chứng nhận sản phẩm thay giấy thuế |
| P2 | `IsAdminOrSupplier` đặt tên/docstring không đúng hành vi | `backend/common/permission.py::IsAdminOrSupplier` | Dễ cấu hình permission nhầm vì class cho cả Dealer |
| P2 | Trạng thái business và Django `is_active` tách rời | `Account.status`; KHÔNG TÌM THẤY TRONG SOURCE CODE đồng bộ `is_active` | Code/framework khác kiểm `is_active` có thể khác kết quả business |
| P2 | `.env.example` chứa mật khẩu có vẻ thật thay placeholder | `backend/.env.example` | Rủi ro tái sử dụng credential/misconfiguration |
| P3 | Mobile API URL hard-code production | `ApiConstants.defaultBaseUrl` | Khó chuyển môi trường build/test |
| P3 | CORS mặc định allow all + credentials | `backend/config/settings.py::CORS_ALLOW_ALL_ORIGINS/CORS_ALLOW_CREDENTIALS` | Cấu hình production rộng; JWT local storage vẫn là bề mặt XSS |
| P3 | Forgot password, email verification, OTP/MFA | KHÔNG TÌM THẤY TRONG SOURCE CODE | Thiếu chức năng khôi phục và xác minh danh tính |

## 14. Kết luận kiểm toán

Source đã hình thành kiến trúc ba client/lớp rõ: Django REST làm nguồn dữ liệu và permission; React phục vụ Admin/Supplier/Dealer/Buyer; Flutter phục vụ Buyer storefront. Tenant isolation quan trọng nhất nằm đúng ở backend qua quan hệ `Account.store_dealer`, constraint DB và `IsStorefrontCustomer`, nên request xuyên dealer bị chặn dù route guard client còn thiếu.

Luồng Supplier/Dealer có đủ account, profile, ba tài liệu, duyệt tài liệu, duyệt profile, kích hoạt/khóa account và notification. Các vấn đề cần xử lý trước là logout không blacklist được refresh, thiếu transaction cho onboarding/approval/bulk upload, response parsing sai ở hai service create, và không reset duyệt khi hồ sơ/tài liệu đã approved bị thay đổi.
