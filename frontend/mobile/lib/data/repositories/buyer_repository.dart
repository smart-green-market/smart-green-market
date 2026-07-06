import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/data/providers/buyer_api_provider.dart';

class BuyerRepository {
  BuyerRepository(this._api);

  final BuyerApiProvider _api;

  Future<DealerModel> validateDealer(String slug) => _api.getDealer(slug);
  Future<AuthSession> login(String slug, String email, String password) =>
      _api.login(slug, {'email': email, 'password': password});

  Future<AuthSession> register(
    String slug, {
    required String email,
    required String password,
    required String repassword,
    required String fullName,
    required String phone,
  }) =>
      _api.register(slug, {
        'email': email,
        'password': password,
        'repassword': repassword,
        'full_name': fullName,
        'phone': phone,
      });

  Future<void> logout() => _api.logout();
  Future<List<CategoryModel>> getCategories(String slug) => _api.getCategories(slug);
  Future<List<ProductModel>> getAllProducts(String slug, {Map<String, dynamic>? query}) =>
      _api.getAllProducts(slug, query: query);
  Future<PaginatedResponse<ProductModel>> getProducts(String slug, {Map<String, dynamic>? query}) =>
      _api.getProducts(slug, query: query);
  Future<ProductModel> getProduct(String slug, int id) => _api.getProductById(slug, id);
  Future<List<ProductModel>> getProductsByIds(String slug, List<int> ids) async {
    if (ids.isEmpty) return [];
    final products = await Future.wait(
      ids.map((id) async {
        try {
          return await _api.getProductById(slug, id);
        } catch (_) {
          return null;
        }
      }),
    );
    return products.whereType<ProductModel>().toList();
  }
  Future<List<ProductModel>> getBestSellers(String slug) => _api.getBestSellers(slug);
  Future<List<ProductModel>> getRelated(String slug, int id) => _api.getRelated(slug, id);
  Future<Map<String, dynamic>> getProductReviewSummary(String slug, int id) =>
      _api.getProductReviewSummary(slug, id);
  Future<List<OrderModel>> getOrders(String slug) => _api.getOrders(slug);
  Future<OrderModel> getOrder(String slug, int id) => _api.getOrderById(slug, id);
  Future<OrderModel> createOrder(String slug, Map<String, dynamic> body) =>
      _api.createOrder(slug, body);
  Future<void> cancelOrder(String slug, int id, String reason) =>
      _api.cancelOrder(slug, id, reason);
  Future<void> confirmReceived(String slug, int id) => _api.confirmReceived(slug, id);
  Future<void> requestReturn(String slug, int id, String reason) =>
      _api.requestReturn(slug, id, reason);
  Future<List<DeliveryDateModel>> getDeliverySlots(String slug) => _api.getDeliverySlots(slug);
  Future<List<AddressModel>> getAddresses(String slug) => _api.getAddresses(slug);
  Future<AddressModel> createAddress(String slug, Map<String, dynamic> body) =>
      _api.createAddress(slug, body);
  Future<AddressModel> updateAddress(String slug, int id, Map<String, dynamic> body) =>
      _api.updateAddress(slug, id, body);
  Future<void> deleteAddress(String slug, int id) => _api.deleteAddress(slug, id);
  Future<Map<String, dynamic>> getProfile(String slug) => _api.getProfile(slug);
  Future<Map<String, dynamic>> updateProfile(String slug, Map<String, dynamic> body) =>
      _api.updateProfile(slug, body);
  Future<List<VoucherModel>> getSavedVouchers(String slug) => _api.getSavedVouchers(slug);
  Future<List<VoucherModel>> getAvailableVouchers(String slug) => _api.getAvailableVouchers(slug);
  Future<void> saveVoucher(int id) => _api.saveVoucher(id);
  Future<void> unsaveVoucher(int id) => _api.unsaveVoucher(id);
  Future<VoucherApplyResult> applyVoucher(Map<String, dynamic> body) => _api.applyVoucher(body);
  Future<List<PendingReviewModel>> getPendingReviews(String slug) => _api.getPendingReviews(slug);
  Future<PaginatedResponse<ReviewModel>> getMyReviews(String slug, {int page = 1}) =>
      _api.getMyReviews(slug, page: page);
  Future<ReviewModel> createReview(
    String slug, {
    required int orderId,
    required int dealerProductId,
    required int rating,
    String? comment,
    List<String> imagePaths = const [],
  }) =>
      _api.createReview(
        slug,
        orderId: orderId,
        dealerProductId: dealerProductId,
        rating: rating,
        comment: comment,
        imagePaths: imagePaths,
      );

  Future<List<ReviewImageModel>> uploadReviewImages(
    String slug,
    int reviewId,
    List<String> imagePaths,
  ) =>
      _api.uploadReviewImages(slug, reviewId, imagePaths);

  Future<void> deleteReviewImage(String slug, int reviewId, int imageId) =>
      _api.deleteReviewImage(slug, reviewId, imageId);

  Future<void> updateReview(String slug, int id, Map<String, dynamic> body) =>
      _api.updateReview(slug, id, body);
  Future<void> deleteReview(String slug, int id) => _api.deleteReview(slug, id);
  Future<NotificationBellFeed> getBellFeed() => _api.getBellFeed();
  Future<List<NotificationModel>> getNotifications({int page = 1}) =>
      _api.getNotifications(page: page);
  Future<void> markNotificationRead(int id) => _api.markNotificationRead(id);
  Future<void> recordView(String slug, int productId) =>
      _api.recordInteraction(slug, productId, 'view');
  Future<void> recordAddToCart(String slug, int productId) =>
      _api.recordInteraction(slug, productId, 'add_cart');
  String readError(Object error) => _api.readError(error);
}
