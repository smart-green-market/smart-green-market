import 'package:smart_green_market/core/constants/storage_keys.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/shared/services/storage_service.dart';

class OrderStatusSnapshotUtils {
  OrderStatusSnapshotUtils(this._storage);

  final StorageService _storage;

  String _key(String dealerSlug, String? buyerId) {
    final slug = dealerSlug.trim().isEmpty ? 'default' : dealerSlug.trim();
    final owner = buyerId?.isNotEmpty == true ? buyerId! : 'guest';
    return '${StorageKeys.orderStatusSnapshotPrefix}_${slug}_$owner';
  }

  Map<String, String> buildStatusMap(List<OrderModel> orders) {
    final map = <String, String>{};
    for (final order in orders) {
      map['${order.id}'] = order.status;
    }
    return map;
  }

  Map<String, String>? loadSnapshot(String dealerSlug, String? buyerId) {
    final raw = _storage.read(_key(dealerSlug, buyerId));
    if (raw is! Map) return null;
    return raw.map((k, v) => MapEntry('$k', '$v'));
  }

  Future<void> saveSnapshot(
    String dealerSlug,
    String? buyerId,
    List<OrderModel> orders,
  ) async {
    await _storage.write(_key(dealerSlug, buyerId), buildStatusMap(orders));
  }

  OrderStatusUpdateResult detectUpdates(
    String dealerSlug,
    String? buyerId,
    List<OrderModel> orders,
  ) {
    final current = buildStatusMap(orders);
    final previous = loadSnapshot(dealerSlug, buyerId);

    if (previous == null || previous.isEmpty) {
      saveSnapshot(dealerSlug, buyerId, orders);
      return const OrderStatusUpdateResult(hasUpdates: false, updateCount: 0);
    }

    final changedIds = <int>[];
    final allIds = {...previous.keys, ...current.keys};
    for (final id in allIds) {
      if (previous[id] != current[id]) {
        changedIds.add(int.tryParse(id) ?? 0);
      }
    }

    return OrderStatusUpdateResult(
      hasUpdates: changedIds.isNotEmpty,
      updateCount: changedIds.length,
      changedIds: changedIds.where((id) => id > 0).toList(),
    );
  }

  Future<void> markSeen(
    String dealerSlug,
    String? buyerId,
    List<OrderModel> orders,
  ) async {
    await saveSnapshot(dealerSlug, buyerId, orders);
  }
}

class OrderStatusUpdateResult {
  const OrderStatusUpdateResult({
    required this.hasUpdates,
    required this.updateCount,
    this.changedIds = const [],
  });

  final bool hasUpdates;
  final int updateCount;
  final List<int> changedIds;
}
