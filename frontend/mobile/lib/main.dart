import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/app/bindings/initial_binding.dart';
import 'package:smart_green_market/app/routes/app_pages.dart';
import 'package:smart_green_market/core/constants/app_constants.dart';
import 'package:smart_green_market/core/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initServices();
  runApp(const SmartGreenMarketApp());
}

class SmartGreenMarketApp extends StatelessWidget {
  const SmartGreenMarketApp({super.key});

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      initialRoute: AppPages.initial,
      getPages: AppPages.routes,
    );
  }
}
