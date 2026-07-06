import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/core/theme/app_colors.dart';
import 'package:smart_green_market/core/theme/app_dimens.dart';
import 'package:smart_green_market/core/theme/app_text_styles.dart';
import 'package:smart_green_market/core/utils/formatters.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/modules/voucher/controllers/voucher_controller.dart';
import 'package:smart_green_market/shared/widgets/app_header_bar.dart';
import 'package:smart_green_market/shared/widgets/center_loading_body.dart';
import 'package:smart_green_market/shared/widgets/empty_state_widget.dart';

class VoucherView extends StatelessWidget {
  const VoucherView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(VoucherController(Get.find(), Get.find()));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppHeaderBar(
        title: 'Voucher',
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Obx(
              () => SegmentedButton<int>(
                segments: const [
                  ButtonSegment(value: 0, label: Text('Khả dụng')),
                  ButtonSegment(value: 1, label: Text('Đã lưu')),
                ],
                selected: {controller.tabIndex.value},
                onSelectionChanged: (v) => controller.tabIndex.value = v.first,
              ),
            ),
          ),
        ),
      ),
      body: Obx(() {
        final list =
            controller.tabIndex.value == 0 ? controller.available : controller.saved;
        final isSavedTab = controller.tabIndex.value == 1;
        final actionId = controller.actionId.value;

        return CenterLoadingBody(
          isLoading: controller.isLoading.value,
          message: 'Đang tải voucher...',
          child: list.isEmpty
              ? EmptyStateWidget(
                  title: isSavedTab ? 'Chưa lưu voucher nào' : 'Không có voucher khả dụng',
                  icon: Icons.confirmation_number_outlined,
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                  itemCount: list.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final voucher = list[index];
                    return _VoucherCard(
                      voucher: voucher,
                      isSavedTab: isSavedTab,
                      actionLoading: actionId == voucher.id,
                      onSave: () => controller.saveVoucher(voucher),
                      onUnsave: () => controller.unsaveVoucher(voucher),
                    );
                  },
                ),
        );
      }),
    );
  }
}

class _VoucherCard extends StatelessWidget {
  const _VoucherCard({
    required this.voucher,
    required this.isSavedTab,
    required this.actionLoading,
    required this.onSave,
    required this.onUnsave,
  });

  final VoucherModel voucher;
  final bool isSavedTab;
  final bool actionLoading;
  final VoidCallback onSave;
  final VoidCallback onUnsave;

  bool get _isSaved => isSavedTab || voucher.isSaved;

  String get _discountBadge {
    if (voucher.isPercent) {
      return '${voucher.discountValue.toStringAsFixed(0)}%';
    }
    return Formatters.currency(voucher.discountValue);
  }

  String get _discountTypeLabel => voucher.isPercent ? 'Giảm %' : 'Giảm tiền';

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.border),
        boxShadow: const [
          BoxShadow(color: AppColors.shadow, blurRadius: 10, offset: Offset(0, 3)),
        ],
      ),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              width: 92,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 16),
              decoration: const BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.horizontal(left: Radius.circular(AppRadius.lg)),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    _discountBadge,
                    textAlign: TextAlign.center,
                    style: AppTextStyles.appBarTitle.copyWith(color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _discountTypeLabel,
                    textAlign: TextAlign.center,
                    style: AppTextStyles.micro.copyWith(color: Colors.white70),
                  ),
                  const SizedBox(height: 6),
                  const Icon(Icons.confirmation_number_outlined, color: Colors.white70, size: 20),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 12, 12, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            voucher.title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: AppTextStyles.bodyBold,
                          ),
                        ),
                        if (_isSaved) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.primarySoft,
                              borderRadius: BorderRadius.circular(AppRadius.pill),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.bookmark_rounded, size: 12, color: AppColors.primary),
                                const SizedBox(width: 3),
                                Text(
                                  'Đã lưu',
                                  style: AppTextStyles.micro.copyWith(color: AppColors.primary),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.accentSoft,
                        borderRadius: BorderRadius.circular(AppRadius.xs),
                      ),
                      child: Text(
                        voucher.code,
                        style: AppTextStyles.caption.copyWith(
                          color: AppColors.accent,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    if (voucher.description.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        voucher.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppTextStyles.captionMuted,
                      ),
                    ],
                    const SizedBox(height: 10),
                    const Divider(height: 1),
                    const SizedBox(height: 8),
                    _InfoRow(
                      icon: Icons.receipt_long_outlined,
                      text: _minOrderText(),
                    ),
                    if (_hasMaxDiscount) ...[
                      const SizedBox(height: 4),
                      _InfoRow(
                        icon: Icons.savings_outlined,
                        text: 'Giảm tối đa: ${Formatters.currency(voucher.maxDiscountAmount!)}',
                      ),
                    ],
                    if (voucher.startDate != null || voucher.endDate != null) ...[
                      const SizedBox(height: 4),
                      _InfoRow(
                        icon: Icons.calendar_today_outlined,
                        text: _expiryText(),
                      ),
                    ],
                    if (_hasUsageLimit) ...[
                      const SizedBox(height: 4),
                      _InfoRow(
                        icon: Icons.people_outline_rounded,
                        text: _usageLimitText(),
                      ),
                    ],
                    const SizedBox(height: 10),
                    Align(
                      alignment: Alignment.centerRight,
                      child: _buildActionButton(),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _minOrderText() {
    if (voucher.minOrderAmount > 0) {
      return 'Đơn tối thiểu: ${Formatters.currency(voucher.minOrderAmount)}';
    }
    return 'Không yêu cầu đơn tối thiểu';
  }

  bool get _hasMaxDiscount =>
      voucher.isPercent &&
      voucher.maxDiscountAmount != null &&
      voucher.maxDiscountAmount! > 0;

  String _expiryText() {
    final start = voucher.startDate != null ? Formatters.date(voucher.startDate!) : '—';
    final end = voucher.endDate != null ? Formatters.date(voucher.endDate!) : '—';
    return 'HSD: $start – $end';
  }

  bool get _hasUsageLimit =>
      (voucher.usageLimit != null && voucher.usageLimit! > 0) ||
      (voucher.usageLimitPerCustomer != null && voucher.usageLimitPerCustomer! > 0);

  String _usageLimitText() {
    final parts = <String>[];
    if (voucher.usageLimit != null && voucher.usageLimit! > 0) {
      parts.add('Tổng ${voucher.usageLimit} lượt');
    }
    if (voucher.usageLimitPerCustomer != null && voucher.usageLimitPerCustomer! > 0) {
      parts.add('${voucher.usageLimitPerCustomer} lượt/khách');
    }
    return parts.join(' · ');
  }

  Widget _buildActionButton() {
    if (actionLoading) {
      return SizedBox(
        height: 36,
        width: 96,
        child: Center(
          child: SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
          ),
        ),
      );
    }

    if (_isSaved) {
      return OutlinedButton(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(0, 36),
          padding: const EdgeInsets.symmetric(horizontal: 14),
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        ),
        onPressed: onUnsave,
        child: const Text('Bỏ lưu'),
      );
    }

    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        minimumSize: const Size(0, 36),
        padding: const EdgeInsets.symmetric(horizontal: 14),
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
      onPressed: onSave,
      child: const Text('Lưu voucher'),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 14, color: AppColors.textMuted),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            style: AppTextStyles.captionMuted,
          ),
        ),
      ],
    );
  }
}
