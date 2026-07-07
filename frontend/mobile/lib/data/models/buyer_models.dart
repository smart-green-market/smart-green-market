class PaginatedResponse<T> {
  PaginatedResponse({
    required this.results,
    this.count = 0,
    this.page = 1,
    this.pageSize = 20,
    this.hasMore = false,
  });

  final List<T> results;
  final int count;
  final int page;
  final int pageSize;
  final bool hasMore;

  factory PaginatedResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromMap,
  ) {
    final raw = json['results'];
    final results = raw is List
        ? raw
            .whereType<Map>()
            .map((e) => fromMap(Map<String, dynamic>.from(e)))
            .toList()
        : <T>[];

    return PaginatedResponse<T>(
      results: results,
      count: int.tryParse('${json['count']}') ?? results.length,
      page: int.tryParse('${json['page']}') ?? 1,
      pageSize: int.tryParse('${json['page_size']}') ?? results.length,
      hasMore: json['has_more'] == true || json['next'] != null,
    );
  }
}

class BuyerUser {
  BuyerUser({
    required this.id,
    required this.email,
    this.fullName = '',
    this.phone = '',
    this.avatarUrl = '',
    this.role = 'buyer',
    this.authScope = 'storefront',
    this.storeDealerSlug = '',
    this.storeDealerId,
  });

  final dynamic id;
  final String email;
  final String fullName;
  final String phone;
  final String avatarUrl;
  final String role;
  final String authScope;
  final String storeDealerSlug;
  final dynamic storeDealerId;

  bool get isBuyer => role == 'buyer' || authScope == 'storefront';

  factory BuyerUser.fromJson(Map<String, dynamic> json, {String? dealerSlug}) {
    return BuyerUser(
      id: json['id'],
      email: '${json['email'] ?? ''}',
      fullName: '${json['full_name'] ?? ''}',
      phone: '${json['phone'] ?? ''}',
      avatarUrl: '${json['avatar_url'] ?? ''}',
      role: '${json['role'] ?? 'buyer'}',
      authScope: '${json['auth_scope'] ?? 'storefront'}',
      storeDealerSlug: dealerSlug ?? '${json['store_dealer_slug'] ?? ''}',
      storeDealerId: json['store_dealer_id'],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'full_name': fullName,
        'phone': phone,
        'avatar_url': avatarUrl,
        'role': role,
        'auth_scope': authScope,
        'store_dealer_slug': storeDealerSlug,
        'store_dealer_id': storeDealerId,
      };

  static BuyerUser? fromStored(dynamic raw) {
    if (raw is! Map) return null;
    return BuyerUser.fromJson(Map<String, dynamic>.from(raw));
  }
}

class AuthSession {
  AuthSession({
    required this.access,
    required this.refresh,
    required this.user,
  });

  final String access;
  final String refresh;
  final BuyerUser user;

  factory AuthSession.fromResponse(
    Map<String, dynamic> json,
    String dealerSlug,
  ) {
    final account = json['account'] ?? json['buyer'] ?? <String, dynamic>{};
    final userMap = Map<String, dynamic>.from(account as Map);
    userMap['auth_scope'] = json['auth_scope'] ?? 'storefront';
    userMap['store_dealer_slug'] = dealerSlug;
    userMap['store_dealer_id'] = json['store_dealer_id'] ?? userMap['store_dealer_id'];

    return AuthSession(
      access: '${json['access']}',
      refresh: '${json['refresh']}',
      user: BuyerUser.fromJson(userMap, dealerSlug: dealerSlug),
    );
  }
}

class CategoryModel {
  CategoryModel({
    required this.id,
    required this.name,
    this.description = '',
    this.productCount = 0,
  });

  final int id;
  final String name;
  final String description;
  final int productCount;

