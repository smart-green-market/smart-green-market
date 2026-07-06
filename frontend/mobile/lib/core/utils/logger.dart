import 'package:flutter/foundation.dart';

class AppLogger {
  AppLogger._();

  static void d(String message, [Object? error, StackTrace? stackTrace]) {
    if (kDebugMode) {
      debugPrint('[DEBUG] $message');
      if (error != null) debugPrint('[DEBUG] $error');
      if (stackTrace != null) debugPrint('[DEBUG] $stackTrace');
    }
  }

  static void e(String message, [Object? error, StackTrace? stackTrace]) {
    debugPrint('[ERROR] $message');
    if (error != null) debugPrint('[ERROR] $error');
    if (stackTrace != null) debugPrint('[ERROR] $stackTrace');
  }
}
