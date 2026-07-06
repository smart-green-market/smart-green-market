import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smart_green_market/modules/profile/controllers/profile_controller.dart';
import 'package:smart_green_market/shared/widgets/app_header_bar.dart';
import 'package:smart_green_market/shared/widgets/center_loading_body.dart';

class ProfileView extends StatelessWidget {
  const ProfileView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(ProfilePageController(Get.find(), Get.find()));

    return Scaffold(
      appBar: const AppHeaderBar(title: 'Hồ sơ & địa chỉ'),
      body: Obx(() {
        final user = controller.profile.value?['user'] as Map<String, dynamic>?;
        return CenterLoadingBody(
          isLoading: controller.isLoading.value,
          message: 'Đang tải hồ sơ...',
          child: RefreshIndicator(
            onRefresh: controller.loadProfile,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text('Thông tin cá nhân', style: Theme.of(context).textTheme.titleMedium),
                ListTile(
                  title: Text(user?['full_name']?.toString() ?? ''),
                  subtitle: Text(user?['email']?.toString() ?? ''),
                  trailing: IconButton(
                    icon: const Icon(Icons.edit),
                    onPressed: () => _editProfile(context, controller, user),
                  ),
                ),
                const Divider(height: 32),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Địa chỉ', style: Theme.of(context).textTheme.titleMedium),
                    TextButton.icon(
                      onPressed: () => _addAddress(context, controller),
                      icon: const Icon(Icons.add),
                      label: const Text('Thêm'),
                    ),
                  ],
                ),
                ...controller.addresses.map(
                  (address) => Card(
                    child: ListTile(
                      title: Text(address.receiverName),
                      subtitle: Text('${address.receiverPhone}\n${address.address}'),
                      trailing: IconButton(
                        icon: const Icon(Icons.delete_outline),
                        onPressed: () => controller.deleteAddress(address.id),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      }),
    );
  }

  Future<void> _editProfile(
    BuildContext context,
    ProfilePageController controller,
    Map<String, dynamic>? user,
  ) async {
    final nameController = TextEditingController(text: user?['full_name']?.toString());
    final phoneController = TextEditingController(text: user?['phone']?.toString());

    await Get.dialog(
      AlertDialog(
        title: const Text('Sửa hồ sơ'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Họ tên')),
            TextField(controller: phoneController, decoration: const InputDecoration(labelText: 'SĐT')),
          ],
        ),
        actions: [
          TextButton(onPressed: Get.back, child: const Text('Huỷ')),
          ElevatedButton(
            onPressed: () async {
              await controller.updateProfile(
                fullName: nameController.text.trim(),
                phone: phoneController.text.trim(),
              );
              Get.back();
            },
            child: const Text('Lưu'),
          ),
        ],
      ),
    );
  }

  Future<void> _addAddress(BuildContext context, ProfilePageController controller) async {
    final nameController = TextEditingController();
    final phoneController = TextEditingController();
    final addressController = TextEditingController();

    await Get.dialog(
      AlertDialog(
        title: const Text('Thêm địa chỉ'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Người nhận')),
            TextField(controller: phoneController, decoration: const InputDecoration(labelText: 'SĐT')),
            TextField(controller: addressController, decoration: const InputDecoration(labelText: 'Địa chỉ')),
          ],
        ),
        actions: [
          TextButton(onPressed: Get.back, child: const Text('Huỷ')),
          ElevatedButton(
            onPressed: () async {
              await controller.saveAddress(
                receiverName: nameController.text.trim(),
                receiverPhone: phoneController.text.trim(),
                address: addressController.text.trim(),
              );
              Get.back();
            },
            child: const Text('Lưu'),
          ),
        ],
      ),
    );
  }
}
