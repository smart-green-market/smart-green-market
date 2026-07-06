import 'package:dio/dio.dart';
import 'package:get/get.dart' hide Response;
import 'package:smart_green_market/core/constants/api_constants.dart';
import 'package:smart_green_market/core/constants/storage_keys.dart';
import 'package:smart_green_market/core/network/api_exception.dart';
import 'package:smart_green_market/shared/services/notification_websocket_service.dart';
import 'package:smart_green_market/shared/services/storage_service.dart';

bool isAuthBypassRequest(String path) {
  return path.endsWith('/login/') ||
      path.endsWith('/register/') ||
      path.endsWith('/refresh/') ||
      path.endsWith('/logout/');
}

class ApiInterceptor extends QueuedInterceptor {
  ApiInterceptor(this._storage);

  final StorageService _storage;
  bool _refreshing = false;
  final List<_QueuedRequest> _queue = [];

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final token = _storage.read<String>(StorageKeys.accessToken);
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final response = err.response;
    final path = err.requestOptions.path;

    if (response?.statusCode != 401 ||
        err.requestOptions.extra['_retried'] == true ||
        isAuthBypassRequest(path)) {
      handler.next(_wrapError(err));
      return;
    }

    if (_refreshing) {
      _queue.add(_QueuedRequest(err.requestOptions, handler));
      return;
    }

    _refreshing = true;
    try {
      final refresh = _storage.read<String>(StorageKeys.refreshToken);
      if (refresh == null || refresh.isEmpty) {
        throw ApiException(message: 'Không có refresh token');
      }

      final refreshDio = Dio(BaseOptions(baseUrl: ApiConstants.defaultBaseUrl));
      final refreshResponse = await refreshDio.post<Map<String, dynamic>>(
        '/refresh/',
        data: {'refresh': refresh},
      );

      final access = refreshResponse.data?['access'] as String?;
      if (access == null || access.isEmpty) {
        throw ApiException(message: 'Refresh token không hợp lệ');
      }

      await _storage.write(StorageKeys.accessToken, access);
      final newRefresh = refreshResponse.data?['refresh'] as String?;
      if (newRefresh != null && newRefresh.isNotEmpty) {
        await _storage.write(StorageKeys.refreshToken, newRefresh);
      }

      _reconnectNotificationWebSocket(access);

      final retryResponse = await _retryRequest(err.requestOptions, access);
      handler.resolve(retryResponse);

      for (final queued in _queue) {
        try {
          final token = _storage.read<String>(StorageKeys.accessToken) ?? access;
          final res = await _retryRequest(queued.options, token);
          queued.handler.resolve(res);
        } catch (e) {
          queued.handler.reject(_wrapError(e is DioException ? e : err));
        }
      }
      _queue.clear();
    } catch (_) {
      await _storage.remove(StorageKeys.accessToken);
      await _storage.remove(StorageKeys.refreshToken);
      await _storage.remove(StorageKeys.user);

      for (final queued in _queue) {
        queued.handler.reject(_wrapError(err));
      }
      _queue.clear();
      handler.next(_wrapError(err));
    } finally {
      _refreshing = false;
    }
  }

  Future<Response<dynamic>> _retryRequest(
    RequestOptions options,
    String token,
  ) async {
    final dio = Dio(BaseOptions(baseUrl: ApiConstants.defaultBaseUrl));
    final headers = Map<String, dynamic>.from(options.headers);
    headers['Authorization'] = 'Bearer $token';

    return dio.request<dynamic>(
      options.path,
      data: options.data,
      queryParameters: options.queryParameters,
      options: Options(
        method: options.method,
        headers: headers,
        responseType: options.responseType,
        contentType: options.contentType,
        extra: {...options.extra, '_retried': true},
      ),
    );
  }

  DioException _wrapError(DioException err) {
    final response = err.response;
    final message = _extractMessage(response?.data) ??
        err.message ??
        'Đã xảy ra lỗi kết nối';

    return DioException(
      requestOptions: err.requestOptions,
      response: err.response,
      type: err.type,
      error: ApiException(
        message: message,
        statusCode: response?.statusCode,
        data: response?.data,
      ),
    );
  }

  String? _extractMessage(dynamic data) {
    if (data is Map<String, dynamic>) {
      final detail = data['detail'];
      if (detail is String) return detail;
      if (detail is List && detail.isNotEmpty) return detail.first.toString();
      final message = data['message'];
      if (message is String) return message;
    }
    return null;
  }
}

class _QueuedRequest {
  _QueuedRequest(this.options, this.handler);

  final RequestOptions options;
  final ErrorInterceptorHandler handler;
}

class ApiClient {
  ApiClient(this._storage) {
    dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.defaultBaseUrl,
        connectTimeout: ApiConstants.connectTimeout,
        receiveTimeout: ApiConstants.receiveTimeout,
        headers: {'Content-Type': 'application/json'},
      ),
    );
    dio.interceptors.add(ApiInterceptor(_storage));
  }

  late final Dio dio;
  final StorageService _storage;
}

void _reconnectNotificationWebSocket(String accessToken) {
  if (!Get.isRegistered<NotificationWebSocketService>()) return;
  Get.find<NotificationWebSocketService>().connectWithToken(accessToken);
}
