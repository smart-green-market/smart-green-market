import 'package:get/get.dart';
import 'package:smart_green_market/core/utils/buyer_utils.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/data/repositories/buyer_repository.dart';
import 'package:smart_green_market/shared/controllers/storefront_controller.dart';
import 'package:smart_green_market/shared/widgets/app_snackbar.dart';

class OrderTrackingController extends GetxController {
  OrderTrackingController(this._repository, this._storefront);

  final BuyerRepository _repository;
  final StorefrontController _storefront;

  final isLoading = false.obs;
  final orders = <OrderModel>[].obs;
  final filter = 'all'.obs;

  @override
  void onInit() {
    super.onInit();
    loadOrders();
  }

  List<OrderModel> get filteredOrders {
    final list = orders.where((o) => OrderStatusUtils.isActiveTracking(o.status)).toList();
    if (filter.value == 'all') return list;
    if (filter.value == 'processing') {
      return list.where((o) => OrderStatusUtils.processingStatuses.contains(o.status)).toList();
    }
    if (filter.value == 'shipping') {
      return list.where((o) => o.status == 'shipping' || o.status == 'delivered').toList();
    }
    return list;
  }

  Future<void> loadOrders() async {
    final slug = _storefront.currentSlug;
    if (slug.isEmpty) return;

    isLoading.value = true;
    try {
      orders.assignAll(await _repository.getOrders(slug));
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> cancelOrder(OrderModel order, String reason) async {
    try {
      await _repository.cancelOrder(_storefront.currentSlug, order.id, reason);
      AppSnackbar.success('Đã hủy đơn hàng');
      await loadOrders();
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    }
  }

  Future<void> confirmReceived(OrderModel order) async {
    try {
      await _repository.confirmReceived(_storefront.currentSlug, order.id);
      AppSnackbar.success('Đã xác nhận nhận hàng');
      await loadOrders();
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    }
  }

  Future<void> acceptDeliveryReschedule(OrderModel order) async {
    try {
      await _repository.acceptDeliveryReschedule(_storefront.currentSlug, order.id);
      AppSnackbar.success('Đã đồng ý ngày giao mới');
      await loadOrders();
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    }
  }

  Future<void> rejectDeliveryReschedule(OrderModel order, String reason) async {
    try {
      await _repository.rejectDeliveryReschedule(_storefront.currentSlug, order.id, reason);
      AppSnackbar.success('Đã từ chối và hủy đơn hàng');
      await loadOrders();
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    }
  }
}

class OrderHistoryController extends GetxController {
  OrderHistoryController(this._repository, this._storefront);

  final BuyerRepository _repository;
  final StorefrontController _storefront;

  final isLoading = false.obs;
  final orders = <OrderModel>[].obs;
  final filter = 'all'.obs;

  @override
  void onInit() {
    super.onInit();
    loadOrders();
  }

  List<OrderModel> get filteredOrders {
    final list = orders.where((o) => OrderStatusUtils.isHistoryOrder(o.status)).toList();
    return switch (filter.value) {
      'completed' => list.where((o) => o.status == 'completed').toList(),
      'cancelled' => list.where((o) => o.status == 'cancelled').toList(),
      'return' => list.where((o) => OrderStatusUtils.returnStatuses.contains(o.status)).toList(),
      _ => list,
    };
  }

  Future<void> loadOrders() async {
    final slug = _storefront.currentSlug;
    if (slug.isEmpty) return;

    isLoading.value = true;
    try {
      orders.assignAll(await _repository.getOrders(slug));
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> requestReturn(OrderModel order, String reason) async {
    try {
      await _repository.requestReturn(_storefront.currentSlug, order.id, reason);
      AppSnackbar.success('Đã gửi yêu cầu trả hàng');
      await loadOrders();
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    }
  }
}