  factory CategoryModel.fromJson(Map<String, dynamic> json) => CategoryModel(
        id: int.tryParse('${json['id']}') ?? 0,
        name: '${json['name'] ?? ''}',
        description: '${json['description'] ?? ''}',
        productCount: int.tryParse('${json['product_count']}') ?? 0,
      );
}

class ProductModel {
  ProductModel({
    required this.id,
    required this.title,
    this.description = '',
    this.retailPrice = 0,
    this.effectivePrice = 0,
    this.discountPercent = 0,
    this.thumbnail = '',
    this.unit = 'kg',
    this.availableQuantity = 0,
    this.inStock = true,
    this.categoryName = '',
    this.categoryId,
    this.totalSold = 0,
    this.images = const [],
  });

  final int id;
  final String title;
  final String description;
  final double retailPrice;
  final double effectivePrice;
  final double discountPercent;
  final String thumbnail;
  final String unit;
  final int availableQuantity;
  final bool inStock;
  final String categoryName;
  final int? categoryId;
  final int totalSold;
  final List<String> images;

  double get displayPrice =>
      effectivePrice > 0 ? effectivePrice : retailPrice;

  bool get hasDiscount => displayPrice < retailPrice && retailPrice > 0;

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    final category = json['category'];
    final imageList = json['images'];
    final urls = <String>[];
    if (imageList is List) {
      for (final item in imageList) {
        if (item is Map && item['image_url'] != null) {
          urls.add('${item['image_url']}');
        }
      }
    }

    final thumb = '${json['thumbnail'] ?? ''}';
    return ProductModel(
      id: int.tryParse('${json['id']}') ?? 0,
      title: '${json['title'] ?? ''}',
      description: '${json['description'] ?? ''}',
      retailPrice: double.tryParse('${json['retail_price']}') ?? 0,
      effectivePrice: double.tryParse('${json['effective_price']}') ?? 0,
      discountPercent: double.tryParse('${json['discount_percent']}') ?? 0,
      thumbnail: thumb.isNotEmpty ? thumb : (urls.isNotEmpty ? urls.first : ''),
      unit: '${json['unit'] ?? 'kg'}'.replaceFirst('/', ''),
      availableQuantity: int.tryParse('${json['available_quantity']}') ?? 0,
      inStock: json['in_stock'] != false,
      categoryName: category is Map ? '${category['name'] ?? ''}' : '',
      categoryId: category is Map ? int.tryParse('${category['id']}') : null,
      totalSold: int.tryParse('${json['total_sold']}') ?? 0,
      images: urls,
    );
  }

  static List<ProductModel> listFromDynamic(dynamic data) {
    if (data is List) {
      return data
          .whereType<Map>()
          .map((e) => ProductModel.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    }
    if (data is Map && data['results'] is List) {
      return listFromDynamic(data['results']);
    }
    return [];
  }
}

class CartItemModel {
  CartItemModel({
    required this.id,
    required this.name,
    required this.price,
    required this.unit,
    required this.quantity,
    this.selected = true,
    this.image = '',
    this.availableQuantity,
  });

  final int id;
  final String name;
  final double price;
  final String unit;
  int quantity;
  bool selected;
  final String image;
  int? availableQuantity;

  double get subtotal => price * quantity;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'price': price,
        'unit': unit,
        'quantity': quantity,
        'selected': selected,
        'image': image,
        'availableQuantity': availableQuantity,
      };

  factory CartItemModel.fromJson(Map<String, dynamic> json) => CartItemModel(
        id: int.tryParse('${json['id']}') ?? 0,
        name: '${json['name'] ?? ''}',
        price: double.tryParse('${json['price']}') ?? 0,
        unit: '${json['unit'] ?? 'kg'}',
        quantity: int.tryParse('${json['quantity']}') ?? 1,
        selected: json['selected'] != false,
        image: '${json['image'] ?? ''}',
        availableQuantity: int.tryParse('${json['availableQuantity']}'),
      );

