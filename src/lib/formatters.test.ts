import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatDateTime,
  formatItemCount,
  formatPaymentMethod,
} from "@/lib/formatters";

describe("formatters", () => {
  it("formats currency using LBP labels", () => {
    expect(formatCurrency(95)).toBe("95 LBP");
  });

  it("formats item counts with singular and plural labels", () => {
    expect(formatItemCount(1)).toBe("1 item");
    expect(formatItemCount(3)).toBe("3 items");
  });

  it("formats payment method labels for display", () => {
    expect(formatPaymentMethod("cash_delivery")).toBe("Cash Delivery");
  });

  it("formats ISO timestamps for order displays", () => {
    expect(formatDateTime("2026-04-13T10:30:00.000Z")).toContain("2026");
  });
});
