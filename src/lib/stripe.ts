import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-08-26.dahlia",
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
