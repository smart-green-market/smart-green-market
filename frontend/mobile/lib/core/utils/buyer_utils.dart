import 'package:dio/dio.dart';
import 'package:smart_green_market/core/network/api_exception.dart';

class ApiErrorUtils {
  ApiErrorUtils._();

  static String extractMessage(dynamic error, [String fallback = 'Có lỗi xảy ra']) {
    if (error is ApiException) return error.message;

    if (error is DioException) {
      final wrapped = error.error;
      if (wrapped is ApiException) return wrapped.message;
      final fromData = _extractFromData(error.response?.data);
      if (fromData != null) return fromData;
      if (error.message != null && error.message!.isNotEmpty) return error.message!;
    }

    if (error is Exception) {
      final text = error.toString();
      if (text.startsWith('Exception: ')) {
        return text.replaceFirst('Exception: ', '');
      }
    }

    return fallback;
  }

  static String? _extractFromData(dynamic data) {
    if (data is Map<String, dynamic>) {
      final detail = data['detail'];
      if (detail is String && detail.isNotEmpty) return detail;
      if (detail is List && detail.isNotEmpty) return detail.first.toString();
      final message = data['message'];
      if (message is String && message.isNotEmpty) return message;
    }
    if (data is String && data.isNotEmpty) return data;
    return null;
  }
}

class OrderStatusUtils {
  OrderStatusUtils._();

  static const terminalStatuses = {'completed', 'cancelled'};
  static const returnStatuses = {
    'return_requested',
    'return_approved',
    'return_rejected',
    'returned',
  };
  static const processingStatuses = {
    'pending',
    'confirmed',
    'processing',
    'preparing',
    'waiting_stock',
    'delivery_reschedule_proposed',
  };

  static bool isActiveTracking(String? status) {
    if (status == null || status.isEmpty) return false;
    return !terminalStatuses.contains(status) && !returnStatuses.contains(status);
  }

  static bool isHistoryOrder(String? status) {
    if (status == null) return false;
    return terminalStatuses.contains(status) || returnStatuses.contains(status);
  }

  static bool canCancel(String? status) =>
      status == 'pending' || status == 'waiting_stock';

  static bool canAcceptDeliveryReschedule(String? status) =>
      status == 'delivery_reschedule_proposed';

  static bool canRejectDeliveryReschedule(String? status) =>
      status == 'delivery_reschedule_proposed';

  static bool canConfirmReceived(String? status) =>
      status == 'shipping' || status == 'delivered';

  static bool canReturn(String? status) => status == 'completed';

  static String label(String? status) {
    return switch (status) {
      'pending' => 'Chờ xác nhận',
      'confirmed' => 'Đã xác nhận',
      'processing' => 'Đang chuẩn bị',
      'preparing' => 'Đang chuẩn bị',
      'shipping' => 'Đang giao hàng',
      'delivered' => 'Đã giao',
      'completed' => 'Hoàn tất',
      'cancelled' => 'Đã hủy',
      'return_requested' => 'Yêu cầu trả hàng',
      'return_approved' => 'Đã duyệt trả hàng',
      'return_rejected' => 'Từ chối trả hàng',
      'returned' => 'Đã trả hàng',
      'waiting_stock' => 'Chờ hàng về kho',
      'delivery_reschedule_proposed' => 'Chờ xác nhận đổi ngày giao',
      _ => status ?? '—',
    };
  }

  /// Semantic color key for the given status: success | warning | info | error | neutral.
  static String colorKey(String? status) {
    return switch (status) {
      'completed' || 'delivered' => 'success',
      'cancelled' || 'return_rejected' => 'error',
      'pending' || 'return_requested' || 'waiting_stock' => 'warning',
      'delivery_reschedule_proposed' => 'warning',
      'shipping' || 'confirmed' || 'processing' || 'preparing' => 'info',
      _ => 'neutral',
    };
  }
}

class CartUtils {
  CartUtils._();

  static String sessionKey(String slug, String? buyerId) {
    final owner = buyerId?.isNotEmpty == true ? buyerId! : 'guest';
    return 'gm_cart_${slug}_$owner';
  }

  static int normalizeQuantity(int value, {int? max}) {
    var next = value < 1 ? 1 : value;
    if (max != null && max > 0 && next > max) next = max;
    return next;
  }

  static double productPrice(Map<String, dynamic> product) {
    final effective = product['effective_price'];
    if (effective != null && '$effective'.isNotEmpty) {
      return double.tryParse('$effective') ?? 0;
    }
    return double.tryParse('${product['retail_price']}') ?? 0;
  }
}
