import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/app/routes/app_routes.dart';
import 'package:smart_green_market/shared/controllers/auth_controller.dart';

class AuthMiddleware extends GetMiddleware {
  @override
  RouteSettings? redirect(String? route) {
    final auth = Get.find<AuthController>();
    if (auth.isLoggedIn) return null;

    final slug = Get.parameters['slug'] ?? '';
    final args = Get.arguments;
    return RouteSettings(
      name: AppRoutes.login(slug),
      arguments: {
        'redirect': route,
        if (args is Map) ...Map<String, dynamic>.from(args),
      },
    );
  }
}
