import 'package:get/get.dart';
import 'package:smart_green_market/app/middleware/auth_middleware.dart';
import 'package:smart_green_market/app/routes/app_routes.dart';
import 'package:smart_green_market/modules/about/views/about_view.dart';
import 'package:smart_green_market/modules/auth/bindings/auth_binding.dart';
import 'package:smart_green_market/modules/auth/views/login_view.dart';
import 'package:smart_green_market/modules/auth/views/register_view.dart';
import 'package:smart_green_market/modules/cart/views/cart_view.dart';
import 'package:smart_green_market/modules/checkout/views/checkout_view.dart';
import 'package:smart_green_market/modules/entry/views/entry_view.dart';
import 'package:smart_green_market/modules/main/bindings/main_binding.dart';
import 'package:smart_green_market/modules/main/views/main_view.dart';
import 'package:smart_green_market/modules/notification/views/notification_view.dart';
import 'package:smart_green_market/modules/order/views/order_tracking_view.dart';
import 'package:smart_green_market/modules/product/bindings/product_detail_binding.dart';
import 'package:smart_green_market/modules/product/views/product_detail_view.dart';
import 'package:smart_green_market/modules/product/views/product_list_view.dart';
import 'package:smart_green_market/modules/product/views/search_view.dart';
import 'package:smart_green_market/modules/profile/views/profile_view.dart';
import 'package:smart_green_market/modules/review/views/review_view.dart';
import 'package:smart_green_market/modules/splash/bindings/splash_binding.dart';
import 'package:smart_green_market/modules/splash/views/splash_view.dart';
import 'package:smart_green_market/modules/voucher/views/voucher_view.dart';

class AppPages {
  AppPages._();

  static const initial = AppRoutes.entry;

  static final routes = <GetPage>[
    GetPage(name: AppRoutes.entry, page: () => const EntryView()),
    GetPage(
      name: '/splash',
      page: () => const SplashView(),
      binding: SplashBinding(),
    ),
    GetPage(name: '/store/:slug/main', page: () => const MainView(), binding: MainBinding()),
    GetPage(name: '/store/:slug/login', page: () => LoginView(), binding: AuthBinding()),
    GetPage(name: '/store/:slug/register', page: () => RegisterView(), binding: AuthBinding()),
    GetPage(name: '/store/:slug/products', page: () => const ProductListView()),
    GetPage(
      name: '/store/:slug/product/:id',
      page: () => const ProductDetailView(),
      binding: ProductDetailBinding(),
    ),
    GetPage(name: '/store/:slug/search', page: () => const SearchView()),
    GetPage(name: '/store/:slug/about', page: () => const AboutView()),
    GetPage(
      name: '/store/:slug/cart',
      page: () => const CartView(),
      middlewares: [AuthMiddleware()],
    ),
    GetPage(
      name: '/store/:slug/checkout',
      page: () => const CheckoutView(),
      middlewares: [AuthMiddleware()],
    ),
    GetPage(
      name: '/store/:slug/orders/tracking',
      page: () => const OrderTrackingView(),
      middlewares: [AuthMiddleware()],
    ),
    GetPage(
      name: '/store/:slug/orders/history',
      page: () => const OrderHistoryView(),
      middlewares: [AuthMiddleware()],
    ),
    GetPage(
      name: '/store/:slug/profile',
      page: () => const ProfileView(),
      middlewares: [AuthMiddleware()],
    ),
    GetPage(
      name: '/store/:slug/reviews',
      page: () => const ReviewView(),
      middlewares: [AuthMiddleware()],
    ),
    GetPage(
      name: '/store/:slug/vouchers',
      page: () => const VoucherView(),
      middlewares: [AuthMiddleware()],
    ),
    GetPage(
      name: '/store/:slug/notifications',
      page: () => const NotificationView(),
      middlewares: [AuthMiddleware()],
    ),
  ];
}
