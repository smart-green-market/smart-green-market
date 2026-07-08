import 'package:smart_green_market/data/models/buyer_models.dart';

class StockChoice {
  StockChoice._();

  static const orderAvailable = 'order_available';
  static const preorder = 'preorder';
  static const remove = 'remove';
}

class MergedCheckoutStockItem {
  MergedCheckoutStockItem({
    required this.item,
    required this.stock,
    required this.needsChoice,
  });

  final CartItemModel item;
  final StockCheckResult? stock;
  final bool needsChoice;
}

class CheckoutSplitResult {
  CheckoutSplitResult({
    required this.orderItems,
    required this.preorderItems,
    required this.removedProductIds,
  });

  final List<Map<String, dynamic>> orderItems;
  final List<Map<String, dynamic>> preorderItems;
  final List<int> removedProductIds;

  bool get isEmpty => orderItems.isEmpty && preorderItems.isEmpty;
}

class PreorderUtils {
  PreorderUtils._();

  static List<StockCheckResult> parseCheckStockResults(dynamic response) {
    final rows = response is List
        ? response
        : (response is Map ? response['results'] : null);
    if (rows is! List) return [];

    return rows
        .whereType<Map>()
        .map((row) => StockCheckResult.fromJson(Map<String, dynamic>.from(row)))
        .toList();
  }

  static List<MergedCheckoutStockItem> mergeStockWithCheckoutItems(
    List<CartItemModel> checkoutItems,
    List<StockCheckResult> stockResults,
  ) {
    final stockById = {
      for (final row in stockResults) row.dealerProductId: row,
    };

    return checkoutItems.map((item) {
      final stock = stockById[item.id];
      return MergedCheckoutStockItem(
        item: item,
        stock: stock,
        needsChoice: stock?.needsPreorder ?? false,
      );
    }).toList();
  }

  static Map<int, String> defaultStockChoices(List<MergedCheckoutStockItem> mergedItems) {
    final choices = <int, String>{};
    for (final row in mergedItems) {
      if (!row.needsChoice) continue;
      final stock = row.stock;
      if (stock?.canOrderAvailable == true) {
        choices[row.item.id] = StockChoice.orderAvailable;
      } else {
        choices[row.item.id] = StockChoice.preorder;
      }
    }
    return choices;
  }

  static bool hasUnresolvedShortfall(
    List<MergedCheckoutStockItem> mergedItems,
    Map<int, String> choices,
  ) {
    return mergedItems.any((row) {
      if (!row.needsChoice) return false;
      return !choices.containsKey(row.item.id);
    });
  }

  static CheckoutSplitResult splitCheckoutByChoices(
    List<MergedCheckoutStockItem> mergedItems,
    Map<int, String> choices,
  ) {
    final orderItems = <Map<String, dynamic>>[];
    final preorderItems = <Map<String, dynamic>>[];
    final removedProductIds = <int>[];

    for (final row in mergedItems) {
      final item = row.item;
      final stock = row.stock;

      if (!row.needsChoice) {
        orderItems.add({'dealer_product_id': item.id, 'quantity': item.quantity});
        continue;
      }

      final choice = choices[item.id] ?? StockChoice.remove;
      if (choice == StockChoice.remove) {
        removedProductIds.add(item.id);
        continue;
      }

      if (choice == StockChoice.orderAvailable && stock?.canOrderAvailable == true) {
        orderItems.add({
          'dealer_product_id': item.id,
          'quantity': stock!.orderAvailableQuantity,
        });
        continue;
      }

      if (choice == StockChoice.preorder) {
        preorderItems.add({'dealer_product_id': item.id, 'quantity': item.quantity});
      }
    }

    return CheckoutSplitResult(
      orderItems: orderItems,
      preorderItems: preorderItems,
      removedProductIds: removedProductIds,
    );
  }

  static List<PreOrderModel> parsePreOrderList(dynamic response) {
    final results = response is Map
        ? response['results']
        : (response is List ? response : null);
    if (results is! List) return [];

    return results
        .whereType<Map>()
        .map((row) => PreOrderModel.fromJson(Map<String, dynamic>.from(row)))
        .toList();
  }

  static bool canAcceptPreOrder(PreOrderModel? preorder) =>
      preorder?.status == 'customer_confirmation_pending';

  static bool canRejectPreOrder(PreOrderModel? preorder) =>
      preorder?.status == 'customer_confirmation_pending';
}