  factory CartItemModel.fromProduct(ProductModel product, {int quantity = 1}) {
    return CartItemModel(
      id: product.id,
      name: product.title,
      price: product.displayPrice,
      unit: product.unit,
      quantity: quantity,
      selected: true,
      image: product.thumbnail,
      availableQuantity: product.availableQuantity > 0 ? product.availableQuantity : null,
    );
  }
}

class AddressModel {
  AddressModel({
    required this.id,
    required this.receiverName,
    required this.receiverPhone,
    required this.address,
    this.isDefault = false,
  });

  final int id;
  final String receiverName;
  final String receiverPhone;
  final String address;
  final bool isDefault;

  factory AddressModel.fromJson(Map<String, dynamic> json) => AddressModel(
        id: int.tryParse('${json['id']}') ?? 0,
        receiverName: '${json['receiver_name'] ?? ''}',
        receiverPhone: '${json['receiver_phone'] ?? ''}',
        address: '${json['address'] ?? ''}',
        isDefault: json['is_default'] == true,
      );
}

class OrderItemModel {
  OrderItemModel({
    required this.id,
    required this.productName,
    required this.quantity,
    required this.unitPrice,
    this.productThumbnail = '',
    this.unit = '',
  });

  final int id;
  final String productName;
  final int quantity;
  final double unitPrice;
  final String productThumbnail;
  final String unit;

  double get subtotal => unitPrice * quantity;

  factory OrderItemModel.fromJson(Map<String, dynamic> json) => OrderItemModel(
        id: int.tryParse('${json['id']}') ?? 0,
        productName: '${json['product_name'] ?? ''}',
        quantity: int.tryParse('${json['quantity']}') ?? 0,
        unitPrice: double.tryParse('${json['unit_price']}') ?? 0,
        productThumbnail: '${json['product_thumbnail_url'] ?? ''}',
        unit: '${json['product_unit'] ?? ''}',
      );
}

class OrderModel {
  OrderModel({
    required this.id,
    required this.orderCode,
    required this.status,
    this.subtotalAmount = 0,
    this.discountAmount = 0,
    this.shippingFee = 0,
    this.totalAmount = 0,
    this.itemCount = 0,
    this.deliveryDate = '',
    this.deliverySlotName = '',
    this.proposedDeliveryDate = '',
    this.proposedDeliverySlotName = '',
    this.rescheduleReason = '',
    this.createdAt,
    this.note = '',
    this.receiverName = '',
    this.receiverPhone = '',
    this.deliveryAddress = '',
    this.items = const [],
    this.statusHistories = const [],
  });

  final int id;
  final String orderCode;
  final String status;
  final double subtotalAmount;
  final double discountAmount;
  final double shippingFee;
  final double totalAmount;
  final int itemCount;
  final String deliveryDate;
  final String deliverySlotName;
  final String proposedDeliveryDate;
  final String proposedDeliverySlotName;
  final String rescheduleReason;
  final DateTime? createdAt;
  final String note;
  final String receiverName;
  final String receiverPhone;
  final String deliveryAddress;
  final List<OrderItemModel> items;
  final List<Map<String, dynamic>> statusHistories;

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    final itemsRaw = json['items'];
    final historiesRaw = json['status_histories'];

