import { describe, expect, it } from "vitest";
import {
  STOCK_CHOICE,
  getDefaultStockChoices,
  mergeStockWithCheckoutItems,
  parseCheckStockResults,
  splitCheckoutByChoices,
} from "./buyerPreorderUtils";

describe("parseCheckStockResults", () => {
  it("normalizes API rows", () => {
    const rows = parseCheckStockResults([
      {
        dealer_product_id: 1,
        requested_quantity: 20,
        available_quantity: 10,
        shortfall: 10,
        can_order_available: true,
        needs_preorder: true,
        order_available_quantity: 10,
      },
    ]);

    expect(rows[0]).toEqual({
      dealerProductId: 1,
      requestedQuantity: 20,
      availableQuantity: 10,
      shortfall: 10,
      canOrderAvailable: true,
      needsPreorder: true,
      orderAvailableQuantity: 10,
    });
  });
});

describe("splitCheckoutByChoices", () => {
  const checkoutItems = [
    { id: 1, name: "Rau A", quantity: 20 },
    { id: 2, name: "Rau B", quantity: 3 },
  ];

  const stockResults = parseCheckStockResults([
    {
      dealer_product_id: 1,
      requested_quantity: 20,
      available_quantity: 10,
      shortfall: 10,
      can_order_available: true,
      needs_preorder: true,
      order_available_quantity: 10,
    },
    {
      dealer_product_id: 2,
      requested_quantity: 3,
      available_quantity: 5,
      shortfall: 0,
      can_order_available: true,
      needs_preorder: false,
      order_available_quantity: 3,
    },
  ]);

  const merged = mergeStockWithCheckoutItems(checkoutItems, stockResults);

  it("splits order available vs preorder vs remove", () => {
    const split = splitCheckoutByChoices(merged, {
      1: STOCK_CHOICE.ORDER_AVAILABLE,
    });

    expect(split.orderItems).toEqual([{ id: 1, quantity: 10 }, { id: 2, quantity: 3 }]);
    expect(split.preorderItems).toEqual([]);
    expect(split.removedProductIds).toEqual([]);
  });

  it("routes shortfall item to preorder when selected", () => {
    const split = splitCheckoutByChoices(merged, {
      1: STOCK_CHOICE.PREORDER,
    });

    expect(split.orderItems).toEqual([{ id: 2, quantity: 3 }]);
    expect(split.preorderItems).toEqual([{ id: 1, quantity: 20 }]);
  });

  it("defaults partial stock to order available", () => {
    const choices = getDefaultStockChoices(merged);
    expect(choices["1"]).toBe(STOCK_CHOICE.ORDER_AVAILABLE);
    expect(choices["2"]).toBeUndefined();
  });

  it("defaults fully out of stock to preorder", () => {
    const outOfStockMerged = mergeStockWithCheckoutItems(
      [{ id: 3, name: "Rau C", quantity: 5 }],
      parseCheckStockResults([
        {
          dealer_product_id: 3,
          requested_quantity: 5,
          available_quantity: 0,
          shortfall: 5,
          can_order_available: false,
          needs_preorder: true,
          order_available_quantity: 0,
        },
      ]),
    );

    const choices = getDefaultStockChoices(outOfStockMerged);
    expect(choices["3"]).toBe(STOCK_CHOICE.PREORDER);

    const split = splitCheckoutByChoices(outOfStockMerged, choices);
    expect(split.orderItems).toEqual([]);
    expect(split.preorderItems).toEqual([{ id: 3, quantity: 5 }]);
  });
});
