import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/app/routes/app_routes.dart';
import 'package:smart_green_market/core/theme/app_colors.dart';
import 'package:smart_green_market/core/theme/app_text_styles.dart';
import 'package:smart_green_market/core/utils/validators.dart';
import 'package:smart_green_market/modules/auth/controllers/auth_controller.dart';
import 'package:smart_green_market/shared/controllers/auth_controller.dart' as global;
import 'package:smart_green_market/shared/widgets/app_header_bar.dart';
import 'package:smart_green_market/shared/widgets/app_snackbar.dart';

class LoginView extends GetView<AuthPageController> {
  LoginView({super.key});

  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final slug = currentSlug();
    final auth = Get.find<global.AuthController>();

    return Scaffold(
      appBar: const AppHeaderBar(title: 'Đăng nhập'),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 72,
                    height: 72,
                    decoration: const BoxDecoration(
                      color: AppColors.primarySoft,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.storefront_rounded,
                        size: 34, color: AppColors.primary),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Chào mừng trở lại',
                  textAlign: TextAlign.center,
                  style: Theme.of(context)
                      .textTheme
                      .titleLarge
                      ?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 4),
                Text(
                  'Cửa hàng: $slug',
                  textAlign: TextAlign.center,
                  style: AppTextStyles.hint,
                ),
                const SizedBox(height: 28),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    prefixIcon: Icon(Icons.mail_outline_rounded),
                  ),
                  validator: Validators.email,
                ),
                const SizedBox(height: 14),
                Obx(
                  () => TextFormField(
                    controller: _passwordController,
                    obscureText: controller.obscurePassword.value,
                    decoration: InputDecoration(
                      labelText: 'Mật khẩu',
                      prefixIcon: const Icon(Icons.lock_outline_rounded),
                      suffixIcon: IconButton(
                        onPressed: controller.togglePassword,
                        icon: Icon(
                          controller.obscurePassword.value
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                        ),
                      ),
                    ),
                    validator: Validators.password,
                  ),
                ),
                const SizedBox(height: 24),
                Obx(
                  () => ElevatedButton(
                    onPressed: auth.isLoading.value ? null : _submit,
                    child: auth.isLoading.value
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Đăng nhập'),
                  ),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () => Get.toNamed(AppRoutes.register(slug)),
                  child: const Text('Chưa có tài khoản? Đăng ký ngay'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    await controller.login(
      _emailController.text.trim(),
      _passwordController.text,
    );
  }
}