    return OrderModel(
      id: int.tryParse('${json['id']}') ?? 0,
      orderCode: '${json['order_code'] ?? ''}',
      status: '${json['status'] ?? ''}',
      subtotalAmount: double.tryParse('${json['subtotal_amount']}') ?? 0,
      discountAmount: double.tryParse('${json['discount_amount']}') ?? 0,
      shippingFee: double.tryParse('${json['shipping_fee']}') ?? 0,
      totalAmount: double.tryParse('${json['total_amount']}') ?? 0,
      itemCount: int.tryParse('${json['item_count']}') ?? 0,
      deliveryDate: '${json['delivery_date'] ?? ''}',
      deliverySlotName: '${json['delivery_slot_name'] ?? ''}',
      proposedDeliveryDate: '${json['proposed_delivery_date'] ?? ''}',
      proposedDeliverySlotName: '${json['proposed_delivery_slot_name'] ?? ''}',
      rescheduleReason: '${json['reschedule_reason'] ?? ''}',
      createdAt: DateTime.tryParse('${json['created_at']}'),
      note: '${json['note'] ?? ''}',
      receiverName: '${json['receiver_name'] ?? ''}',
      receiverPhone: '${json['receiver_phone'] ?? ''}',
      deliveryAddress: '${json['delivery_address'] ?? ''}',
      items: itemsRaw is List
          ? itemsRaw
              .whereType<Map>()
              .map((e) => OrderItemModel.fromJson(Map<String, dynamic>.from(e)))
              .toList()
          : [],
      statusHistories: historiesRaw is List
          ? historiesRaw.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
          : [],
    );
  }
}

class StockCheckResult {
  StockCheckResult({
    required this.dealerProductId,
    required this.requestedQuantity,
    required this.availableQuantity,
    required this.shortfall,
    required this.canOrderAvailable,
    required this.needsPreorder,
    required this.orderAvailableQuantity,
  });

  final int dealerProductId;
  final int requestedQuantity;
  final int availableQuantity;
  final int shortfall;
  final bool canOrderAvailable;
  final bool needsPreorder;
  final int orderAvailableQuantity;

  factory StockCheckResult.fromJson(Map<String, dynamic> json) {
    return StockCheckResult(
      dealerProductId: int.tryParse('${json['dealer_product_id']}') ?? 0,
      requestedQuantity: int.tryParse('${json['requested_quantity']}') ?? 0,
      availableQuantity: int.tryParse('${json['available_quantity']}') ?? 0,
      shortfall: int.tryParse('${json['shortfall']}') ?? 0,
      canOrderAvailable: json['can_order_available'] != false,
      needsPreorder: json['needs_preorder'] == true,
      orderAvailableQuantity: int.tryParse('${json['order_available_quantity']}') ?? 0,
    );
  }
}

class PreOrderItemModel {
  PreOrderItemModel({
    required this.id,
    required this.dealerProductId,
    required this.productTitle,
    required this.unit,
    required this.requestedQuantity,
    this.availableAtSubmit = 0,
    this.confirmedQuantity,
    this.proposedQuantity,
  });

  final int id;
  final int dealerProductId;
  final String productTitle;
  final String unit;
  final int requestedQuantity;
  final int availableAtSubmit;
  final int? confirmedQuantity;
  final int? proposedQuantity;

  factory PreOrderItemModel.fromJson(Map<String, dynamic> json) {
    return PreOrderItemModel(
      id: int.tryParse('${json['id']}') ?? 0,
      dealerProductId: int.tryParse('${json['dealer_product_id']}') ?? 0,
      productTitle: '${json['product_title'] ?? ''}',
      unit: '${json['unit'] ?? ''}',
      requestedQuantity: int.tryParse('${json['requested_quantity']}') ?? 0,
      availableAtSubmit: int.tryParse('${json['available_at_submit']}') ?? 0,
      confirmedQuantity: int.tryParse('${json['confirmed_quantity']}'),
      proposedQuantity: int.tryParse('${json['proposed_quantity']}'),
    );
  }
}

class PreOrderModel {
  PreOrderModel({
    required this.id,
    required this.requestCode,
    required this.status,
    this.statusLabel = '',
    this.requestedDeliveryTime,
    this.confirmedDeliveryTime,
    this.proposedDeliveryTime,
    this.itemCount = 0,
    this.convertedOrderId,
    this.createdAt,
    this.receiverName = '',
    this.receiverPhone = '',
    this.deliveryAddress = '',
    this.note = '',
    this.dealerNote = '',
    this.rejectReason = '',
    this.items = const [],
  });

