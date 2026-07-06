import 'package:flutter_test/flutter_test.dart';
import 'package:smart_green_market/core/utils/notification_message_parser.dart';
import 'package:smart_green_market/core/utils/order_status_snapshot_utils.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/shared/services/storage_service.dart';

class _MemoryStorage extends StorageService {
  final Map<String, dynamic> _data = {};

  @override
  Future<void> init() async {}

  @override
  T? read<T>(String key) => _data[key] as T?;

  @override
  Future<void> write(String key, dynamic value) async {
    _data[key] = value;
  }
}

void main() {
  test('parses notification.new websocket payload', () {
    final message = NotificationWsMessage.parse({
      'event': 'notification.new',
      'id': 12,
      'title': 'Đơn hàng cập nhật',
      'content': 'Đơn #ABC đang giao',
      'reference_type': 'customer_order',
      'reference_order_code': 'ABC',
    });

    expect(message?.kind, NotificationWsKind.newItem);
    expect(message?.item?.referenceType, 'customer_order');
    expect(isOrderRelatedNotification(message!.item!), isTrue);
  });

  test('detects order status changes from snapshot', () async {
    final storage = _MemoryStorage();
    final utils = OrderStatusSnapshotUtils(storage);

    final baseline = [
      OrderModel(id: 1, orderCode: 'A', status: 'pending'),
    ];
    final first = utils.detectUpdates('shop-a', '1', baseline);
    expect(first.hasUpdates, isFalse);

    final updated = [
      OrderModel(id: 1, orderCode: 'A', status: 'shipping'),
    ];
    final second = utils.detectUpdates('shop-a', '1', updated);
    expect(second.hasUpdates, isTrue);
    expect(second.updateCount, 1);

    await utils.markSeen('shop-a', '1', updated);
    final third = utils.detectUpdates('shop-a', '1', updated);
    expect(third.hasUpdates, isFalse);
  });
}
