import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/core/theme/app_colors.dart';
import 'package:smart_green_market/core/theme/app_dimens.dart';
import 'package:smart_green_market/core/theme/app_text_styles.dart';
import 'package:smart_green_market/core/utils/formatters.dart';
import 'package:smart_green_market/core/utils/preorder_utils.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/data/repositories/buyer_repository.dart';
import 'package:smart_green_market/modules/preorder/controllers/preorder_controller.dart';
import 'package:smart_green_market/shared/controllers/storefront_controller.dart';
import 'package:smart_green_market/shared/widgets/app_header_bar.dart';
import 'package:smart_green_market/shared/widgets/center_loading_body.dart';

class PreOrderView extends StatelessWidget {
  const PreOrderView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(
      PreOrderController(Get.find<BuyerRepository>(), Get.find<StorefrontController>()),
    );

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const AppHeaderBar(
        title: 'Yêu cầu đặt trước',
        subtitle: 'Theo dõi và xác nhận đề xuất từ đại lý',
      ),
      body: Obx(
        () => CenterLoadingBody(
          isLoading: controller.isLoading.value,
          message: 'Đang tải yêu cầu đặt trước...',
          child: RefreshIndicator(
            onRefresh: controller.loadRequests,
            child: controller.requests.isEmpty
                ? ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: const [
                      SizedBox(height: 120),
                      Center(child: Text('Chưa có yêu cầu đặt trước nào')),
                    ],
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: controller.requests.length,
                    itemBuilder: (context, index) {
                      final item = controller.requests[index];
                      return _PreOrderCard(
                        item: item,
                        onTap: () => _openDetail(context, controller, item),
                      );
                    },
                  ),
          ),
        ),
      ),
    );
  }

  Future<void> _openDetail(
    BuildContext context,
    PreOrderController controller,
    PreOrderModel item,
  ) async {
    await controller.selectRequest(item.id);
    if (!context.mounted) return;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Obx(() {
          final detail = controller.selectedSummary ?? item;
          final canAccept = PreorderUtils.canAcceptPreOrder(detail);
          final canReject = PreorderUtils.canRejectPreOrder(detail);

          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(detail.requestCode, style: AppTextStyles.title),
                  const SizedBox(height: 6),
                  Text(detail.statusLabel, style: AppTextStyles.captionMuted),
                  if (detail.proposedDeliveryTime != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Ngày giao đề xuất: ${Formatters.dateTime(detail.proposedDeliveryTime!)}',
                      style: AppTextStyles.bodySemiBold,
                    ),
                  ],
                  if (detail.dealerNote.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text('Ghi chú đại lý: ${detail.dealerNote}', style: AppTextStyles.caption),
                  ],
                  const SizedBox(height: 12),
                  ...detail.items.map(
                    (line) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Text(
                        '${line.productTitle} · ${line.requestedQuantity} ${line.unit}',
                        style: AppTextStyles.body,
                      ),
                    ),
                  ),
                  if (canAccept || canReject) ...[
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        if (canReject)
                          Expanded(
                            child: OutlinedButton(
                              onPressed: controller.actionLoading.value
                                  ? null
                                  : () async {
                                      final reason = await _askReason(context);
                                      if (reason == null || reason.trim().isEmpty) return;
                                      await controller.rejectSelected(reason.trim());
                                      if (context.mounted) Navigator.pop(context);
                                    },
                              child: const Text('Từ chối'),
                            ),
                          ),
                        if (canAccept && canReject) const SizedBox(width: 12),
                        if (canAccept)
                          Expanded(
                            child: ElevatedButton(
                              onPressed: controller.actionLoading.value
                                  ? null
                                  : () async {
                                      await controller.acceptSelected();
                                      if (context.mounted) Navigator.pop(context);
                                    },
                              child: const Text('Đồng ý'),
                            ),
                          ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          );
        });
      },
    );
  }

  Future<String?> _askReason(BuildContext context) async {
    final controller = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Lý do từ chối'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(hintText: 'Nhập lý do'),
          maxLines: 3,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Huỷ')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, controller.text),
            child: const Text('Xác nhận'),
          ),
        ],
      ),
    );
  }
}

class _PreOrderCard extends StatelessWidget {
  const _PreOrderCard({required this.item, required this.onTap});

  final PreOrderModel item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.border),
      ),
      child: ListTile(
        onTap: onTap,
        title: Text(item.requestCode, style: AppTextStyles.subtitleBold),
        subtitle: Text('${item.statusLabel} · ${item.itemCount} sản phẩm'),
        trailing: const Icon(Icons.chevron_right_rounded),
      ),
    );
  }
}
