import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/core/theme/app_colors.dart';
import 'package:smart_green_market/core/theme/app_dimens.dart';
import 'package:smart_green_market/core/theme/app_text_styles.dart';
import 'package:smart_green_market/core/utils/formatters.dart';
import 'package:smart_green_market/core/utils/voucher_utils.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/modules/checkout/controllers/checkout_controller.dart';

class CheckoutVoucherSection extends StatelessWidget {
  const CheckoutVoucherSection({
    super.key,
    required this.controller,
    required this.voucherTextController,
  });

  final CheckoutController controller;
  final TextEditingController voucherTextController;

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final applied = controller.appliedVoucher.value;
      final appliedMeta = controller.appliedVoucherMeta.value;
      final saved = controller.filteredSavedVouchers;
      final isSearching = controller.voucherCode.value.trim().isNotEmpty;
      final applying = controller.applyingVoucher.value;
      final hasApplied = applied != null;

      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: TextField(
                  controller: voucherTextController,
                  enabled: !hasApplied && !applying,
                  decoration: const InputDecoration(
                    labelText: 'Mã voucher',
                    hintText: 'Tìm hoặc nhập mã voucher',
                    prefixIcon: Icon(Icons.confirmation_number_outlined, size: 20),
                  ),
                  onChanged: controller.onVoucherCodeChanged,
                ),
              ),
              const SizedBox(width: 10),
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: hasApplied
                    ? OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(0, 52),
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        onPressed: applying
                            ? null
                            : () {
                                controller.removeVoucher();
                                voucherTextController.clear();
                              },
                        child: const Text('Bỏ'),
                      )
                    : OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(0, 52),
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        onPressed: applying ? null : () => controller.applyVoucher(),
                        child: applying
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('Áp dụng'),
                      ),
              ),
            ],
          ),
          if (controller.voucherError.value.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.errorSoft,
                  borderRadius: BorderRadius.circular(AppRadius.xs),
                ),
                child: Text(
                  controller.voucherError.value,
                  style: AppTextStyles.error,
                ),
              ),
            ),
          if (hasApplied) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primarySoft,
                borderRadius: BorderRadius.circular(AppRadius.sm),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.25)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Đã áp dụng: ${applied.voucherCode}',
                    style: AppTextStyles.bodyBold.copyWith(color: AppColors.primaryDark),
                  ),
                  if (appliedMeta?.title.isNotEmpty == true) ...[
                    const SizedBox(height: 4),
                    Text(appliedMeta!.title, style: AppTextStyles.captionMuted),
                  ],
                  if (applied.discountAmount > 0) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Giảm ${Formatters.currency(applied.discountAmount)}',
                      style: AppTextStyles.bodySemiBold.copyWith(color: AppColors.primaryDark),
                    ),
                  ],
                ],
              ),
            ),
          ] else if (controller.savedVouchers.isEmpty) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surfaceMuted,
                borderRadius: BorderRadius.circular(AppRadius.sm),
                border: Border.all(color: AppColors.border, style: BorderStyle.solid),
              ),
              child: Column(
                children: [
                  const Icon(Icons.local_offer_outlined, color: AppColors.textMuted),
                  const SizedBox(height: 6),
                  Text(
                    'Chưa có voucher đã lưu',
                    style: AppTextStyles.bodySemiBold,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Bạn vẫn có thể nhập mã voucher thủ công',
                    style: AppTextStyles.captionMuted,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ] else ...[
            const SizedBox(height: 14),
            Row(
              children: [
                Text(
                  isSearching ? 'Kết quả tìm kiếm' : 'Voucher đã lưu',
                  style: AppTextStyles.captionMuted.copyWith(fontWeight: FontWeight.w600),
                ),
                const Spacer(),
                if (isSearching)
                  Text(
                    '${saved.length}/${controller.savedVouchers.length}',
                    style: AppTextStyles.captionMuted,
                  ),
              ],
            ),
            const SizedBox(height: 8),
            if (saved.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surfaceMuted,
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Text(
                  'Không tìm thấy voucher phù hợp',
                  style: AppTextStyles.captionMuted,
                  textAlign: TextAlign.center,
                ),
              )
            else
              ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 180),
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: saved.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final voucher = saved[index];
                    return _SavedVoucherTile(
                      voucher: voucher,
                      subtotal: controller.subtotal,
                      applying: applying,
                      onTap: () {
                        voucherTextController.text = voucher.code;
                        controller.selectSavedVoucher(voucher);
                      },
                    );
                  },
                ),
              ),
          ],
        ],
      );
    });
  }
}

class _SavedVoucherTile extends StatelessWidget {
  const _SavedVoucherTile({
    required this.voucher,
    required this.subtotal,
    required this.applying,
    required this.onTap,
  });

  final VoucherModel voucher;
  final double subtotal;
  final bool applying;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final eligibility = VoucherUtils.eligibility(voucher, subtotal);
    final enabled = eligibility.eligible && !applying;

    return Material(
      color: enabled ? AppColors.surfaceMuted : AppColors.surfaceMuted.withValues(alpha: 0.6),
      borderRadius: BorderRadius.circular(AppRadius.sm),
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: BorderRadius.circular(AppRadius.sm),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.sm),
            border: Border.all(
              color: enabled ? AppColors.border : AppColors.border.withValues(alpha: 0.7),
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: AppColors.primarySoft,
                  borderRadius: BorderRadius.circular(AppRadius.xs),
                ),
                child: const Icon(Icons.local_offer_outlined, size: 18, color: AppColors.primary),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(voucher.code, style: AppTextStyles.bodyBold),
                    const SizedBox(height: 2),
                    Text(
                      VoucherUtils.discountLabel(voucher),
                      style: AppTextStyles.captionMuted,
                    ),
                    if (!eligibility.eligible) ...[
                      const SizedBox(height: 2),
                      Text(
                        eligibility.reason,
                        style: AppTextStyles.caption.copyWith(color: AppColors.error),
                      ),
                    ] else if (voucher.minOrderAmount > 0) ...[
                      const SizedBox(height: 2),
                      Text(
                        'Đơn tối thiểu ${Formatters.currency(voucher.minOrderAmount)}',
                        style: AppTextStyles.captionMuted,
                      ),
                    ],
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right_rounded,
                color: enabled ? AppColors.textMuted : AppColors.border,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
