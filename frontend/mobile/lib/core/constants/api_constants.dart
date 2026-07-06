class ApiConstants {
  ApiConstants._();

  static const defaultBaseUrl =
      'https://smart-green-market-api.onrender.com/api';

  static const connectTimeout = Duration(seconds: 30);
  static const receiveTimeout = Duration(seconds: 30);

  static const notificationPollPageSize = 5;
  static const productPageSize = 20;
  static const homeProductPageSize = 12;
  static const orderStatusPollInterval = Duration(seconds: 45);
  static const wsRetryDelay = Duration(seconds: 5);

  /// Backend origin without `/api` — used for WebSocket host.
  static String get apiOrigin {
    final normalized = defaultBaseUrl.replaceAll(RegExp(r'/+$'), '');
    if (normalized.endsWith('/api')) {
      return normalized.substring(0, normalized.length - '/api'.length);
    }
    return Uri.parse(normalized).origin;
  }
}
