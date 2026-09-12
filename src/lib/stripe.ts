import Stripe from "stripe";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-08-26.dahlia",
  });
}

let _stripe: Stripe | null = null;
export function getStripeClient() {
  if (!_stripe) _stripe = getStripe();
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripeClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const PLANS = {
  individual: {
    name: "Individual",
    monthlyPrice: 1000,
    lookup: "individual_monthly",
  },
  organization: {
    name: "Organization",
    monthlyPrice: 5000,
    lookup: "org_monthly",
  },
} as const;

export type PlanId = keyof typeof PLANS;

export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name: string
): Promise<string> {
  const { query, exec } = await import("@/lib/db");

  const rows = await query<{ stripe_customer_id: string }>(
    "SELECT stripe_customer_id FROM users WHERE id = $1",
    [userId]
  );
  if (rows[0]?.stripe_customer_id) return rows[0].stripe_customer_id;

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  });

  await exec("UPDATE users SET stripe_customer_id = $1 WHERE id = $2", [
    customer.id,
    userId,
  ]);

  return customer.id;
}
