import { describe, expect, it } from "vitest";
import {
  ORDER_REFERENCE_TYPES,
  parseOrderNotification,
} from "./orderRealtimeUtils";

describe("parseOrderNotification", () => {
  it("accepts customer_preorder_request reference type", () => {
    const parsed = parseOrderNotification({
      reference_type: ORDER_REFERENCE_TYPES.CUSTOMER_PREORDER_REQUEST,
      reference_id: 42,
    });

    expect(parsed).toEqual({
      referenceType: "customer_preorder_request",
      referenceId: 42,
      referenceStatus: null,
      referenceOrderCode: null,
    });
  });
});
