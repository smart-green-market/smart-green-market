import 'dart:io';

import 'package:permission_handler/permission_handler.dart';

enum MediaPermissionResult {
  granted,
  denied,
  permanentlyDenied,
}

class MediaPermissionUtils {
  MediaPermissionUtils._();

  static Future<MediaPermissionResult> ensureGalleryAccess() async {
    if (!Platform.isAndroid && !Platform.isIOS) {
      return MediaPermissionResult.granted;
    }

    if (Platform.isIOS) {
      return _resolve(await Permission.photos.request());
    }

    final photosStatus = await Permission.photos.status;
    if (photosStatus.isGranted || photosStatus.isLimited) {
      return MediaPermissionResult.granted;
    }

    final photosRequest = await Permission.photos.request();
    if (photosRequest.isGranted || photosRequest.isLimited) {
      return MediaPermissionResult.granted;
    }
    if (photosRequest.isPermanentlyDenied) {
      return MediaPermissionResult.permanentlyDenied;
    }

    // Android 12 trở xuống.
    final storageStatus = await Permission.storage.status;
    if (storageStatus.isGranted) {
      return MediaPermissionResult.granted;
    }

    final storageRequest = await Permission.storage.request();
    if (storageRequest.isGranted) {
      return MediaPermissionResult.granted;
    }
    if (storageRequest.isPermanentlyDenied || photosRequest.isPermanentlyDenied) {
      return MediaPermissionResult.permanentlyDenied;
    }

    // Photo Picker hệ thống (Android 13+) có thể vẫn mở được dù chưa cấp quyền đọc.
    return MediaPermissionResult.granted;
  }

  static Future<MediaPermissionResult> ensureCameraAccess() async {
    if (!Platform.isAndroid && !Platform.isIOS) {
      return MediaPermissionResult.granted;
    }

    final status = await Permission.camera.status;
    if (status.isGranted) {
      return MediaPermissionResult.granted;
    }

    return _resolve(await Permission.camera.request());
  }

  static MediaPermissionResult _resolve(PermissionStatus status) {
    if (status.isGranted || status.isLimited) {
      return MediaPermissionResult.granted;
    }
    if (status.isPermanentlyDenied) {
      return MediaPermissionResult.permanentlyDenied;
    }
    return MediaPermissionResult.denied;
  }
}
