import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/app/routes/app_routes.dart';
import 'package:smart_green_market/core/theme/app_colors.dart';
import 'package:smart_green_market/core/theme/app_dimens.dart';
import 'package:smart_green_market/core/theme/app_text_styles.dart';
import 'package:smart_green_market/core/utils/notification_message_parser.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/shared/controllers/realtime_controller.dart';
import 'package:smart_green_market/shared/widgets/app_snackbar.dart';
import 'package:smart_green_market/shared/widgets/app_header_bar.dart';
import 'package:smart_green_market/shared/widgets/center_loading_body.dart';
import 'package:smart_green_market/shared/widgets/empty_state_widget.dart';

class NotificationView extends StatelessWidget {
  const NotificationView({super.key, this.embedded = false});

  /// When true, used inside [MainView] bottom nav (no back button).
  final bool embedded;

  @override
  Widget build(BuildContext context) {
    final realtime = Get.find<NotificationRealtimeController>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppHeaderBar(
        title: 'Thông báo',
        showBack: !embedded,
        actions: [
          Obx(() {
            if (realtime.unreadCount.value <= 0) return const SizedBox.shrink();
            return Center(
              child: Container(
                margin: const EdgeInsets.only(right: 4),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: AppColors.accent,
                  borderRadius: BorderRadius.circular(AppRadius.pill),
                ),
                child: Text(
                  '${realtime.unreadCount.value} mới',
                  style: AppTextStyles.badge,
                ),
              ),
            );
          }),
        ],
      ),
      body: Obx(() {
        return CenterLoadingBody(
          isLoading: realtime.isLoading.value,
          message: 'Đang tải thông báo...',
          child: realtime.allNotifications.isEmpty
              ? const EmptyStateWidget(
                  title: 'Không có thông báo',
                  icon: Icons.notifications_none_rounded,
                )
              : RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: realtime.fetchAllNotifications,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: realtime.allNotifications.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final item = realtime.allNotifications[index];
                      return _NotificationTile(
                        item: item,
                        onTap: () => _handleTap(realtime, item),
                      );
                    },
                  ),
                ),
        );
      }),
    );
  }

  Future<void> _handleTap(
    NotificationRealtimeController realtime,
    NotificationModel item,
  ) async {
    await realtime.markRead(item);
    if (isOrderRelatedNotification(item)) {
      final slug = currentSlug();
      if (slug.isNotEmpty) {
        Get.toNamed(AppRoutes.orderTracking(slug));
      }
    }
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({required this.item, required this.onTap});

  final NotificationModel item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isOrder = isOrderRelatedNotification(item);
    return Material(
      color: item.isRead ? AppColors.surface : AppColors.primarySoft,
      borderRadius: BorderRadius.circular(AppRadius.md),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: (isOrder ? AppColors.primary : AppColors.accent).withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isOrder ? Icons.local_shipping_rounded : Icons.notifications_rounded,
                  size: 20,
                  color: isOrder ? AppColors.primary : AppColors.accent,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      style: AppTextStyles.bodySemiBold.copyWith(
                        fontWeight: item.isRead ? FontWeight.w600 : FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      [
                        if (item.referenceOrderCode.isNotEmpty) 'Đơn ${item.referenceOrderCode}',
                        item.message,
                      ].where((s) => s.isNotEmpty).join(' · '),
                      style: AppTextStyles.captionMuted,
                    ),
                  ],
                ),
              ),
              if (!item.isRead)
                Container(
                  width: 9,
                  height: 9,
                  margin: const EdgeInsets.only(top: 4, left: 6),
                  decoration: const BoxDecoration(
                    color: AppColors.accent,
                    shape: BoxShape.circle,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
