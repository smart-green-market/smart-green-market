import 'package:smart_green_market/core/constants/app_constants.dart';

class DealerSlugUtils {
  DealerSlugUtils._();

  static bool isValidStoreCode(String? value) {
    if (value == null || value.trim().isEmpty) return false;
    return RegExp(AppConstants.storeCodePattern).hasMatch(value.trim().toLowerCase());
  }

  static String normalizeInput(String? input) {
    if (input == null || input.trim().isEmpty) return '';

    var value = input.trim();
    if (value.startsWith('http://') || value.startsWith('https://')) {
      try {
        value = Uri.parse(value).path;
      } catch (_) {
        return '';
      }
    }

    final pathMatch = RegExp(r'(?:^|/)cua-hang/([^/?#]+)', caseSensitive: false)
        .firstMatch(value);
    if (pathMatch != null) {
      return Uri.decodeComponent(pathMatch.group(1)!).trim().toLowerCase();
    }

    value = value.replaceAll(RegExp(r'^/+|/+$'), '');
    final first = value.split('/').first;
    return Uri.decodeComponent(first).trim().toLowerCase();
  }
}
