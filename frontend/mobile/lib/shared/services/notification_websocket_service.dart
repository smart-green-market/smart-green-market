import 'dart:async';

import 'package:get/get.dart';
import 'package:smart_green_market/core/constants/api_constants.dart';
import 'package:smart_green_market/core/network/notification_websocket_url.dart';
import 'package:smart_green_market/core/utils/notification_message_parser.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

typedef NotificationWsCallback = void Function(NotificationWsMessage message);

class NotificationWebSocketService extends GetxService {
  WebSocketChannel? _channel;
  StreamSubscription<dynamic>? _subscription;
  Timer? _retryTimer;
  String? _token;
  int _subscriberCount = 0;
  final _shownIds = <int>{};

  final callbacks = <NotificationWsCallback>{};

  bool get isConnected => _channel != null;

  void subscribe(NotificationWsCallback callback) {
    callbacks.add(callback);
    _subscriberCount += 1;
    _ensureConnection();
  }

  void unsubscribe(NotificationWsCallback callback) {
    callbacks.remove(callback);
    _subscriberCount = (_subscriberCount - 1).clamp(0, 999);
    if (_subscriberCount == 0) {
      _disconnect();
    }
  }

  void connectWithToken(String token) {
    if (token.isEmpty) {
      _disconnect();
      return;
    }

    if (_token != token) {
      _token = token;
      _disconnectSocketOnly();
    }

    _ensureConnection();
  }

  void reconnect() {
    if (_subscriberCount == 0 || _token == null || _token!.isEmpty) return;
    _disconnectSocketOnly();
    _ensureConnection();
  }

  void _ensureConnection() {
    if (_subscriberCount == 0 || _token == null || _token!.isEmpty) return;
    if (_channel != null) return;

    _clearRetry();
    final url = NotificationWebSocketUrl.build(_token!);

    try {
      _channel = WebSocketChannel.connect(Uri.parse(url));
      _subscription = _channel!.stream.listen(
        _onMessage,
        onError: (_) => _handleDisconnect(),
        onDone: _handleDisconnect,
        cancelOnError: true,
      );
    } catch (_) {
      _scheduleRetry();
    }
  }

  void _onMessage(dynamic event) {
    final message = event is String
        ? NotificationWsMessage.parseFromString(event)
        : NotificationWsMessage.parse(event);
    if (message == null) return;

    for (final callback in callbacks.toList()) {
      callback(message);
    }
  }

  void _handleDisconnect() {
    _disconnectSocketOnly();
    _scheduleRetry();
  }

  void _scheduleRetry() {
    _clearRetry();
    if (_subscriberCount == 0 || _token == null) return;
    _retryTimer = Timer(ApiConstants.wsRetryDelay, _ensureConnection);
  }

  void _clearRetry() {
    _retryTimer?.cancel();
    _retryTimer = null;
  }

  void _disconnectSocketOnly() {
    _clearRetry();
    _subscription?.cancel();
    _subscription = null;
    _channel?.sink.close();
    _channel = null;
  }

  void _disconnect() {
    _token = null;
    _shownIds.clear();
    _disconnectSocketOnly();
  }

  bool shouldShowToast(int notificationId) {
    if (_shownIds.contains(notificationId)) return false;
    _shownIds.add(notificationId);
    return true;
  }
}
