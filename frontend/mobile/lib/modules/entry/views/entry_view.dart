import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/app/routes/app_routes.dart';
import 'package:smart_green_market/core/constants/app_constants.dart';
import 'package:smart_green_market/core/constants/storage_keys.dart';
import 'package:smart_green_market/core/theme/app_colors.dart';
import 'package:smart_green_market/core/theme/app_dimens.dart';
import 'package:smart_green_market/core/theme/app_text_styles.dart';
import 'package:smart_green_market/core/utils/dealer_slug_utils.dart';
import 'package:smart_green_market/shared/controllers/storefront_controller.dart';
import 'package:smart_green_market/shared/widgets/center_loading_body.dart';
import 'package:smart_green_market/shared/services/storage_service.dart';

class EntryView extends StatefulWidget {
  const EntryView({super.key});

  @override
  State<EntryView> createState() => _EntryViewState();
}

class _EntryViewState extends State<EntryView> {
  final _controller = TextEditingController();
  late final StorefrontController _storefront;
  late final StorageService _storage;

  @override
  void initState() {
    super.initState();
    _storefront = Get.find<StorefrontController>();
    _storage = Get.find<StorageService>();
    final stored = _storage.read<String>(StorageKeys.dealerSlug);
    if (stored != null && stored.isNotEmpty) {
      _controller.text = stored;
      _autoContinue(stored);
    } else {
      _controller.text = AppConstants.defaultDealerSlug;
    }
  }

  Future<void> _autoContinue(String slug) async {
    if (!DealerSlugUtils.isValidStoreCode(slug)) return;
    final ok = await _storefront.setSlug(slug);
    if (ok && mounted) {
      Get.offAllNamed(AppRoutes.main(slug));
    }
  }

  Future<void> _submit() async {
    final normalized = DealerSlugUtils.normalizeInput(_controller.text);
    if (!DealerSlugUtils.isValidStoreCode(normalized)) {
      _storefront.errorMessage.value = 'Mã cửa hàng không hợp lệ. Ví dụ: k7m-x9p-q2n';
      return;
    }
    final ok = await _storefront.setSlug(normalized);
    if (ok) {
      Get.offAllNamed(AppRoutes.main(normalized));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Obx(
        () => CenterLoadingBody(
          isLoading: _storefront.isValidating.value,
          message: 'Đang xác thực cửa hàng...',
          child: SafeArea(
            child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(24, 40, 24, 48),
              decoration: const BoxDecoration(
                gradient: AppColors.heroGradient,
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(AppRadius.xl),
                  bottomRight: Radius.circular(AppRadius.xl),
                ),
              ),
              child: Column(
                children: [
                  Container(
                    width: 76,
                    height: 76,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(AppRadius.lg),
                    ),
                    child: const Icon(Icons.storefront_rounded, size: 40, color: Colors.white),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    'Vào cửa hàng đại lý',
                    style: AppTextStyles.price.copyWith(color: Colors.white),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Nhập mã cửa hàng do đại lý cung cấp',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.body.copyWith(color: Colors.white.withValues(alpha: 0.9)),
                  ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Transform.translate(
                  offset: const Offset(0, -36),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(AppRadius.lg),
                      boxShadow: const [
                        BoxShadow(color: AppColors.shadow, blurRadius: 24, offset: Offset(0, 10)),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text('Mã cửa hàng', style: AppTextStyles.bodyBold),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _controller,
                          textAlign: TextAlign.center,
                          style: AppTextStyles.title.copyWith(letterSpacing: 1.1),
                          decoration: InputDecoration(
                            hintText: AppConstants.defaultDealerSlug,
                            prefixIcon: const Icon(Icons.qr_code_2_rounded),
                          ),
                          onSubmitted: (_) => _submit(),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Ví dụ: ${AppConstants.defaultDealerSlug}',
                          style: AppTextStyles.caption.copyWith(color: AppColors.textMuted),
                        ),
                        Obx(() {
                          final error = _storefront.errorMessage.value;
                          if (error.isEmpty) return const SizedBox.shrink();
                          return Padding(
                            padding: const EdgeInsets.only(top: 10),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              decoration: BoxDecoration(
                                color: AppColors.errorSoft,
                                borderRadius: BorderRadius.circular(AppRadius.xs),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.error_outline, color: AppColors.error, size: 18),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      error,
                                      style: AppTextStyles.error,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }),
                        const SizedBox(height: 20),
                        Obx(
                          () => ElevatedButton(
                            onPressed: _storefront.isValidating.value ? null : _submit,
                            child: _storefront.isValidating.value
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Text('Tiếp tục'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
            ),
          ),
        ),
      ),
    );
  }
}
