import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/core/theme/app_colors.dart';
import 'package:smart_green_market/core/theme/app_dimens.dart';

class AppSnackbar {
  static void success(String message) => _show(
        title: 'Thành công',
        message: message,
        color: AppColors.primaryDark,
        icon: Icons.check_circle_rounded,
        duration: const Duration(seconds: 2),
      );

  static void error(String message) => _show(
        title: 'Lỗi',
        message: message,
        color: AppColors.error,
        icon: Icons.error_rounded,
        duration: const Duration(seconds: 3),
      );

  static void info(String message) => _show(
        title: 'Thông báo',
        message: message,
        color: AppColors.textPrimary,
        icon: Icons.info_rounded,
        duration: const Duration(seconds: 2),
      );

  static void _show({
    required String title,
    required String message,
    required Color color,
    required IconData icon,
    required Duration duration,
  }) {
    Get.closeAllSnackbars();
    Get.snackbar(
      title,
      message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: color,
      colorText: Colors.white,
      icon: Icon(icon, color: Colors.white),
      margin: const EdgeInsets.all(14),
      borderRadius: AppRadius.sm,
      duration: duration,
      boxShadows: const [
        BoxShadow(color: AppColors.shadow, blurRadius: 16, offset: Offset(0, 8)),
      ],
      snackStyle: SnackStyle.FLOATING,
    );
  }
}

String currentSlug() => Get.parameters['slug'] ?? '';
