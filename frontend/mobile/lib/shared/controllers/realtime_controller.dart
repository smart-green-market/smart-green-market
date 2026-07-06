import 'dart:async';

import 'package:get/get.dart';
import 'package:smart_green_market/core/constants/api_constants.dart';
import 'package:smart_green_market/core/constants/storage_keys.dart';
import 'package:smart_green_market/core/utils/notification_message_parser.dart';
import 'package:smart_green_market/core/utils/order_status_snapshot_utils.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/data/repositories/buyer_repository.dart';
import 'package:smart_green_market/shared/controllers/auth_controller.dart';
import 'package:smart_green_market/shared/controllers/storefront_controller.dart';
import 'package:smart_green_market/shared/services/notification_websocket_service.dart';
import 'package:smart_green_market/shared/services/storage_service.dart';
import 'package:smart_green_market/shared/widgets/app_snackbar.dart';

/// Realtime notifications via WebSocket + bell feed REST (mirrors web).
class NotificationRealtimeController extends GetxController {
  NotificationRealtimeController(
    this._repository,
    this._auth,
    this._storage,
    this._ws,
  );

  final BuyerRepository _repository;
  final AuthController _auth;
  final StorageService _storage;
  final NotificationWebSocketService _ws;

  final unreadCount = 0.obs;
  final isLoading = false.obs;
  final bellNotifications = <NotificationModel>[].obs;
  final allNotifications = <NotificationModel>[].obs;

  NotificationWsCallback? _wsHandler;

  @override
  void onInit() {
    super.onInit();
    ever(_auth.user, (_) => _syncLifecycle());
    _syncLifecycle();
  }

  @override
  void onClose() {
    _stopRealtime();
    super.onClose();
  }

  void _syncLifecycle() {
    if (_auth.isLoggedIn) {
      _startRealtime();
    } else {
      _stopRealtime();
      unreadCount.value = 0;
      bellNotifications.clear();
      allNotifications.clear();
    }
  }

  void _startRealtime() {
    if (_wsHandler != null) return;

    _wsHandler = _handleWsMessage;
    _ws.subscribe(_wsHandler!);

    final token = _storage.read<String>(StorageKeys.accessToken);
    if (token != null && token.isNotEmpty) {
      _ws.connectWithToken(token);
    }

    fetchBellFeed();
    fetchAllNotifications();
  }

  void _stopRealtime() {
    if (_wsHandler != null) {
      _ws.unsubscribe(_wsHandler!);
      _wsHandler = null;
    }
  }

  void reconnectWebSocket() {
    final token = _storage.read<String>(StorageKeys.accessToken);
    if (token != null && token.isNotEmpty) {
      _ws.connectWithToken(token);
    }
  }

  Future<void> fetchBellFeed() async {
    if (!_auth.isLoggedIn) return;
    try {
      final feed = await _repository.getBellFeed();
      unreadCount.value = feed.unreadCount;
      bellNotifications.assignAll(feed.items);
    } catch (_) {}
  }

  Future<void> fetchAllNotifications() async {
    if (!_auth.isLoggedIn) return;
    isLoading.value = true;
    try {
      final list = await _repository.getNotifications();
      allNotifications.assignAll(list);
      if (unreadCount.value == 0) {
        unreadCount.value = list.where((n) => !n.isRead).length;
      }
    } catch (_) {
    } finally {
      isLoading.value = false;
    }
  }

  void _handleWsMessage(NotificationWsMessage message) {
    switch (message.kind) {
      case NotificationWsKind.newItem:
        final item = message.item;
        if (item == null) return;
        _prependNotification(item);
        if (isNotificationUnread(item)) {
          unreadCount.value = unreadCount.value + 1;
        }
        if (item.id > 0 && _ws.shouldShowToast(item.id)) {
          AppSnackbar.info(
            item.message.isNotEmpty ? '${item.title}\n${item.message}' : item.title,
          );
        }
        if (isOrderRelatedNotification(item)) {
          Get.find<OrderStatusRealtimeController>().refreshNow();
        }
      case NotificationWsKind.list:
        if (message.items != null) {
          bellNotifications.assignAll(message.items!);
        }
        if (message.unreadCount != null) {
          unreadCount.value = message.unreadCount!;
        }
      case NotificationWsKind.unreadCount:
        if (message.unreadCount != null) {
          unreadCount.value = message.unreadCount!;
        }
      case NotificationWsKind.unknown:
        break;
    }
  }

