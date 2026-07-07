import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/app/routes/app_routes.dart';
import 'package:smart_green_market/core/theme/app_colors.dart';
import 'package:smart_green_market/core/theme/app_dimens.dart';
import 'package:smart_green_market/core/theme/app_text_styles.dart';
import 'package:smart_green_market/modules/cart/views/cart_view.dart';
import 'package:smart_green_market/modules/home/views/home_view.dart';
import 'package:smart_green_market/modules/main/controllers/main_controller.dart';
import 'package:smart_green_market/modules/notification/views/notification_view.dart';
import 'package:smart_green_market/modules/product/views/product_list_view.dart';
import 'package:smart_green_market/shared/controllers/auth_controller.dart';
import 'package:smart_green_market/shared/controllers/cart_controller.dart';
import 'package:smart_green_market/shared/controllers/realtime_controller.dart';
import 'package:smart_green_market/shared/controllers/storefront_controller.dart';
import 'package:smart_green_market/shared/widgets/app_header_bar.dart';

class MainView extends GetView<MainController> {
  const MainView({super.key});

  @override
  Widget build(BuildContext context) {
    final slug = Get.parameters['slug'] ?? '';
    final storefront = Get.find<StorefrontController>();
    if (slug.isNotEmpty && storefront.currentSlug != slug) {
      storefront.slug.value = slug;
    }

    final auth = Get.find<AuthController>();
    final cart = Get.find<CartController>();

    return Obx(
      () => Scaffold(
        backgroundColor: AppColors.background,
        body: IndexedStack(
          index: controller.currentIndex.value,
          children: const [
            HomeView(),
            ProductListView(),
            _CartTab(),
            _NotificationTab(),
            _AccountTab(),
          ],
        ),
        bottomNavigationBar: Container(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            boxShadow: [
              BoxShadow(color: AppColors.shadow, blurRadius: 20, offset: Offset(0, -4)),
            ],
          ),
          child: SafeArea(
            top: false,
            child: NavigationBar(
              selectedIndex: controller.currentIndex.value,
              labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
              onDestinationSelected: (index) {
                if (index == MainController.tabCart && !auth.isLoggedIn) {
                  Get.toNamed(AppRoutes.login(slug));
                  return;
                }
                if (index == MainController.tabNotifications && !auth.isLoggedIn) {
                  Get.toNamed(AppRoutes.login(slug));
                  return;
                }
                controller.changeTab(index);
              },
              destinations: [
                const NavigationDestination(
                  icon: Icon(Icons.home_outlined),
                  selectedIcon: Icon(Icons.home_rounded),
                  label: 'Trang chủ',
                ),
                const NavigationDestination(
                  icon: Icon(Icons.grid_view_outlined),
                  selectedIcon: Icon(Icons.grid_view_rounded),
                  label: 'Sản phẩm',
                ),
                NavigationDestination(
                  icon: Badge(
                    isLabelVisible: cart.itemCount > 0,
                    label: Text('${cart.itemCount}'),
                    backgroundColor: AppColors.accent,
                    child: const Icon(Icons.shopping_cart_outlined),
                  ),
                  selectedIcon: const Icon(Icons.shopping_cart_rounded),
                  label: 'Giỏ hàng',
                ),
                NavigationDestination(
                  icon: Obx(() {
                    final noti = Get.find<NotificationRealtimeController>();
                    final count = noti.unreadCount.value;
                    return Badge(
                      isLabelVisible: auth.isLoggedIn && count > 0,
                      label: Text(count > 9 ? '9+' : '$count'),
                      backgroundColor: AppColors.accent,
                      child: const Icon(Icons.notifications_outlined),
                    );
                  }),
                  selectedIcon: const Icon(Icons.notifications_rounded),
                  label: 'Thông báo',
                ),
                const NavigationDestination(
                  icon: Icon(Icons.person_outline_rounded),
                  selectedIcon: Icon(Icons.person_rounded),
                  label: 'Tài khoản',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CartTab extends StatelessWidget {
  const _CartTab();

  @override
  Widget build(BuildContext context) {
    final slug = Get.parameters['slug'] ?? '';
    final auth = Get.find<AuthController>();

    if (!auth.isLoggedIn) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: const AppHeaderBar(title: 'Giỏ hàng', showBack: false),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 88,
                  height: 88,
                  decoration: const BoxDecoration(
                    color: AppColors.primarySoft,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.shopping_cart_outlined,
                    size: 42,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Đăng nhập để xem giỏ hàng',
                  textAlign: TextAlign.center,
                  style: AppTextStyles.subtitle,
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Get.toNamed(AppRoutes.login(slug)),
                    child: const Text('Đăng nhập'),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return const CartView(embedded: true);
  }
}

class _NotificationTab extends StatelessWidget {
  const _NotificationTab();

  @override
  Widget build(BuildContext context) {
    final slug = Get.parameters['slug'] ?? '';
    final auth = Get.find<AuthController>();

    if (!auth.isLoggedIn) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: const AppHeaderBar(title: 'Thông báo', showBack: false),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 88,
                  height: 88,
                  decoration: const BoxDecoration(
                    color: AppColors.primarySoft,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.notifications_outlined,
                    size: 42,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Đăng nhập để xem thông báo',
                  textAlign: TextAlign.center,
                  style: AppTextStyles.subtitle,
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Get.toNamed(AppRoutes.login(slug)),
                    child: const Text('Đăng nhập'),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return const NotificationView(embedded: true);
  }
}

class _AccountTab extends StatelessWidget {
  const _AccountTab();

  @override
  Widget build(BuildContext context) {
    final slug = Get.parameters['slug'] ?? '';
    final auth = Get.find<AuthController>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const AppHeaderBar(title: 'Tài khoản', showBack: false),
      body: Obx(() {
        if (!auth.isLoggedIn) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 88,
                    height: 88,
                    decoration: const BoxDecoration(
                      color: AppColors.primarySoft,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.person_outline_rounded,
                        size: 42, color: AppColors.primary),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Đăng nhập để sử dụng đầy đủ tính năng',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.subtitle,
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Get.toNamed(AppRoutes.login(slug)),
                      child: const Text('Đăng nhập'),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => Get.toNamed(AppRoutes.register(slug)),
                    child: const Text('Tạo tài khoản mới'),
                  ),
                ],
              ),
            ),
          );
        }

        final user = auth.user.value!;
        final orders = Get.find<OrderStatusRealtimeController>();

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: AppColors.heroGradient,
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: Colors.white.withValues(alpha: 0.22),
                    child: const Icon(Icons.person_rounded, color: Colors.white, size: 30),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user.fullName.isNotEmpty ? user.fullName : user.email,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTextStyles.title.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          user.email,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTextStyles.captionMuted.copyWith(
                            color: Colors.white.withValues(alpha: 0.9),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            _MenuGroup(children: [
              _MenuTile(
                icon: Icons.person_outline_rounded,
                label: 'Hồ sơ & địa chỉ',
                onTap: () => Get.toNamed(AppRoutes.profile(slug)),
              ),
              Obx(
                () => _MenuTile(
                  icon: Icons.local_shipping_outlined,
                  label: 'Theo dõi đơn hàng',
                  badgeCount: orders.updateCount.value,
                  onTap: () => Get.toNamed(AppRoutes.orderTracking(slug)),
                ),
              ),
              _MenuTile(
                icon: Icons.history_rounded,
                label: 'Lịch sử đơn hàng',
                onTap: () => Get.toNamed(AppRoutes.orderHistory(slug)),
              ),
              _MenuTile(
                icon: Icons.inventory_2_outlined,
                label: 'Yêu cầu đặt trước',
                onTap: () => Get.toNamed(AppRoutes.preorders(slug)),
              ),
            ]),
            const SizedBox(height: 14),
            _MenuGroup(children: [
              _MenuTile(
                icon: Icons.rate_review_outlined,
                label: 'Đánh giá sản phẩm',
                onTap: () => Get.toNamed(AppRoutes.reviews(slug)),
              ),
              _MenuTile(
                icon: Icons.confirmation_number_outlined,
                label: 'Voucher của tôi',
                onTap: () => Get.toNamed(AppRoutes.vouchers(slug)),
              ),
              _MenuTile(
                icon: Icons.info_outline_rounded,
                label: 'Về cửa hàng',
                onTap: () => Get.toNamed(AppRoutes.about(slug)),
              ),
            ]),
            const SizedBox(height: 14),
            _MenuGroup(children: [
              _MenuTile(
                icon: Icons.logout_rounded,
                label: 'Đăng xuất',
                iconColor: AppColors.error,
                labelColor: AppColors.error,
                showChevron: false,
                onTap: () async {
                  await auth.logout();
                  Get.offAllNamed(AppRoutes.main(slug));
                },
              ),
            ]),
          ],
        );
      }),
    );
  }
}

class _MenuGroup extends StatelessWidget {
  const _MenuGroup({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            children[i],
            if (i != children.length - 1)
              const Divider(height: 1, indent: 56),
          ],
        ],
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.badgeCount = 0,
    this.iconColor,
    this.labelColor,
    this.showChevron = true,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final int badgeCount;
  final Color? iconColor;
  final Color? labelColor;
  final bool showChevron;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: (iconColor ?? AppColors.primary).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppRadius.xs),
              ),
              child: Icon(icon, size: 18, color: iconColor ?? AppColors.primary),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: AppTextStyles.bodySemiBold.copyWith(
                  color: labelColor ?? AppColors.textPrimary,
                ),
              ),
            ),
            if (badgeCount > 0) ...[
              _Badge(count: badgeCount),
              const SizedBox(width: 8),
            ],
            if (showChevron)
              const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 20),
          ],
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.accent,
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Text(
        count > 9 ? '9+' : '$count',
        style: AppTextStyles.badge,
      ),
    );
  }
}
