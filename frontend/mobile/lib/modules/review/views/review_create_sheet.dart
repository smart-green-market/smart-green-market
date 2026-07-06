import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:smart_green_market/core/constants/review_constants.dart';
import 'package:smart_green_market/core/theme/app_colors.dart';
import 'package:smart_green_market/core/theme/app_dimens.dart';
import 'package:smart_green_market/core/theme/app_text_styles.dart';
import 'package:smart_green_market/core/utils/media_permission_utils.dart';
import 'package:smart_green_market/data/models/buyer_models.dart';
import 'package:smart_green_market/modules/review/controllers/review_controller.dart';

const _ratingLabels = {
  1: 'Rất tệ',
  2: 'Tệ',
  3: 'Bình thường',
  4: 'Tốt',
  5: 'Tuyệt vời',
};

Future<void> showReviewCreateSheet(
  ReviewController controller,
  PendingReviewModel item,
) async {
  await Get.bottomSheet(
    _ReviewCreateSheet(controller: controller, item: item),
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    isDismissible: true,
    enableDrag: true,
  );
}

class _ReviewCreateSheet extends StatefulWidget {
  const _ReviewCreateSheet({
    required this.controller,
    required this.item,
  });

  final ReviewController controller;
  final PendingReviewModel item;

  @override
  State<_ReviewCreateSheet> createState() => _ReviewCreateSheetState();
}

class _ReviewCreateSheetState extends State<_ReviewCreateSheet> {
  final _picker = ImagePicker();
  final _commentController = TextEditingController();

  var _rating = 5;
  var _error = '';
  final _images = <XFile>[];

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _pickImages(ImageSource source) async {
    final permission = source == ImageSource.camera
        ? await MediaPermissionUtils.ensureCameraAccess()
        : await MediaPermissionUtils.ensureGalleryAccess();

    if (permission == MediaPermissionResult.permanentlyDenied) {
      setState(() => _error = 'Quyền truy cập bị từ chối. Mở Cài đặt để bật quyền ảnh.');
      return;
    }
    if (permission == MediaPermissionResult.denied) {
      setState(() => _error = 'Cần quyền truy cập ảnh để đính kèm hình đánh giá.');
      return;
    }

    try {
      if (source == ImageSource.gallery) {
        final remaining = ReviewConstants.maxImagesPerReview - _images.length;
        if (remaining <= 0) {
          setState(() => _error = 'Chỉ được tải tối đa ${ReviewConstants.maxImagesPerReview} ảnh.');
          return;
        }

        var picked = await _tryPickMultipleFromGallery();
        if (picked.isEmpty) {
          final single = await _picker.pickImage(
            source: ImageSource.gallery,
            imageQuality: 85,
          );
          if (single != null) picked = [single];
        }
        if (picked.isEmpty) return;

        final next = picked.take(remaining).toList();
        setState(() {
          _images.addAll(next);
          _error = picked.length > remaining
              ? 'Chỉ thêm được $remaining ảnh nữa (tối đa ${ReviewConstants.maxImagesPerReview}).'
              : '';
        });
        return;
      }

      if (_images.length >= ReviewConstants.maxImagesPerReview) {
        setState(() => _error = 'Chỉ được tải tối đa ${ReviewConstants.maxImagesPerReview} ảnh.');
        return;
      }

      final picked = await _picker.pickImage(source: source, imageQuality: 85);
      if (picked == null) return;
      setState(() {
        _images.add(picked);
        _error = '';
      });
    } on PlatformException catch (e) {
      setState(() => _error = e.message ?? 'Không thể mở thư viện ảnh.');
    } catch (_) {
      setState(() => _error = 'Không thể mở thư viện ảnh. Vui lòng thử lại.');
    }
  }

  Future<List<XFile>> _tryPickMultipleFromGallery() async {
    try {
      return await _picker.pickMultiImage(imageQuality: 85);
    } catch (_) {
      return [];
    }
  }

  Future<void> _openAppSettings() async {
    await openAppSettings();
  }