  void _prependNotification(NotificationModel item) {
    bellNotifications.removeWhere((n) => n.id == item.id);
    bellNotifications.insert(0, item);
    if (bellNotifications.length > ApiConstants.notificationPollPageSize) {
      bellNotifications.removeRange(
        ApiConstants.notificationPollPageSize,
        bellNotifications.length,
      );
    }

    allNotifications.removeWhere((n) => n.id == item.id);
    allNotifications.insert(0, item);
  }

  Future<void> markRead(NotificationModel item) async {
    if (item.isRead) return;
    try {
      await _repository.markNotificationRead(item.id);
      await fetchBellFeed();
      await fetchAllNotifications();
    } catch (e) {
      AppSnackbar.error(_repository.readError(e));
    }
  }
}

/// Poll order statuses every 45s + snapshot diff (mirrors web useOrderStatusNotifications).
class OrderStatusRealtimeController extends GetxController {
  OrderStatusRealtimeController(
    this._repository,
    this._auth,
    this._storefront,
    this._storage,
  );

  final BuyerRepository _repository;
  final AuthController _auth;
  final StorefrontController _storefront;
  final StorageService _storage;

  late final OrderStatusSnapshotUtils _snapshot;

  final updateCount = 0.obs;
  final latestOrders = <OrderModel>[].obs;
  final ordersChanged = false.obs;

  Timer? _pollTimer;
  Worker? _authWorker;
  Worker? _slugWorker;

  bool get hasUpdates => updateCount.value > 0;

  @override
  void onInit() {
    super.onInit();
    _snapshot = OrderStatusSnapshotUtils(_storage);
    _authWorker = ever(_auth.user, (_) => _syncLifecycle());
    _slugWorker = ever(_storefront.slug, (_) => _syncLifecycle());
    _syncLifecycle();
  }

  @override
  void onClose() {
    _pollTimer?.cancel();
    _authWorker?.dispose();
    _slugWorker?.dispose();
    super.onClose();
  }

  void _syncLifecycle() {
    _pollTimer?.cancel();
    if (!_auth.isLoggedIn || _storefront.currentSlug.isEmpty) {
      updateCount.value = 0;
      latestOrders.clear();
      return;
    }

    refreshNow();
    _pollTimer = Timer.periodic(ApiConstants.orderStatusPollInterval, (_) {
      refreshNow();
    });
  }

  Future<void> refreshNow({bool baseline = false}) async {
    if (!_auth.isLoggedIn) return;
    final slug = _storefront.currentSlug;
    if (slug.isEmpty) return;

    try {
      final orders = await _repository.getOrders(slug);
      latestOrders.assignAll(orders);

      if (baseline) {
        await _snapshot.markSeen(slug, _auth.buyerId, orders);
        updateCount.value = 0;
        ordersChanged.value = false;
        return;
      }

      final result = _snapshot.detectUpdates(slug, _auth.buyerId, orders);
      if (result.hasUpdates) {
        updateCount.value = result.updateCount;
        ordersChanged.value = true;
      }
    } catch (_) {}
  }

  Future<void> markAsSeen([List<OrderModel>? orders]) async {
    final slug = _storefront.currentSlug;
    if (slug.isEmpty) return;

    final list = orders ?? latestOrders.toList();
    await _snapshot.markSeen(slug, _auth.buyerId, list);
    updateCount.value = 0;
    ordersChanged.value = false;
  }
}
