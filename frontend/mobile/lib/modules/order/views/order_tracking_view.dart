import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/core/theme/app_colors.dart';
import 'package:smart_green_market/core/theme/app_dimens.dart';
import 'package:smart_green_market/core/utils/buyer_utils.dart';
import 'package:smart_green_market/core/theme/app_text_styles.dart';
import 'package:smart_green_market/core/utils/formatters.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/modules/order/controllers/order_controller.dart';
import 'package:smart_green_market/shared/controllers/realtime_controller.dart';
import 'package:smart_green_market/shared/widgets/app_header_bar.dart';
import 'package:smart_green_market/shared/widgets/center_loading_body.dart';
import 'package:smart_green_market/shared/widgets/empty_state_widget.dart';

class OrderTrackingView extends StatefulWidget {
  const OrderTrackingView({super.key});

  @override
  State<OrderTrackingView> createState() => _OrderTrackingViewState();
}

class _OrderTrackingViewState extends State<OrderTrackingView> {
  late final OrderTrackingController controller;
  late final OrderStatusRealtimeController realtime;
  Worker? _ordersChangedWorker;

  @override
  void initState() {
    super.initState();
    controller = Get.put(OrderTrackingController(Get.find(), Get.find()));
    realtime = Get.find<OrderStatusRealtimeController>();

    _ordersChangedWorker = ever(realtime.ordersChanged, (changed) {
      if (changed == true) {
        controller.loadOrders();
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await controller.loadOrders();
      await realtime.markAsSeen(controller.orders.toList());
    });
  }

  @override
  void dispose() {
    _ordersChangedWorker?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final newOrderCode = Get.arguments?['orderCode'];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppHeaderBar(
        title: 'Theo dõi đơn hàng',
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(52),
          child: HeaderFilterBar(
            children: [
              _filterChip('Tất cả', 'all'),
              _filterChip('Đang xử lý', 'processing'),
              _filterChip('Đang giao', 'shipping'),
            ],
          ),
        ),
      ),
      body: Column(
        children: [
          if (newOrderCode != null)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.primarySoft,
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle_rounded, color: AppColors.primary),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Đặt hàng thành công: $newOrderCode',
                      style: const TextStyle(
                        color: AppColors.primaryDark,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          Obx(
            () => realtime.hasUpdates
                ? MaterialBanner(
                    backgroundColor: AppColors.accentSoft,
                    content: Text(
                      'Có ${realtime.updateCount.value} đơn hàng cập nhật trạng thái',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    actions: [
                      TextButton(
                        onPressed: () async {
                          await controller.loadOrders();
                          await realtime.markAsSeen(controller.orders.toList());
                        },
                        child: const Text('Làm mới'),
                      ),
                    ],
                  )
                : const SizedBox.shrink(),
          ),
          Expanded(
            child: Obx(() {
              if (controller.isLoading.value) {
                return const CenterLoadingBody(
                  isLoading: true,
                  message: 'Đang tải đơn hàng...',
                  child: SizedBox.shrink(),
                );
              }
              if (controller.filteredOrders.isEmpty) {
                return const EmptyStateWidget(
                  title: 'Không có đơn hàng đang xử lý',
                  icon: Icons.local_shipping_outlined,
                );
              }
              return RefreshIndicator(
                onRefresh: () async {
                  await controller.loadOrders();
                  await realtime.markAsSeen(controller.orders.toList());
                },
                child: ListView.builder(
                  itemCount: controller.filteredOrders.length,
                  itemBuilder: (context, index) {
                    final order = controller.filteredOrders[index];
                    return _OrderCard(
                      order: order,
                      onAction: (action) async {
                        if (action == 'cancel') {
                          await controller.cancelOrder(order, 'Buyer hủy đơn');
                        } else if (action == 'confirm') {
                          await controller.confirmReceived(order);
                        }
                        await realtime.markAsSeen(controller.orders.toList());
                      },
                    );
                  },
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _filterChip(String label, String key) {
    return Obx(
      () => ChoiceChip(
        label: Text(label),
        selected: controller.filter.value == key,
        showCheckmark: false,
        labelStyle: TextStyle(
          color: controller.filter.value == key ? Colors.white : AppColors.textPrimary,
          fontWeight: FontWeight.w600,
        ),
        onSelected: (_) => controller.filter.value = key,
      ),
    );
  }
}

class OrderHistoryView extends StatefulWidget {
  const OrderHistoryView({super.key});

  @override
  State<OrderHistoryView> createState() => _OrderHistoryViewState();
}

class _OrderHistoryViewState extends State<OrderHistoryView> {
  late final OrderHistoryController controller;
  Worker? _ordersChangedWorker;

  @override
  void initState() {
    super.initState();
    controller = Get.put(OrderHistoryController(Get.find(), Get.find()));

    // Realtime: đơn chuyển sang lịch sử (hủy/hoàn tất) hoặc trạng thái trả
    // hàng thay đổi (đại lý duyệt/từ chối) sẽ tự làm mới danh sách.
    final realtime = Get.find<OrderStatusRealtimeController>();
    _ordersChangedWorker = ever(realtime.ordersChanged, (changed) {
      if (changed == true) {
        controller.loadOrders();
      }
    });
  }

  @override
  void dispose() {
    _ordersChangedWorker?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppHeaderBar(
        title: 'Lịch sử đơn hàng',
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(52),
          child: HeaderFilterBar(
            children: [
              _historyChip(controller, 'Tất cả', 'all'),
              _historyChip(controller, 'Hoàn tất', 'completed'),
              _historyChip(controller, 'Đã hủy', 'cancelled'),
              _historyChip(controller, 'Trả hàng', 'return'),
            ],
          ),
        ),
      ),
      body: Obx(() {
        if (controller.isLoading.value) {
          return const CenterLoadingBody(
            isLoading: true,
            message: 'Đang tải lịch sử đơn hàng...',
            child: SizedBox.shrink(),
          );
        }
        if (controller.filteredOrders.isEmpty) {
          return const EmptyStateWidget(
            title: 'Không có đơn hàng',
            icon: Icons.history_rounded,
          );
        }
        return ListView.builder(
          itemCount: controller.filteredOrders.length,
          itemBuilder: (context, index) {
            final order = controller.filteredOrders[index];
            return _OrderCard(
              order: order,
              onAction: (action) async {
                if (action == 'return') {
                  await controller.requestReturn(order, 'Buyer yêu cầu trả hàng');
                }
              },
            );
          },
        );
      }),
    );
  }

  Widget _historyChip(OrderHistoryController c, String label, String key) {
    return Obx(
      () => ChoiceChip(
        label: Text(label),
        selected: c.filter.value == key,
        showCheckmark: false,
        labelStyle: TextStyle(
          color: c.filter.value == key ? Colors.white : AppColors.textPrimary,
          fontWeight: FontWeight.w600,
        ),
        onSelected: (_) => c.filter.value = key,
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.order, required this.onAction});

  final OrderModel order;
  final Future<void> Function(String action) onAction;

  static const _statusColors = {
    'success': AppColors.success,
    'error': AppColors.error,
    'warning': AppColors.warning,
    'info': AppColors.primary,
    'neutral': AppColors.textMuted,
  };

  @override
  Widget build(BuildContext context) {
    final statusColor = _statusColors[OrderStatusUtils.colorKey(order.status)]!;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  order.orderCode,
                  style: AppTextStyles.subtitleBold,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppRadius.pill),
                ),
                child: Text(
                  OrderStatusUtils.label(order.status),
                  style: AppTextStyles.caption.copyWith(
                    color: statusColor,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Tổng: ${Formatters.currency(order.totalAmount)}',
            style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primaryDark),
          ),
          if (order.deliveryDate.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              'Giao: ${order.deliveryDate} ${order.deliverySlotName}',
              style: AppTextStyles.captionMuted,
            ),
          ],
          if (OrderStatusUtils.canCancel(order.status) ||
              OrderStatusUtils.canConfirmReceived(order.status) ||
              OrderStatusUtils.canReturn(order.status)) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              children: [
                if (OrderStatusUtils.canCancel(order.status))
                  OutlinedButton(
                    style: OutlinedButton.styleFrom(minimumSize: const Size(0, 38)),
                    onPressed: () => onAction('cancel'),
                    child: const Text('Hủy đơn'),
                  ),
                if (OrderStatusUtils.canConfirmReceived(order.status))
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(minimumSize: const Size(0, 38)),
                    onPressed: () => onAction('confirm'),
                    child: Text(order.status == 'shipping' ? 'Đã nhận hàng' : 'Hoàn tất'),
                  ),
                if (OrderStatusUtils.canReturn(order.status))
                  OutlinedButton(
                    style: OutlinedButton.styleFrom(minimumSize: const Size(0, 38)),
                    onPressed: () => onAction('return'),
                    child: const Text('Yêu cầu trả hàng'),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