  final int id;
  final String requestCode;
  final String status;
  final String statusLabel;
  final DateTime? requestedDeliveryTime;
  final DateTime? confirmedDeliveryTime;
  final DateTime? proposedDeliveryTime;
  final int itemCount;
  final int? convertedOrderId;
  final DateTime? createdAt;
  final String receiverName;
  final String receiverPhone;
  final String deliveryAddress;
  final String note;
  final String dealerNote;
  final String rejectReason;
  final List<PreOrderItemModel> items;

  factory PreOrderModel.fromJson(Map<String, dynamic> json) {
    final itemsRaw = json['items'];
    final status = '${json['status'] ?? ''}';

    return PreOrderModel(
      id: int.tryParse('${json['id']}') ?? 0,
      requestCode: '${json['request_code'] ?? ''}',
      status: status,
      statusLabel: '${json['status_label'] ?? preorderStatusLabels[status] ?? status}',
      requestedDeliveryTime: DateTime.tryParse('${json['requested_delivery_time']}'),
      confirmedDeliveryTime: DateTime.tryParse('${json['confirmed_delivery_time']}'),
      proposedDeliveryTime: DateTime.tryParse('${json['proposed_delivery_time']}'),
      itemCount: int.tryParse('${json['item_count']}') ?? 0,
      convertedOrderId: int.tryParse('${json['converted_order_id']}'),
      createdAt: DateTime.tryParse('${json['created_at']}'),
      receiverName: '${json['receiver_name'] ?? ''}',
      receiverPhone: '${json['receiver_phone'] ?? ''}',
      deliveryAddress: '${json['delivery_address'] ?? ''}',
      note: '${json['note'] ?? ''}',
      dealerNote: '${json['dealer_note'] ?? ''}',
      rejectReason: '${json['reject_reason'] ?? ''}',
      items: itemsRaw is List
          ? itemsRaw
              .whereType<Map>()
              .map((e) => PreOrderItemModel.fromJson(Map<String, dynamic>.from(e)))
              .toList()
          : [],
    );
  }
}

const preorderStatusLabels = <String, String>{
  'submitted': 'Chờ đại lý xử lý',
  'customer_confirmation_pending': 'Chờ bạn xác nhận',
  'rejected_by_dealer': 'Đại lý từ chối',
  'rejected_by_customer': 'Bạn đã từ chối',
  'converted': 'Đã chuyển thành đơn',
  'cancelled': 'Đã hủy',
};

class VoucherModel {
  VoucherModel({
    required this.id,
    required this.code,
    required this.title,
    this.description = '',
    this.discountType = 'percent',
    this.discountValue = 0,
    this.minOrderAmount = 0,
    this.maxDiscountAmount,
    this.usageLimit,
    this.usageLimitPerCustomer,
    this.startDate,
    this.endDate,
    this.isSaved = false,
  });

  final int id;
  final String code;
  final String title;
  final String description;
  final String discountType;
  final double discountValue;
  final double minOrderAmount;
  final double? maxDiscountAmount;
  final int? usageLimit;
  final int? usageLimitPerCustomer;
  final DateTime? startDate;
  final DateTime? endDate;
  final bool isSaved;

  bool get isPercent => discountType == 'percent';

  VoucherModel copyWith({
    int? id,
    String? code,
    String? title,
    String? description,
    String? discountType,
    double? discountValue,
    double? minOrderAmount,
    double? maxDiscountAmount,
    int? usageLimit,
    int? usageLimitPerCustomer,
    DateTime? startDate,
    DateTime? endDate,
    bool? isSaved,
  }) =>
      VoucherModel(
        id: id ?? this.id,
        code: code ?? this.code,
        title: title ?? this.title,
        description: description ?? this.description,
        discountType: discountType ?? this.discountType,
        discountValue: discountValue ?? this.discountValue,
        minOrderAmount: minOrderAmount ?? this.minOrderAmount,
        maxDiscountAmount: maxDiscountAmount ?? this.maxDiscountAmount,
        usageLimit: usageLimit ?? this.usageLimit,
        usageLimitPerCustomer: usageLimitPerCustomer ?? this.usageLimitPerCustomer,
        startDate: startDate ?? this.startDate,
        endDate: endDate ?? this.endDate,
        isSaved: isSaved ?? this.isSaved,
      );

