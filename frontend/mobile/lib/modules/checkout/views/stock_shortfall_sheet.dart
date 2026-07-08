import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/core/theme/app_colors.dart';
import 'package:smart_green_market/core/theme/app_dimens.dart';
import 'package:smart_green_market/core/theme/app_text_styles.dart';
import 'package:smart_green_market/core/utils/preorder_utils.dart';

class StockShortfallSheet extends StatefulWidget {
  const StockShortfallSheet({
    super.key,
    required this.mergedItems,
    required this.onConfirm,
    this.submitting = false,
  });

  final List<MergedCheckoutStockItem> mergedItems;
  final void Function(Map<int, String> choices) onConfirm;
  final bool submitting;

  @override
  State<StockShortfallSheet> createState() => _StockShortfallSheetState();
}

class _StockShortfallSheetState extends State<StockShortfallSheet> {
  late Map<int, String> _choices;

  @override
  void initState() {
    super.initState();
    _choices = PreorderUtils.defaultStockChoices(widget.mergedItems);
  }

  List<MergedCheckoutStockItem> get _shortfallItems =>
      widget.mergedItems.where((row) => row.needsChoice).toList();

  bool get _unresolved => PreorderUtils.hasUnresolvedShortfall(widget.mergedItems, _choices);

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Một số sản phẩm không đủ tồn',
              style: AppTextStyles.title.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              'Chọn cách xử lý cho từng sản phẩm thiếu hàng trước khi tiếp tục.',
              style: AppTextStyles.captionMuted,
            ),
            const SizedBox(height: 16),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: _shortfallItems.length,
                separatorBuilder: (_, index) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final row = _shortfallItems[index];
                  final item = row.item;
                  final stock = row.stock;
                  final choice = _choices[item.id];

                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      border: Border.all(color: AppColors.warning.withValues(alpha: 0.25)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item.name, style: AppTextStyles.bodySemiBold),
                        const SizedBox(height: 4),
                        Text(
                          'Yêu cầu ${item.quantity} • Còn ${stock?.availableQuantity ?? 0} • Thiếu ${stock?.shortfall ?? 0}',
                          style: AppTextStyles.captionMuted,
                        ),
                        const SizedBox(height: 10),
                        if (stock?.canOrderAvailable == true)
                          _ChoiceTile(
                            label: 'Đặt ${stock!.orderAvailableQuantity} có sẵn',
                            selected: choice == StockChoice.orderAvailable,
                            onTap: () => setState(() {
                              _choices[item.id] = StockChoice.orderAvailable;
                            }),
                          ),
                        _ChoiceTile(
                          label: 'Gửi yêu cầu đặt trước (${item.quantity})',
                          selected: choice == StockChoice.preorder,
                          onTap: () => setState(() {
                            _choices[item.id] = StockChoice.preorder;
                          }),
                        ),
                        _ChoiceTile(
                          label: 'Bỏ khỏi đơn',
                          selected: choice == StockChoice.remove,
                          onTap: () => setState(() {
                            _choices[item.id] = StockChoice.remove;
                          }),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: widget.submitting ? null : () => Get.back(),
                    child: const Text('Quay lại'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: widget.submitting || _unresolved
                        ? null
                        : () => widget.onConfirm(Map<int, String>.from(_choices)),
                    child: widget.submitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Tiếp tục'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ChoiceTile extends StatelessWidget {
  const _ChoiceTile({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.sm),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: selected ? AppColors.primarySoft : AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.sm),
            border: Border.all(
              color: selected ? AppColors.primary : AppColors.border,
            ),
          ),
          child: Row(
            children: [
              Icon(
                selected ? Icons.radio_button_checked : Icons.radio_button_off,
                size: 18,
                color: selected ? AppColors.primary : AppColors.textMuted,
              ),
              const SizedBox(width: 8),
              Expanded(child: Text(label, style: AppTextStyles.caption)),
            ],
          ),
        ),
      ),
    );
  }
}
