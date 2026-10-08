import { cookies } from "next/headers";
import { query, queryOne } from "@/lib/db";

export interface OrgMembership {
  orgId: string;
  orgName: string;
  orgType: "organization" | "institution";
  role: "admin" | "mosque_admin" | "khatib";
  mosqueId: string | null;
  mosqueName: string | null;
  status: string;
}

export interface OrgContext {
  orgId: string;
  orgName: string;
  orgType: "organization" | "institution";
  role: "admin" | "mosque_admin" | "khatib";
  mosqueId: string | null;
  mosqueName: string | null;
}

const COOKIE_NAME = "org_context";

export async function getOrgContext(userId: string): Promise<OrgContext | null> {
  const cookieStore = await cookies();
  const contextOrgId = cookieStore.get(COOKIE_NAME)?.value;

  if (!contextOrgId || contextOrgId === "personal") return null;

  const membership = await queryOne<{
    organization_id: string;
    org_name: string;
    org_type: string;
    role: string;
    mosque_id: string | null;
    mosque_name: string | null;
  }>(
    `SELECT om.organization_id, o.name as org_name, o.type as org_type,
            om.role, om.mosque_id, m.name as mosque_name
     FROM org_members om
     JOIN organizations o ON o.id = om.organization_id
     LEFT JOIN mosques m ON m.id = om.mosque_id
     WHERE om.user_id = $1 AND om.organization_id = $2 AND om.status = 'active'`,
    [userId, contextOrgId]
  );

  if (!membership) {
    // Fall back to users.organization_id for backwards compat
    const user = await queryOne<{ organization_id: string | null }>(
      "SELECT organization_id FROM users WHERE id = $1",
      [userId]
    );
    if (user?.organization_id && user.organization_id === contextOrgId) {
      const org = await queryOne<{ name: string; type: string }>(
        "SELECT name, type FROM organizations WHERE id = $1",
        [contextOrgId]
      );
      if (org) {
        return {
          orgId: contextOrgId,
          orgName: org.name,
          orgType: org.type as "organization" | "institution",
          role: "khatib",
          mosqueId: null,
          mosqueName: null,
        };
      }
    }
    return null;
  }

  return {
    orgId: membership.organization_id,
    orgName: membership.org_name,
    orgType: membership.org_type as "organization" | "institution",
    role: membership.role as "admin" | "mosque_admin" | "khatib",
    mosqueId: membership.mosque_id,
    mosqueName: membership.mosque_name,
  };
}

export async function getUserMemberships(userId: string): Promise<OrgMembership[]> {
  const rows = await query<{
    organization_id: string;
    org_name: string;
    org_type: string;
    role: string;
    mosque_id: string | null;
    mosque_name: string | null;
    status: string;
  }>(
    `SELECT om.organization_id, o.name as org_name, o.type as org_type,
            om.role, om.mosque_id, m.name as mosque_name, om.status
     FROM org_members om
     JOIN organizations o ON o.id = om.organization_id
     LEFT JOIN mosques m ON m.id = om.mosque_id
     WHERE om.user_id = $1 AND om.status = 'active'
     ORDER BY om.role ASC, o.name ASC`,
    [userId]
  );

  return rows.map((r) => ({
    orgId: r.organization_id,
    orgName: r.org_name,
    orgType: r.org_type as "organization" | "institution",
    role: r.role as "admin" | "mosque_admin" | "khatib",
    mosqueId: r.mosque_id,
    mosqueName: r.mosque_name,
    status: r.status,
  }));
}

export async function requireOrgContext(userId: string, requiredRoles?: string[]): Promise<OrgContext> {
  let ctx = await getOrgContext(userId);

  // Backwards compat: if no cookie set, fall back to users.organization_id
  if (!ctx) {
    const user = await queryOne<{ organization_id: string | null; role: string }>(
      "SELECT organization_id, role FROM users WHERE id = $1",
      [userId]
    );
    if (user?.organization_id) {
      const org = await queryOne<{ name: string; type: string }>(
        "SELECT name, type FROM organizations WHERE id = $1",
        [user.organization_id]
      );
      if (org) {
        const membership = await queryOne<{ role: string; mosque_id: string | null; mosque_name: string | null }>(
          `SELECT om.role, om.mosque_id, m.name as mosque_name
           FROM org_members om
           LEFT JOIN mosques m ON m.id = om.mosque_id
           WHERE om.user_id = $1 AND om.organization_id = $2 AND om.status = 'active'`,
          [userId, user.organization_id]
        );
        ctx = {
          orgId: user.organization_id,
          orgName: org.name,
          orgType: org.type as "organization" | "institution",
          role: (membership?.role || user.role) as "admin" | "mosque_admin" | "khatib",
          mosqueId: membership?.mosque_id || null,
          mosqueName: membership?.mosque_name || null,
        };
      }
    }
  }

  if (!ctx) {
    throw new OrgContextError("No organization selected");
  }
  if (requiredRoles && !requiredRoles.includes(ctx.role)) {
    throw new OrgContextError("Insufficient permissions");
  }
  return ctx;
}

export async function getMosqueIdForAdmin(userId: string, orgId: string): Promise<string | null> {
  const mosque = await queryOne<{ id: string }>(
    "SELECT id FROM mosques WHERE admin_user_id = $1 AND organization_id = $2",
    [userId, orgId]
  );
  return mosque?.id || null;
}

export class OrgContextError extends Error {
  public status = 403;
  constructor(message: string) {
    super(message);
    this.name = "OrgContextError";
  }
}

export function orgContextCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 365,
  };
}
