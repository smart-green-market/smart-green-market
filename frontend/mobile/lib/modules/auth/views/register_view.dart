import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/core/theme/app_colors.dart';
import 'package:smart_green_market/core/theme/app_text_styles.dart';
import 'package:smart_green_market/core/utils/validators.dart';
import 'package:smart_green_market/modules/auth/controllers/auth_controller.dart';
import 'package:smart_green_market/shared/controllers/auth_controller.dart' as global;
import 'package:smart_green_market/shared/widgets/app_header_bar.dart';
import 'package:smart_green_market/shared/widgets/app_snackbar.dart';

class RegisterView extends GetView<AuthPageController> {
  RegisterView({super.key});

  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _repasswordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final slug = currentSlug();
    final auth = Get.find<global.AuthController>();

    return Scaffold(
      appBar: const AppHeaderBar(title: 'Đăng ký'),
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
                    width: 64,
                    height: 64,
                    decoration: const BoxDecoration(
                      color: AppColors.primarySoft,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.person_add_alt_1_rounded,
                        size: 30, color: AppColors.primary),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Tạo tài khoản mới',
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
                const SizedBox(height: 24),
                TextFormField(
                  controller: _fullNameController,
                  decoration: const InputDecoration(
                    labelText: 'Họ và tên',
                    prefixIcon: Icon(Icons.badge_outlined),
                  ),
                  validator: (v) => Validators.required(v, fieldName: 'Họ và tên'),
                ),
                const SizedBox(height: 14),
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
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Số điện thoại',
                    prefixIcon: Icon(Icons.phone_outlined),
                  ),
                  validator: (v) => Validators.required(v, fieldName: 'Số điện thoại'),
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
                const SizedBox(height: 14),
                TextFormField(
                  controller: _repasswordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Xác nhận mật khẩu',
                    prefixIcon: Icon(Icons.lock_reset_rounded),
                  ),
                  validator: (v) {
                    if (v != _passwordController.text) return 'Mật khẩu xác nhận không khớp';
                    return Validators.password(v);
                  },
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
                        : const Text('Đăng ký'),
                  ),
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
    await controller.register(
      fullName: _fullNameController.text.trim(),
      email: _emailController.text.trim(),
      phone: _phoneController.text.trim(),
      password: _passwordController.text,
      repassword: _repasswordController.text,
    );
  }
}