  factory VoucherModel.fromJson(Map<String, dynamic> json) => VoucherModel(
        id: int.tryParse('${json['id']}') ?? 0,
        code: '${json['code'] ?? ''}',
        title: '${json['title'] ?? ''}',
        description: '${json['description'] ?? ''}',
        discountType: '${json['discount_type'] ?? 'percent'}',
        discountValue: _parseDouble(json['discount_value']),
        minOrderAmount: _parseDouble(json['min_order_amount']),
        maxDiscountAmount: _parseOptionalDouble(json['max_discount_amount']),
        usageLimit: _parseOptionalInt(json['usage_limit']),
        usageLimitPerCustomer: _parseOptionalInt(json['usage_limit_per_customer']),
        startDate: DateTime.tryParse('${json['start_date'] ?? ''}'),
        endDate: DateTime.tryParse('${json['end_date'] ?? ''}'),
        isSaved: json['is_saved'] == true,
      );
}

double _parseDouble(dynamic value) => double.tryParse('$value') ?? 0;

double? _parseOptionalDouble(dynamic value) {
  if (value == null || '$value'.isEmpty) return null;
  return double.tryParse('$value');
}

int? _parseOptionalInt(dynamic value) {
  if (value == null || '$value'.isEmpty) return null;
  return int.tryParse('$value');
}

class ReviewModel {
  ReviewModel({
    required this.id,
    required this.productTitle,
    required this.rating,
    this.comment = '',
    this.orderId,
    this.orderCode = '',
    this.createdAt,
    this.images = const [],
  });

  final int id;
  final String productTitle;
  final int rating;
  final String comment;
  final int? orderId;
  final String orderCode;
  final DateTime? createdAt;
  final List<ReviewImageModel> images;

  List<String> get imageUrls =>
      images.map((image) => image.imageUrl).where((url) => url.isNotEmpty).toList();

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    final imagesRaw = json['images'];
    return ReviewModel(
      id: int.tryParse('${json['id']}') ?? 0,
      productTitle: '${json['product_title'] ?? ''}',
      rating: int.tryParse('${json['rating']}') ?? 0,
      comment: '${json['comment'] ?? ''}',
      orderId: int.tryParse('${json['order_id']}'),
      orderCode: '${json['order_code'] ?? ''}',
      createdAt: DateTime.tryParse('${json['created_at']}'),
      images: imagesRaw is List
          ? imagesRaw
              .whereType<Map>()
              .map((e) => ReviewImageModel.fromJson(Map<String, dynamic>.from(e)))
              .toList()
          : const [],
    );
  }
}

class ReviewImageModel {
  ReviewImageModel({
    required this.id,
    required this.imageUrl,
    this.createdAt,
  });

  final int id;
  final String imageUrl;
  final DateTime? createdAt;

  factory ReviewImageModel.fromJson(Map<String, dynamic> json) => ReviewImageModel(
        id: int.tryParse('${json['id']}') ?? 0,
        imageUrl: '${json['image_url'] ?? ''}',
        createdAt: DateTime.tryParse('${json['created_at'] ?? ''}'),
      );
}

class PendingReviewModel {
  PendingReviewModel({
    required this.orderId,
    required this.dealerProductId,
    required this.productTitle,
    this.orderCode = '',
  });

  final int orderId;
  final int dealerProductId;
  final String productTitle;
  final String orderCode;

