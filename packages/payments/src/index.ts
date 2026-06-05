export type PaymentProviderId = "paystack" | "stripe" | "ozow";
export type PaymentMethod = "card" | "eft";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export type CreatePaymentIntentInput = {
  amountCents: number;
  currency: "ZAR";
  userId: string;
  tripId: string;
  paymentMethod: PaymentMethod;
  returnUrl: string;
  customerEmail?: string;
};

export type CreatePaymentIntentResult = {
  provider: PaymentProviderId;
  reference: string;
  redirectUrl?: string;
  clientSecret?: string;
};

export type PaymentVerificationResult = {
  provider: PaymentProviderId;
  reference: string;
  status: PaymentStatus;
  amountCents: number;
  receiptUrl?: string;
  providerPayload?: unknown;
};

export type RefundPaymentInput = {
  reference: string;
  amountCents: number;
  reason: "cancellation" | "admin_adjustment" | "provider_error";
};

export type RefundPaymentResult = {
  provider: PaymentProviderId;
  reference: string;
  status: PaymentStatus;
  refundReference: string;
};

export type PaymentReceiptResult = {
  provider: PaymentProviderId;
  reference: string;
  receiptUrl?: string;
  issuedAt: string;
};

export interface PaymentProvider {
  id: PaymentProviderId;
  createIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult>;
  verifyPayment(reference: string): Promise<PaymentVerificationResult>;
  refundPayment(input: RefundPaymentInput): Promise<RefundPaymentResult>;
  getReceipt(reference: string): Promise<PaymentReceiptResult>;
}

export type ProviderConfig = {
  secretKey: string;
  fetchFn?: FetchLike;
  baseUrl?: string;
};

export type PaymentProviderRegistryConfig = {
  paystackSecretKey: string;
  stripeSecretKey: string;
  ozowSecretKey: string;
  fetchFn?: FetchLike;
};

export type PaymentProviderRegistry = {
  paystack: PaymentProvider;
  stripe: PaymentProvider;
  ozow: PaymentProvider;
  fetchFn: FetchLike;
};

const DEFAULT_CUSTOMER_EMAIL = "traveller@bathotravels.co.za";

export function createPaymentProviderRegistry(
  config: PaymentProviderRegistryConfig
): PaymentProviderRegistry {
  const fetchFn = config.fetchFn ?? globalThis.fetch.bind(globalThis);

  return {
    paystack: createPaystackProvider({ secretKey: config.paystackSecretKey, fetchFn }),
    stripe: createStripeProvider({ secretKey: config.stripeSecretKey, fetchFn }),
    ozow: createOzowProvider({ secretKey: config.ozowSecretKey, fetchFn }),
    fetchFn
  };
}

export function createPaystackProvider(config: ProviderConfig): PaymentProvider {
  const fetchFn = config.fetchFn ?? globalThis.fetch.bind(globalThis);
  const baseUrl = config.baseUrl ?? "https://api.paystack.co";

  return {
    id: "paystack",
    async createIntent(input) {
      assertNoRawFinancialData(input as unknown as Record<string, unknown>);

      const payload = {
        amount: input.amountCents,
        currency: input.currency,
        email: input.customerEmail ?? DEFAULT_CUSTOMER_EMAIL,
        callback_url: input.returnUrl,
        metadata: {
          userId: input.userId,
          tripId: input.tripId,
          paymentMethod: input.paymentMethod
        }
      };
      const response = await postJson(fetchFn, `${baseUrl}/transaction/initialize`, payload, {
        Authorization: `Bearer ${config.secretKey}`
      });
      const data = getNestedRecord(response, "data");
      const reference = stringValue(data.reference, "Paystack did not return a payment reference.");

      return {
        provider: "paystack",
        reference,
        redirectUrl: optionalString(data.authorization_url)
      };
    },
    async verifyPayment(reference) {
      const response = await getJson(fetchFn, `${baseUrl}/transaction/verify/${encodeURIComponent(reference)}`, {
        Authorization: `Bearer ${config.secretKey}`
      });
      const data = getNestedRecord(response, "data");

      return {
        provider: "paystack",
        reference: optionalString(data.reference) ?? reference,
        status: mapPaystackStatus(optionalString(data.status)),
        amountCents: numberValue(data.amount, 0),
        receiptUrl: optionalString(data.receipt_number)
          ? `paystack:${optionalString(data.receipt_number)}`
          : undefined,
        providerPayload: data
      };
    },
    async refundPayment(input) {
      assertNoRawFinancialData(input as unknown as Record<string, unknown>);

      const response = await postJson(
        fetchFn,
        `${baseUrl}/refund`,
        {
          transaction: input.reference,
          amount: input.amountCents,
          merchant_note: input.reason
        },
        {
          Authorization: `Bearer ${config.secretKey}`
        }
      );
      const data = getNestedRecord(response, "data", false);

      return {
        provider: "paystack",
        reference: input.reference,
        status: "refunded",
        refundReference:
          optionalString(data.reference) ?? optionalString(data.id) ?? `paystack-refund:${input.reference}`
      };
    },
    async getReceipt(reference) {
      const verification = await this.verifyPayment(reference);

      return {
        provider: "paystack",
        reference: verification.reference,
        receiptUrl: verification.receiptUrl,
        issuedAt: new Date().toISOString()
      };
    }
  };
}

