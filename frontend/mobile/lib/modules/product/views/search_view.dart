import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/app/routes/app_routes.dart';
import 'package:smart_green_market/core/theme/app_colors.dart';
import 'package:smart_green_market/modules/product/controllers/search_controller.dart';
import 'package:smart_green_market/shared/widgets/app_header_bar.dart';
import 'package:smart_green_market/shared/widgets/center_loading_body.dart';
import 'package:smart_green_market/shared/widgets/empty_state_widget.dart';
import 'package:smart_green_market/shared/widgets/paginated_product_grid.dart';
import 'package:smart_green_market/core/theme/app_text_styles.dart';
import 'package:smart_green_market/shared/widgets/app_snackbar.dart';

class SearchView extends GetView<ProductSearchController> {
  const SearchView({super.key});

  @override
  Widget build(BuildContext context) {
    final slug = currentSlug();
    if (!Get.isRegistered<ProductSearchController>()) {
      Get.put(ProductSearchController(Get.find(), Get.find()));
    }

    final textController = TextEditingController(text: controller.query.value);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppHeaderBar(
        titleWidget: TextField(
          controller: textController,
          style: AppTextStyles.subtitle,
          decoration: const InputDecoration(
            hintText: 'Tìm sản phẩm...',
            border: InputBorder.none,
            isDense: true,
            contentPadding: EdgeInsets.symmetric(vertical: 8),
          ),
          onSubmitted: controller.search,
        ),
        actions: [
          HeaderActionButton(
            icon: Icons.search_rounded,
            iconSize: 20,
            onPressed: () => controller.search(textController.text),
          ),
        ],
      ),
      body: Obx(
        () => CenterLoadingBody(
          isLoading: controller.isLoading.value,
          message: 'Đang tìm kiếm...',
          child: controller.products.isEmpty
              ? EmptyStateWidget(
                  title: controller.query.value.isEmpty
                      ? 'Nhập từ khóa để tìm kiếm'
                      : 'Không có kết quả',
                  icon: Icons.search_off_rounded,
                )
              : PaginatedProductGrid(
                  products: controller.products,
                  isLoadingMore: controller.isLoadingMore.value,
                  onScrollNearEnd: controller.loadMore,
                  padding: const EdgeInsets.all(12),
                  onProductTap: (product) =>
                      Get.toNamed(AppRoutes.productDetail(slug, product.id)),
                ),
        ),
      ),
    );
  }
}