  factory PendingReviewModel.fromJson(Map<String, dynamic> json) =>
      PendingReviewModel(
        orderId: int.tryParse('${json['order_id']}') ?? 0,
        dealerProductId: int.tryParse('${json['dealer_product_id']}') ?? 0,
        productTitle: '${json['product_title'] ?? ''}',
        orderCode: '${json['order_code'] ?? ''}',
      );
}

class NotificationModel {
  NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    this.isRead = false,
    this.createdAt,
    this.readAt,
    this.referenceType = '',
    this.referenceOrderCode = '',
    this.referenceId,
  });

  final int id;
  final String title;
  final String message;
  final bool isRead;
  final DateTime? createdAt;
  final DateTime? readAt;
  final String referenceType;
  final String referenceOrderCode;
  final int? referenceId;

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    final readAtRaw = json['read_at'];
    final readAt = readAtRaw != null ? DateTime.tryParse('$readAtRaw') : null;
    final isReadFlag = json['is_read'];
    final isRead = readAt != null ||
        isReadFlag == true ||
        isReadFlag == 1 ||
        '$isReadFlag' == 'true';

    return NotificationModel(
      id: int.tryParse('${json['id']}') ?? 0,
      title: '${json['title'] ?? json['subject'] ?? ''}',
      message: '${json['message'] ?? json['body'] ?? json['content'] ?? ''}',
      isRead: isRead,
      createdAt: DateTime.tryParse('${json['created_at']}'),
      readAt: readAt,
      referenceType: '${json['reference_type'] ?? ''}',
      referenceOrderCode: '${json['reference_order_code'] ?? ''}',
      referenceId: int.tryParse('${json['reference_id']}'),
    );
  }
}

class NotificationBellFeed {
  NotificationBellFeed({required this.unreadCount, required this.items});

  final int unreadCount;
  final List<NotificationModel> items;
}

class DealerModel {
  DealerModel({
    required this.storeName,
    required this.slug,
    this.logoUrl = '',
    this.description = '',
    this.storeAddress = '',
  });

  final String storeName;
  final String slug;
  final String logoUrl;
  final String description;
  final String storeAddress;

  factory DealerModel.fromJson(Map<String, dynamic> json) => DealerModel(
        storeName: '${json['store_name'] ?? ''}',
        slug: '${json['slug'] ?? ''}',
        logoUrl: '${json['logo_url'] ?? ''}',
        description: '${json['description'] ?? ''}',
        storeAddress: '${json['store_address'] ?? ''}',
      );
}

class DeliverySlotModel {
  DeliverySlotModel({
    required this.id,
    required this.name,
    this.available = true,
    this.timeLabel = '',
  });

  final String id;
  final String name;
  final bool available;
  final String timeLabel;

  factory DeliverySlotModel.fromJson(Map<String, dynamic> json) {
    final start = '${json['start_time'] ?? ''}';
    final end = '${json['end_time'] ?? ''}';
    final label = start.isNotEmpty && end.isNotEmpty ? '$start - $end' : '';
    return DeliverySlotModel(
      id: '${json['id'] ?? ''}',
      name: '${json['name'] ?? ''}',
      available: json['available'] != false,
      timeLabel: label,
    );
  }
}

class DeliveryDateModel {
  DeliveryDateModel({
    required this.date,
    required this.slots,
    this.label = '',
  });

  final String date;
  final List<DeliverySlotModel> slots;
  final String label;
}

class VoucherApplyResult {
  VoucherApplyResult({
    required this.discountAmount,
    required this.finalTotal,
    this.voucherCode = '',
  });

  final double discountAmount;
  final double finalTotal;
  final String voucherCode;

  factory VoucherApplyResult.fromJson(Map<String, dynamic> json) =>
      VoucherApplyResult(
        discountAmount: double.tryParse('${json['discount_amount']}') ?? 0,
        finalTotal: double.tryParse('${json['final_total']}') ?? 0,
        voucherCode: json['voucher'] is Map
            ? '${(json['voucher'] as Map)['code'] ?? ''}'
            : '',
      );
}
