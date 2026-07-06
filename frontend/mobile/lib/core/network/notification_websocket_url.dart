import 'package:smart_green_market/core/constants/api_constants.dart';

class NotificationWebSocketUrl {
  NotificationWebSocketUrl._();

  static String build(String token) {
    final origin = Uri.parse(ApiConstants.apiOrigin);
    final wsScheme = origin.scheme == 'https' ? 'wss' : 'ws';
    final uri = Uri(
      scheme: wsScheme,
      host: origin.host,
      port: origin.hasPort ? origin.port : null,
      path: '/ws/notifications/',
      queryParameters: {'token': token},
    );
    return uri.toString();
  }
}
