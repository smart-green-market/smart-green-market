import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/shared/controllers/storefront_controller.dart';
import 'package:smart_green_market/shared/widgets/app_header_bar.dart';
import 'package:smart_green_market/shared/widgets/center_loading_body.dart';

class AboutView extends StatelessWidget {
  const AboutView({super.key});

  @override
  Widget build(BuildContext context) {
    final storefront = Get.find<StorefrontController>();

    return Scaffold(
      appBar: const AppHeaderBar(title: 'Về cửa hàng'),
      body: Obx(() {
        final dealer = storefront.dealer.value;
        return CenterLoadingBody(
          isLoading: dealer == null,
          message: 'Đang tải thông tin cửa hàng...',
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (dealer!.logoUrl.isNotEmpty)
                Center(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: CachedNetworkImage(
                      imageUrl: dealer.logoUrl,
                      height: 120,
                      width: 120,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              Text(
                dealer.storeName,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              if (dealer.storeAddress.isNotEmpty)
                ListTile(
                  leading: const Icon(Icons.location_on_outlined),
                  title: Text(dealer.storeAddress),
                ),
              if (dealer.description.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text('Giới thiệu', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Text(dealer.description),
              ],
            ],
          ),
        );
      }),
    );
  }
}
