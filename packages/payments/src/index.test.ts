import { describe, expect, it } from "vitest";
import {
  assertNoRawFinancialData,
  createOzowProvider,
  createPaystackProvider,
  createPaymentProviderRegistry,
  createStripeProvider
} from "./index";

describe("payment safety guardrails", () => {
  it("allows provider references and receipts", () => {
    expect(() =>
      assertNoRawFinancialData({
        providerReference: "provider-ref-123",
        receiptUrl: "https://example.com/receipt"
      })
    ).not.toThrow();
  });

  it("rejects raw card or bank data", () => {
    expect(() => assertNoRawFinancialData({ cardNumber: "4111111111111111" })).toThrow(
      "Raw financial data is not allowed"
    );
  });

  it("rejects nested raw card or bank data", () => {
    expect(() =>
      assertNoRawFinancialData({
        providerPayload: {
          cardNumber: "4111111111111111"
        }
      })
    ).toThrow("Raw financial data is not allowed");
  });
});

describe("payment provider adapters", () => {
  it("creates a Paystack intent without raw financial data", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const provider = createPaystackProvider({
      secretKey: "paystack_secret",
      fetchFn: async (url, init) => {
        calls.push({ url, init });
        return jsonResponse({
          status: true,
          data: {
            reference: "ps_ref_123",
            authorization_url: "https://paystack.test/pay/ps_ref_123"
          }
        });
      }
    });

    await expect(
      provider.createIntent({
        amountCents: 208_334,
        currency: "ZAR",
        userId: "user_123",
        tripId: "trip_123",
        paymentMethod: "card",
        returnUrl: "https://bathotravels.co.za/return",
        customerEmail: "traveller@example.com"
      })
    ).resolves.toEqual({
      provider: "paystack",
      reference: "ps_ref_123",
      redirectUrl: "https://paystack.test/pay/ps_ref_123"
    });
    expect(calls[0]?.url).toBe("https://api.paystack.co/transaction/initialize");
    expect(JSON.parse(String(calls[0]?.init.body))).toMatchObject({
      amount: 208_334,
      currency: "ZAR",
      email: "traveller@example.com",
      callback_url: "https://bathotravels.co.za/return",
      metadata: {
        userId: "user_123",
        tripId: "trip_123",
        paymentMethod: "card"
      }
    });
  });

  it("maps Paystack verification success into the shared status shape", async () => {
    const provider = createPaystackProvider({
      secretKey: "paystack_secret",
      fetchFn: async () =>
        jsonResponse({
          status: true,
          data: {
            reference: "ps_ref_123",
            status: "success",
            amount: 208_334,
            receipt_number: "receipt_123"
          }
        })
    });

    await expect(provider.verifyPayment("ps_ref_123")).resolves.toMatchObject({
      provider: "paystack",
      reference: "ps_ref_123",
      status: "succeeded",
      amountCents: 208_334,
      receiptUrl: "paystack:receipt_123"
    });
  });

  it("creates Stripe and Ozow providers behind the same registry", async () => {
    const registry = createPaymentProviderRegistry({
      paystackSecretKey: "paystack_secret",
      stripeSecretKey: "stripe_secret",
      ozowSecretKey: "ozow_secret",
      fetchFn: async () =>
        jsonResponse({
          id: "stripe_ref_123",
          client_secret: "stripe_client_secret",
          payment_status: "paid",
          amount_total: 208_334,
          status: "complete",
          data: {
            paymentRequestId: "ozow_ref_123",
            url: "https://ozow.test/pay/ozow_ref_123",
            status: "Complete",
            amount: 208_334
          }
        })
    });

    expect(registry.paystack.id).toBe("paystack");
    expect(registry.stripe.id).toBe("stripe");
    expect(registry.ozow.id).toBe("ozow");
    expect(createStripeProvider({ secretKey: "stripe_secret", fetchFn: registry.fetchFn }).id).toBe(
      "stripe"
    );
    expect(createOzowProvider({ secretKey: "ozow_secret", fetchFn: registry.fetchFn }).id).toBe(
      "ozow"
    );
  });
});

function jsonResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload
  } as Response;
}
