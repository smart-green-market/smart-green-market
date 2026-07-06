import 'dart:convert';

import 'package:smart_green_market/data/models/buyer_models.dart';

enum NotificationWsKind { newItem, list, unreadCount, unknown }

class NotificationWsMessage {
  NotificationWsMessage._(this.kind, {this.item, this.items, this.unreadCount});

  final NotificationWsKind kind;
  final NotificationModel? item;
  final List<NotificationModel>? items;
  final int? unreadCount;

  static NotificationWsMessage? parse(dynamic raw) {
    if (raw is! Map) return null;
    final data = Map<String, dynamic>.from(raw);
    final event = data['event'];

    if (event == 'notification.new') {
      final copy = Map<String, dynamic>.from(data)..remove('event');
      return NotificationWsMessage._(
        NotificationWsKind.newItem,
        item: NotificationModel.fromJson(copy),
      );
    }

    if (event == 'notification.list' && data['items'] is List) {
      final items = (data['items'] as List)
          .whereType<Map>()
          .map((e) => NotificationModel.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      return NotificationWsMessage._(
        NotificationWsKind.list,
        items: items,
        unreadCount: int.tryParse('${data['unread_count']}'),
      );
    }

    if (event == 'notification.unread_count') {
      return NotificationWsMessage._(
        NotificationWsKind.unreadCount,
        unreadCount: int.tryParse('${data['unread_count']}') ?? 0,
      );
    }

    if (data['id'] != null && (data['title'] != null || data['content'] != null)) {
      return NotificationWsMessage._(
        NotificationWsKind.newItem,
        item: NotificationModel.fromJson(data),
      );
    }

    return null;
  }

  static NotificationWsMessage? parseFromString(String raw) {
    try {
      return parse(jsonDecode(raw));
    } catch (_) {
      return null;
    }
  }
}

bool isNotificationUnread(NotificationModel item) {
  if (item.readAt != null) return false;
  return !item.isRead;
}

bool isOrderRelatedNotification(NotificationModel item) {
  final type = item.referenceType.toLowerCase();
  return type == 'customer_order' || type.contains('order');
}
