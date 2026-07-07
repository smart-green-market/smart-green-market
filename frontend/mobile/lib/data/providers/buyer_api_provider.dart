import 'package:dio/dio.dart';
import 'package:smart_green_market/core/network/api_client.dart';
import 'package:smart_green_market/core/constants/api_constants.dart';
import 'package:smart_green_market/core/utils/buyer_utils.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';

class BuyerApiProvider {
  BuyerApiProvider(this._client);

  final ApiClient _client;
  Dio get _dio => _client.dio;

  Future<DealerModel> getDealer(String slug) async {
    final res = await _dio.get<Map<String, dynamic>>('/storefronts/$slug/');
    return DealerModel.fromJson(res.data ?? {});
  }

  Future<AuthSession> login(String slug, Map<String, dynamic> body) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/storefronts/$slug/login/',
      data: body,
    );
    return AuthSession.fromResponse(res.data ?? {}, slug);
  }

  Future<AuthSession> register(String slug, Map<String, dynamic> body) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/storefronts/$slug/register/',
      data: body,
    );
    return AuthSession.fromResponse(res.data ?? {}, slug);
  }

  Future<void> logout() async {
    await _dio.post<void>('/logout/');
  }

  Future<List<CategoryModel>> getCategories(String slug) async {
    final res = await _dio.get<Map<String, dynamic>>('/storefronts/$slug/categories/');
    final results = res.data?['results'];
    if (results is! List) return [];
    return results
        .whereType<Map>()
        .map((e) => CategoryModel.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  Future<PaginatedResponse<ProductModel>> getProducts(
    String slug, {
    Map<String, dynamic>? query,
  }) async {
    final res = await _dio.get<Map<String, dynamic>>(
      '/storefronts/$slug/products/',
      queryParameters: query,
    );
    return PaginatedResponse.fromJson(
      res.data ?? {},
      ProductModel.fromJson,
    );
  }

  Future<List<ProductModel>> getAllProducts(String slug, {Map<String, dynamic>? query}) async {
    final merged = <ProductModel>[];
    var page = 1;
    var hasMore = true;

    while (hasMore) {
      final data = await getProducts(
        slug,
        query: {...?query, 'page': page, 'page_size': 100},
      );
      merged.addAll(data.results);
      hasMore = data.hasMore;
      page += 1;
      if (page > 100) break;
    }
    return merged;
  }

  Future<ProductModel> getProductById(String slug, int id) async {
    final res = await _dio.get<Map<String, dynamic>>('/storefronts/$slug/products/$id/');
    return ProductModel.fromJson(res.data ?? {});
  }

  Future<List<ProductModel>> getBestSellers(String slug) async {
    final res = await _dio.get<dynamic>('/storefronts/$slug/products/bestsellers/');
    return ProductModel.listFromDynamic(res.data);
  }

  Future<List<ProductModel>> getRelated(String slug, int id, {int limit = 10}) async {
    final res = await _dio.get<dynamic>(
      '/storefronts/$slug/products/$id/related/',
      queryParameters: {'limit': limit},
    );
    return ProductModel.listFromDynamic(res.data);
  }

  Future<Map<String, dynamic>> getProductReviewSummary(String slug, int id) async {
    final res = await _dio.get<Map<String, dynamic>>(
      '/storefronts/$slug/products/$id/reviews/summary/',
    );
    return res.data ?? {};
  }

  Future<List<OrderModel>> getOrders(String slug) async {
    final res = await _dio.get<Map<String, dynamic>>('/storefronts/$slug/orders/');
    final results = res.data?['results'];
    if (results is! List) return [];
    return results
        .whereType<Map>()
        .map((e) => OrderModel.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  Future<OrderModel> getOrderById(String slug, int id) async {
    final res = await _dio.get<Map<String, dynamic>>('/storefronts/$slug/orders/$id/');
    return OrderModel.fromJson(res.data ?? {});
  }

  Future<OrderModel> createOrder(String slug, Map<String, dynamic> body) async {
    final res = await _dio.post<Map<String, dynamic>>('/storefronts/$slug/orders/', data: body);
    return OrderModel.fromJson(res.data ?? {});
  }

  Future<void> cancelOrder(String slug, int id, String reason) async {
    await _dio.post<void>('/storefronts/$slug/orders/$id/cancel/', data: {'reason': reason});
  }

  Future<void> confirmReceived(String slug, int id) async {
    await _dio.post<void>('/storefronts/$slug/orders/$id/confirm-received/');
  }

  Future<void> requestReturn(String slug, int id, String reason) async {
    await _dio.post<void>(
      '/storefronts/$slug/orders/$id/request-return/',
      data: {'reason': reason},
    );
  }

  Future<List<StockCheckResult>> checkStock(
    String slug,
    List<Map<String, dynamic>> items,
  ) async {
    final res = await _dio.post<dynamic>(
      '/storefronts/$slug/check-stock/',
      data: {'items': items},
    );
    final data = res.data;
    if (data is! List) return [];
    return data
        .whereType<Map>()
        .map((e) => StockCheckResult.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  Future<List<PreOrderModel>> getPreOrders(String slug) async {
    final res = await _dio.get<Map<String, dynamic>>('/storefronts/$slug/preorder-requests/');
    final results = res.data?['results'];
    if (results is! List) return [];
    return results
        .whereType<Map>()
        .map((e) => PreOrderModel.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  Future<PreOrderModel> getPreOrderById(String slug, int id) async {
    final res = await _dio.get<Map<String, dynamic>>('/storefronts/$slug/preorder-requests/$id/');
    return PreOrderModel.fromJson(res.data ?? {});
  }

  Future<PreOrderModel> createPreOrder(String slug, Map<String, dynamic> body) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/storefronts/$slug/preorder-requests/',
      data: body,
    );
    return PreOrderModel.fromJson(res.data ?? {});
  }

  Future<OrderModel> acceptPreOrder(String slug, int id) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/storefronts/$slug/preorder-requests/$id/accept/',
    );
    return OrderModel.fromJson(res.data ?? {});
  }

  Future<PreOrderModel> rejectPreOrder(String slug, int id, String reason) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/storefronts/$slug/preorder-requests/$id/reject/',
      data: {'reason': reason},
    );
    return PreOrderModel.fromJson(res.data ?? {});
  }

  Future<OrderModel> acceptDeliveryReschedule(String slug, int id) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/storefronts/$slug/orders/$id/accept-delivery-reschedule/',
    );
    return OrderModel.fromJson(res.data ?? {});
  }

  Future<OrderModel> rejectDeliveryReschedule(String slug, int id, String reason) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/storefronts/$slug/orders/$id/reject-delivery-reschedule/',
      data: {'reason': reason},
    );
    return OrderModel.fromJson(res.data ?? {});
  }

  Future<List<DeliveryDateModel>> getDeliverySlots(String slug) async {
    final res = await _dio.get<Map<String, dynamic>>('/storefronts/$slug/delivery-slots/');
    final dates = res.data?['dates'];
    if (dates is! List) return [];

    return dates.whereType<Map>().map((entry) {
      final map = Map<String, dynamic>.from(entry);
      final slotsRaw = map['slots'];
      final slots = slotsRaw is List
          ? slotsRaw
              .whereType<Map>()
              .map((s) => DeliverySlotModel.fromJson(Map<String, dynamic>.from(s)))
              .toList()
          : <DeliverySlotModel>[];
      return DeliveryDateModel(
        date: '${map['date'] ?? ''}',
        label: '${map['label'] ?? ''}',
        slots: slots,
      );
    }).toList();
  }

  Future<List<AddressModel>> getAddresses(String slug) async {
    final res = await _dio.get<dynamic>('/storefronts/$slug/addresses/');
    final list = res.data is List ? res.data as List : (res.data?['results'] as List?);
    if (list == null) return [];
    return list
        .whereType<Map>()
        .map((e) => AddressModel.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  Future<AddressModel> createAddress(String slug, Map<String, dynamic> body) async {
    final res = await _dio.post<Map<String, dynamic>>('/storefronts/$slug/addresses/', data: body);
    return AddressModel.fromJson(res.data ?? {});
  }

  Future<AddressModel> updateAddress(String slug, int id, Map<String, dynamic> body) async {
    final res = await _dio.put<Map<String, dynamic>>('/storefronts/$slug/addresses/$id/', data: body);
    return AddressModel.fromJson(res.data ?? {});
  }

  Future<void> deleteAddress(String slug, int id) async {
    await _dio.delete<void>('/storefronts/$slug/addresses/$id/');
  }

  Future<Map<String, dynamic>> getProfile(String slug) async {
    final res = await _dio.get<Map<String, dynamic>>('/storefronts/$slug/me/');
    return res.data ?? {};
  }

  Future<Map<String, dynamic>> updateProfile(String slug, Map<String, dynamic> body) async {
    final res = await _dio.put<Map<String, dynamic>>('/storefronts/$slug/me/', data: body);
    return res.data ?? {};
  }

  Future<List<VoucherModel>> getSavedVouchers(String slug) async {
    final res = await _dio.get<dynamic>(
      '/vouchers/saved/',
      queryParameters: slug.isNotEmpty ? {'dealer_slug': slug} : null,
    );
    return _parseVoucherList(res.data);
  }

  Future<List<VoucherModel>> getAvailableVouchers(String slug) async {
    final res = await _dio.get<dynamic>(
      '/vouchers/available/',
      queryParameters: slug.isNotEmpty ? {'dealer_slug': slug} : null,
    );
    return _parseVoucherList(res.data);
  }

  List<VoucherModel> _parseVoucherList(dynamic data) {
    List<dynamic>? raw;
    if (data is List) {
      raw = data;
    } else if (data is Map) {
      final results = data['results'];
      if (results is List) raw = results;
    }
    if (raw == null) return [];
    return raw
        .whereType<Map>()
        .map((e) => VoucherModel.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  Future<void> saveVoucher(int id) async {
    await _dio.post<void>('/vouchers/$id/save/');
  }

  Future<void> unsaveVoucher(int id) async {
    await _dio.delete<void>('/vouchers/$id/unsave/');
  }

  Future<VoucherApplyResult> applyVoucher(Map<String, dynamic> body) async {
    final res = await _dio.post<Map<String, dynamic>>('/vouchers/apply/', data: body);
    final payload = res.data;
    if (payload == null) {
      return VoucherApplyResult.fromJson(const {});
    }
    // Backend returns { voucher, order_total, discount_amount, final_total } directly.
    return VoucherApplyResult.fromJson(Map<String, dynamic>.from(payload));
  }

  Future<List<PendingReviewModel>> getPendingReviews(String slug) async {
    final res = await _dio.get<dynamic>('/storefronts/$slug/me/pending-reviews/');
    final list = res.data is List ? res.data as List : [];
    return list
        .whereType<Map>()
        .map((e) => PendingReviewModel.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  Future<PaginatedResponse<ReviewModel>> getMyReviews(String slug, {int page = 1}) async {
    final res = await _dio.get<Map<String, dynamic>>(
      '/storefronts/$slug/reviews/',
      queryParameters: {'page': page, 'page_size': 20},
    );
    return PaginatedResponse.fromJson(res.data ?? {}, ReviewModel.fromJson);
  }

  Future<ReviewModel> createReview(
    String slug, {
    required int orderId,
    required int dealerProductId,
    required int rating,
    String? comment,
    List<String> imagePaths = const [],
  }) async {
    final formData = FormData();
    formData.fields.addAll([
      MapEntry('order_id', '$orderId'),
      MapEntry('dealer_product_id', '$dealerProductId'),
      MapEntry('rating', '$rating'),
    ]);
    if (comment != null && comment.trim().isNotEmpty) {
      formData.fields.add(MapEntry('comment', comment.trim()));
    }
    for (final path in imagePaths) {
      final filename = path.split(RegExp(r'[/\\]')).last;
      formData.files.add(
        MapEntry(
          'images',
          await MultipartFile.fromFile(path, filename: filename),
        ),
      );
    }

    final res = await _dio.post<Map<String, dynamic>>(
      '/storefronts/$slug/reviews/',
      data: formData,
    );
    return ReviewModel.fromJson(Map<String, dynamic>.from(res.data ?? {}));
  }

  Future<List<ReviewImageModel>> uploadReviewImages(
    String slug,
    int reviewId,
    List<String> imagePaths,
  ) async {
    final formData = FormData();
    for (final path in imagePaths) {
      final filename = path.split(RegExp(r'[/\\]')).last;
      formData.files.add(
        MapEntry(
          'images',
          await MultipartFile.fromFile(path, filename: filename),
        ),
      );
    }

    final res = await _dio.post<dynamic>(
      '/storefronts/$slug/reviews/$reviewId/images/',
      data: formData,
    );
    final list = res.data is List ? res.data as List : [];
    return list
        .whereType<Map>()
        .map((e) => ReviewImageModel.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  Future<void> deleteReviewImage(String slug, int reviewId, int imageId) async {
    await _dio.delete<void>('/storefronts/$slug/reviews/$reviewId/images/$imageId/');
  }

  Future<void> updateReview(String slug, int id, Map<String, dynamic> body) async {
    await _dio.patch<void>('/storefronts/$slug/reviews/$id/', data: body);
  }

  Future<void> deleteReview(String slug, int id) async {
    await _dio.delete<void>('/storefronts/$slug/reviews/$id/');
  }

  Future<NotificationBellFeed> getBellFeed() async {
    final res = await _dio.get<Map<String, dynamic>>(
      '/notifications/my/',
      queryParameters: {
        'page': 1,
        'page_size': ApiConstants.notificationPollPageSize,
      },
    );
    final data = res.data ?? {};
    final results = data['results'];
    final items = results is List
        ? results
            .whereType<Map>()
            .map((e) => NotificationModel.fromJson(Map<String, dynamic>.from(e)))
            .toList()
        : <NotificationModel>[];

    return NotificationBellFeed(
      unreadCount: int.tryParse('${data['unread_count']}') ??
          items.where((n) => !n.isRead).length,
      items: items,
    );
  }

  Future<List<NotificationModel>> getNotifications({int page = 1}) async {
    final res = await _dio.get<Map<String, dynamic>>(
      '/notifications/my/',
      queryParameters: {'page': page, 'page_size': 20},
    );
    final results = res.data?['results'];
    if (results is! List) return [];
    return results
        .whereType<Map>()
        .map((e) => NotificationModel.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  Future<void> markNotificationRead(int id) async {
    await _dio.post<void>('/notifications/$id/mark_read/');
  }

  Future<void> recordInteraction(String slug, int productId, String action) async {
    await _dio.post<void>(
      '/storefronts/$slug/interactions/',
      data: {'dealer_product_id': productId, 'action': action},
    );
  }

  String readError(Object error) => ApiErrorUtils.extractMessage(error);
}