export function createStripeProvider(config: ProviderConfig): PaymentProvider {
  const fetchFn = config.fetchFn ?? globalThis.fetch.bind(globalThis);
  const baseUrl = config.baseUrl ?? "https://api.stripe.com/v1";

  return {
    id: "stripe",
    async createIntent(input) {
      assertNoRawFinancialData(input as unknown as Record<string, unknown>);

      const response = await postForm(
        fetchFn,
        `${baseUrl}/checkout/sessions`,
        {
          mode: "payment",
          currency: input.currency.toLowerCase(),
          success_url: input.returnUrl,
          cancel_url: input.returnUrl,
          customer_email: input.customerEmail ?? DEFAULT_CUSTOMER_EMAIL,
          "metadata[userId]": input.userId,
          "metadata[tripId]": input.tripId,
          "metadata[paymentMethod]": input.paymentMethod,
          "line_items[0][quantity]": "1",
          "line_items[0][price_data][currency]": input.currency.toLowerCase(),
          "line_items[0][price_data][unit_amount]": String(input.amountCents),
          "line_items[0][price_data][product_data][name]": "Batho Travels savings contribution"
        },
        {
          Authorization: `Bearer ${config.secretKey}`
        }
      );

      return {
        provider: "stripe",
        reference: stringValue(response.id, "Stripe did not return a checkout session id."),
        redirectUrl: optionalString(response.url),
        clientSecret: optionalString(response.client_secret)
      };
    },
    async verifyPayment(reference) {
      const response = await getJson(fetchFn, `${baseUrl}/checkout/sessions/${encodeURIComponent(reference)}`, {
        Authorization: `Bearer ${config.secretKey}`
      });

      return {
        provider: "stripe",
        reference: optionalString(response.id) ?? reference,
        status: mapStripeStatus(optionalString(response.payment_status), optionalString(response.status)),
        amountCents: numberValue(response.amount_total, 0),
        receiptUrl: optionalString(response.receipt_url),
        providerPayload: response
      };
    },
    async refundPayment(input) {
      assertNoRawFinancialData(input as unknown as Record<string, unknown>);

      const response = await postForm(
        fetchFn,
        `${baseUrl}/refunds`,
        {
          payment_intent: input.reference,
          amount: String(input.amountCents),
          "metadata[reason]": input.reason
        },
        {
          Authorization: `Bearer ${config.secretKey}`
        }
      );

      return {
        provider: "stripe",
        reference: input.reference,
        status: "refunded",
        refundReference: optionalString(response.id) ?? `stripe-refund:${input.reference}`
      };
    },
    async getReceipt(reference) {
      const verification = await this.verifyPayment(reference);

      return {
        provider: "stripe",
        reference: verification.reference,
        receiptUrl: verification.receiptUrl,
        issuedAt: new Date().toISOString()
      };
    }
  };
}

export function createOzowProvider(config: ProviderConfig): PaymentProvider {
  const fetchFn = config.fetchFn ?? globalThis.fetch.bind(globalThis);
  const baseUrl = config.baseUrl ?? "https://api.ozow.com";

  return {
    id: "ozow",
    async createIntent(input) {
      assertNoRawFinancialData(input as unknown as Record<string, unknown>);

      const response = await postJson(
        fetchFn,
        `${baseUrl}/paymentrequests`,
        {
          amount: input.amountCents,
          currency: input.currency,
          returnUrl: input.returnUrl,
          customerEmail: input.customerEmail ?? DEFAULT_CUSTOMER_EMAIL,
          metadata: {
            userId: input.userId,
            tripId: input.tripId,
            paymentMethod: input.paymentMethod
          }
        },
        {
          Authorization: `Bearer ${config.secretKey}`
        }
      );
      const data = getNestedRecord(response, "data", false);

      return {
        provider: "ozow",
        reference:
          optionalString(data.paymentRequestId) ??
          optionalString(data.reference) ??
          stringValue(response.paymentRequestId, "Ozow did not return a payment request id."),
        redirectUrl: optionalString(data.url) ?? optionalString(response.url)
      };
    },
    async verifyPayment(reference) {
      const response = await getJson(fetchFn, `${baseUrl}/paymentrequests/${encodeURIComponent(reference)}`, {
        Authorization: `Bearer ${config.secretKey}`
      });
      const data = getNestedRecord(response, "data", false);

      return {
        provider: "ozow",
        reference: optionalString(data.paymentRequestId) ?? optionalString(data.reference) ?? reference,
        status: mapOzowStatus(optionalString(data.status) ?? optionalString(response.status)),
        amountCents: numberValue(data.amount ?? response.amount, 0),
        receiptUrl: optionalString(data.receiptUrl) ?? optionalString(response.receiptUrl),
        providerPayload: response
      };
    },
    async refundPayment(input) {
      assertNoRawFinancialData(input as unknown as Record<string, unknown>);

      const response = await postJson(
        fetchFn,
        `${baseUrl}/refunds`,
        {
          paymentRequestId: input.reference,
          amount: input.amountCents,
          reason: input.reason
        },
        {
          Authorization: `Bearer ${config.secretKey}`
        }
      );
      const data = getNestedRecord(response, "data", false);

      return {
        provider: "ozow",
        reference: input.reference,
        status: "refunded",
        refundReference:
          optionalString(data.refundId) ?? optionalString(response.refundId) ?? `ozow-refund:${input.reference}`
      };
    },
    async getReceipt(reference) {
      const verification = await this.verifyPayment(reference);

      return {
        provider: "ozow",
        reference: verification.reference,
        receiptUrl: verification.receiptUrl,
        issuedAt: new Date().toISOString()
      };
    }
  };
}

