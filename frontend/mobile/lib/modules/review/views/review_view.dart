import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/core/theme/app_colors.dart';
import 'package:smart_green_market/core/theme/app_dimens.dart';
import 'package:smart_green_market/core/theme/app_text_styles.dart';
import 'package:smart_green_market/core/utils/formatters.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/modules/review/controllers/review_controller.dart';
import 'package:smart_green_market/modules/review/views/review_create_sheet.dart';
import 'package:smart_green_market/shared/widgets/app_header_bar.dart';
import 'package:smart_green_market/shared/widgets/center_loading_body.dart';
import 'package:smart_green_market/shared/widgets/empty_state_widget.dart';

class ReviewView extends GetView<ReviewController> {
  const ReviewView({super.key});

  @override
  Widget build(BuildContext context) {
    if (!Get.isRegistered<ReviewController>()) {
      Get.put(ReviewController(Get.find(), Get.find()));
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppHeaderBar(
        title: 'Đánh giá sản phẩm',
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Obx(
              () => SegmentedButton<int>(
                segments: const [
                  ButtonSegment(value: 0, label: Text('Chờ đánh giá')),
                  ButtonSegment(value: 1, label: Text('Đã đánh giá')),
                ],
                selected: {controller.tabIndex.value},
                onSelectionChanged: (value) => controller.tabIndex.value = value.first,
              ),
            ),
          ),
        ),
      ),
      body: Obx(() {
        if (controller.isLoading.value) {
          return const CenterLoadingBody(
            isLoading: true,
            message: 'Đang tải đánh giá...',
            child: SizedBox.shrink(),
          );
        }

        if (controller.tabIndex.value == 0) {
          if (controller.pending.isEmpty) {
            return const EmptyStateWidget(
              title: 'Không có sản phẩm chờ đánh giá',
              icon: Icons.rate_review_outlined,
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 16),
            itemCount: controller.pending.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final item = controller.pending[index];
              return _PendingReviewCard(
                item: item,
                onReview: () => showReviewCreateSheet(controller, item),
              );
            },
          );
        }

        if (controller.reviews.isEmpty) {
          return const EmptyStateWidget(
            title: 'Chưa có đánh giá',
            icon: Icons.star_outline_rounded,
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 16),
          itemCount: controller.reviews.length,
          separatorBuilder: (_, _) => const SizedBox(height: 10),
          itemBuilder: (context, index) {
            final review = controller.reviews[index];
            return _ReviewCard(
              review: review,
              onDelete: () => controller.deleteReview(review.id),
            );
          },
        );
      }),
    );
  }
}

class _PendingReviewCard extends StatelessWidget {
  const _PendingReviewCard({required this.item, required this.onReview});

  final PendingReviewModel item;
  final VoidCallback onReview;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.productTitle,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppTextStyles.bodyBold,
                ),
                const SizedBox(height: 4),
                Text(
                  'Đơn ${item.orderCode}',
                  style: AppTextStyles.captionMuted,
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              minimumSize: const Size(0, 40),
              padding: const EdgeInsets.symmetric(horizontal: 14),
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            onPressed: onReview,
            child: const Text('Đánh giá'),
          ),
        ],
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  const _ReviewCard({required this.review, required this.onDelete});

  final ReviewModel review;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      review.productTitle,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTextStyles.bodyBold,
                    ),
                    if (review.orderCode.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text('Đơn ${review.orderCode}', style: AppTextStyles.captionMuted),
                    ],
                  ],
                ),
              ),
              IconButton(
                visualDensity: VisualDensity.compact,
                icon: const Icon(Icons.delete_outline, color: AppColors.error),
                onPressed: onDelete,
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              ...List.generate(
                5,
                (index) => Icon(
                  index < review.rating ? Icons.star_rounded : Icons.star_outline_rounded,
                  size: 18,
                  color: AppColors.star,
                ),
              ),
              if (review.createdAt != null) ...[
                const SizedBox(width: 8),
                Text(
                  Formatters.date(review.createdAt!),
                  style: AppTextStyles.captionMuted,
                ),
              ],
            ],
          ),
          if (review.comment.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              review.comment,
              style: AppTextStyles.captionMuted.copyWith(height: 1.4),
            ),
          ],
          if (review.imageUrls.isNotEmpty) ...[
            const SizedBox(height: 10),
            SizedBox(
              height: 72,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: review.imageUrls.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final url = review.imageUrls[index];
                  return ClipRRect(
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                    child: CachedNetworkImage(
                      imageUrl: url,
                      width: 72,
                      height: 72,
                      fit: BoxFit.cover,
                      placeholder: (_, _) => Container(color: AppColors.surfaceMuted),
                      errorWidget: (_, _, _) => Container(
                        color: AppColors.surfaceMuted,
                        child: const Icon(Icons.broken_image_outlined, color: AppColors.textMuted),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ],
      ),
    );
  }
}
