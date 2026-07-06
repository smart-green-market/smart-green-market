class AppRoutes {
  AppRoutes._();

  static const entry = '/entry';

  static String storeHome(String slug) => '/store/$slug/home';
  static String login(String slug) => '/store/$slug/login';
  static String register(String slug) => '/store/$slug/register';
  static String main(String slug) => '/store/$slug/main';
  static String products(String slug) => '/store/$slug/products';
  static String productDetail(String slug, int id) => '/store/$slug/product/$id';
  static String search(String slug) => '/store/$slug/search';
  static String cart(String slug) => '/store/$slug/cart';
  static String checkout(String slug) => '/store/$slug/checkout';
  static String orderTracking(String slug) => '/store/$slug/orders/tracking';
  static String orderHistory(String slug) => '/store/$slug/orders/history';
  static String profile(String slug) => '/store/$slug/profile';
  static String reviews(String slug) => '/store/$slug/reviews';
  static String vouchers(String slug) => '/store/$slug/vouchers';
  static String notifications(String slug) => '/store/$slug/notifications';
  static String about(String slug) => '/store/$slug/about';
}