export function assertNoRawFinancialData(payload: Record<string, unknown>): void {
  const forbiddenKeys = ["cardNumber", "cvv", "bankAccountNumber", "accountNumber"];
  const queue: Record<string, unknown>[] = [payload];

  while (queue.length > 0) {
    const current = queue.shift() as Record<string, unknown>;
    const matched = forbiddenKeys.find((key) => key in current);

    if (matched) {
      throw new Error(`Raw financial data is not allowed: ${matched}`);
    }

    for (const value of Object.values(current)) {
      if (isRecord(value)) {
        queue.push(value);
      }
      if (Array.isArray(value)) {
        queue.push(...value.filter(isRecord));
      }
    }
  }
}

async function getJson(
  fetchFn: FetchLike,
  url: string,
  headers: Record<string, string>
): Promise<Record<string, unknown>> {
  const response = await fetchFn(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...headers
    }
  });

  return readJsonResponse(response, url);
}

async function postJson(
  fetchFn: FetchLike,
  url: string,
  payload: Record<string, unknown>,
  headers: Record<string, string>
): Promise<Record<string, unknown>> {
  assertNoRawFinancialData(payload);
  const response = await fetchFn(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...headers
    },
    body: JSON.stringify(payload)
  });

  return readJsonResponse(response, url);
}

async function postForm(
  fetchFn: FetchLike,
  url: string,
  payload: Record<string, string>,
  headers: Record<string, string>
): Promise<Record<string, unknown>> {
  assertNoRawFinancialData(payload);
  const body = new URLSearchParams(payload);
  const response = await fetchFn(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      ...headers
    },
    body
  });

  return readJsonResponse(response, url);
}

async function readJsonResponse(response: Response, url: string): Promise<Record<string, unknown>> {
  const json = (await response.json()) as unknown;

  if (!response.ok) {
    throw new Error(`Payment provider request failed for ${url}: ${response.status}`);
  }
  if (!isRecord(json)) {
    throw new Error(`Payment provider returned an invalid response for ${url}.`);
  }

  return json;
}

function getNestedRecord(
  payload: Record<string, unknown>,
  key: string,
  requireRecord = true
): Record<string, unknown> {
  const value = payload[key];

  if (isRecord(value)) {
    return value;
  }
  if (requireRecord) {
    throw new Error(`Payment provider response did not include ${key}.`);
  }

  return payload;
}

function mapPaystackStatus(status?: string): PaymentStatus {
  if (status === "success") {
    return "succeeded";
  }
  if (status === "failed" || status === "abandoned") {
    return "failed";
  }

  return "pending";
}

function mapStripeStatus(paymentStatus?: string, sessionStatus?: string): PaymentStatus {
  if (paymentStatus === "paid" || sessionStatus === "complete") {
    return "succeeded";
  }
  if (paymentStatus === "unpaid" && sessionStatus === "expired") {
    return "failed";
  }

  return "pending";
}

function mapOzowStatus(status?: string): PaymentStatus {
  const normalized = status?.toLowerCase();

  if (normalized === "complete" || normalized === "completed" || normalized === "success") {
    return "succeeded";
  }
  if (normalized === "cancelled" || normalized === "failed" || normalized === "error") {
    return "failed";
  }

  return "pending";
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function stringValue(value: unknown, errorMessage: string): string {
  const result = optionalString(value);

  if (!result) {
    throw new Error(errorMessage);
  }

  return result;
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