  Future<void> _showImageSourcePicker() async {
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.photo_library_outlined),
                title: const Text('Chọn từ thư viện'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImages(ImageSource.gallery);
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_camera_outlined),
                title: const Text('Chụp ảnh'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImages(ImageSource.camera);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _removeImage(int index) {
    setState(() {
      _images.removeAt(index);
      _error = '';
    });
  }

  String? _validate() {
    if (_rating < 1 || _rating > 5) {
      return 'Vui lòng chọn số sao đánh giá.';
    }
    if (_images.isEmpty) {
      return 'Vui lòng tải lên ít nhất 1 ảnh đánh giá.';
    }
    return null;
  }

  Future<void> _submit() async {
    final validationError = _validate();
    if (validationError != null) {
      setState(() => _error = validationError);
      return;
    }

    setState(() => _error = '');
    final ok = await widget.controller.submitReview(
      widget.item,
      rating: _rating,
      comment: _commentController.text,
      imagePaths: _images.map((file) => file.path).toList(),
    );
    if (ok && mounted) Get.back();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.sizeOf(context).height * 0.92,
        ),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
        ),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 10),
              Container(
                width: 42,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(AppRadius.pill),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 12, 0),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Đánh giá sản phẩm', style: AppTextStyles.subtitleBold),
                          const SizedBox(height: 4),
                          Text(
                            widget.item.productTitle,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTextStyles.captionMuted,
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Get.back(),
                      icon: const Icon(Icons.close_rounded),
                    ),
                  ],
                ),
              ),
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceMuted,
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                        child: Column(
                          children: [
                            Text('Chọn số sao', style: AppTextStyles.bodySemiBold),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: List.generate(5, (index) {
                                final value = index + 1;
                                return IconButton(
                                  onPressed: () => setState(() => _rating = value),
                                  icon: Icon(
                                    value <= _rating ? Icons.star_rounded : Icons.star_outline_rounded,
                                    color: AppColors.star,
                                    size: 34,
                                  ),
                                );
                              }),
                            ),
                            Text(
                              '$_rating/5 — ${_ratingLabels[_rating]}',
                              style: AppTextStyles.captionMuted.copyWith(
                                color: AppColors.star,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 18),
                      Row(
                        children: [
                          Text('Hình ảnh', style: AppTextStyles.bodySemiBold),
                          const Spacer(),
                          Text(
                            '${_images.length}/${ReviewConstants.maxImagesPerReview}',
                            style: AppTextStyles.captionMuted,
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: [
                          for (var i = 0; i < _images.length; i++)
                            _ImagePreview(
                              file: _images[i],
                              onRemove: () => _removeImage(i),
                            ),
                          if (_images.length < ReviewConstants.maxImagesPerReview)
                            _AddImageButton(onTap: _showImageSourcePicker),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Tối thiểu 1 ảnh, tối đa ${ReviewConstants.maxImagesPerReview} ảnh.',
                        style: AppTextStyles.captionMuted,
                      ),
                      const SizedBox(height: 18),
                      Text('Nội dung đánh giá', style: AppTextStyles.bodySemiBold),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _commentController,
                        maxLines: 4,
                        decoration: const InputDecoration(
                          hintText: 'Chia sẻ trải nghiệm về sản phẩm...',
                        ),
                      ),
                      if (_error.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.errorSoft,
                            borderRadius: BorderRadius.circular(AppRadius.sm),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(_error, style: AppTextStyles.error),
                              if (_error.contains('Cài đặt')) ...[
                                const SizedBox(height: 8),
                                TextButton(
                                  onPressed: _openAppSettings,
                                  child: const Text('Mở Cài đặt'),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                child: Obx(
                  () => Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: widget.controller.isSubmitting.value ? null : () => Get.back(),
                          child: const Text('Huỷ'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: widget.controller.isSubmitting.value ? null : _submit,
                          child: widget.controller.isSubmitting.value
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Text('Gửi đánh giá'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ImagePreview extends StatelessWidget {
  const _ImagePreview({required this.file, required this.onRemove});

  final XFile file;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.sm),
          child: Image.file(
            File(file.path),
            width: 84,
            height: 84,
            fit: BoxFit.cover,
          ),
        ),
        Positioned(
          top: -6,
          right: -6,
          child: InkWell(
            onTap: onRemove,
            borderRadius: BorderRadius.circular(AppRadius.pill),
            child: Container(
              width: 24,
              height: 24,
              decoration: const BoxDecoration(
                color: AppColors.error,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close_rounded, size: 14, color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }
}

class _AddImageButton extends StatelessWidget {
  const _AddImageButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.sm),
      child: Container(
        width: 84,
        height: 84,
        decoration: BoxDecoration(
          color: AppColors.surfaceMuted,
          borderRadius: BorderRadius.circular(AppRadius.sm),
          border: Border.all(color: AppColors.border, style: BorderStyle.solid),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.add_photo_alternate_outlined, color: AppColors.primary),
            const SizedBox(height: 4),
            Text('Thêm ảnh', style: AppTextStyles.microMuted),
          ],
        ),
      ),
    );
  }
}
