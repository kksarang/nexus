export const moduleIds = ["customers", "gaming", "members", "history", "revenue", "loyalty", "reports"] as const;

export type ModuleId = (typeof moduleIds)[number];
export type Level = "none" | "view" | "edit";
export type AccessMap = Record<ModuleId, Level>;

export const moduleInfo: { id: ModuleId; label: string; detail: string }[] = [
  { id: "customers", label: "Customers", detail: "Players list. View only, or also add and edit." },
  { id: "gaming", label: "Gaming", detail: "Start a session, live sessions, and consoles. View only, or also run the timers." },
  { id: "members", label: "Monthly members", detail: "Membership list. View only, or also add and change memberships." },
  { id: "history", label: "Session history", detail: "Past sessions." },
  { id: "revenue", label: "Revenue", detail: "Daily and monthly revenue. Leave this off for counter staff." },
  { id: "loyalty", label: "Loyalty and rewards", detail: "Points and free-session rewards." },
  { id: "reports", label: "Reports and analytics", detail: "Charts and downloads." },
];

const STAFF_EMAIL_DOMAIN = "@staff.nexusplayzone.com";

export function emptyAccess(): AccessMap {
  return { customers: "none", gaming: "none", members: "none", history: "none", revenue: "none", loyalty: "none", reports: "none" };
}

export function officeDefaults(): AccessMap {
  return { ...emptyAccess(), customers: "view", gaming: "edit" };
}

export function fullAccess(): AccessMap {
  return { customers: "edit", gaming: "edit", members: "edit", history: "edit", revenue: "edit", loyalty: "edit", reports: "edit" };
}

export function parseAccess(role: string, raw: unknown): AccessMap {
  if (role !== "office") return fullAccess();
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const next = emptyAccess();
  for (const id of moduleIds) {
    const value = data[id];
    next[id] = value === "view" || value === "edit" ? value : "none";
  }
  return next;
}

export function sees(access: AccessMap, id: ModuleId) {
  return access[id] !== "none";
}

export function edits(access: AccessMap, id: ModuleId) {
  return access[id] === "edit";
}

const pages: { prefix: string; module: ModuleId | "admin" }[] = [
  { prefix: "/admin/players", module: "customers" },
  { prefix: "/admin/room", module: "gaming" },
  { prefix: "/admin/sessions", module: "gaming" },
  { prefix: "/admin/stations", module: "gaming" },
  { prefix: "/admin/members", module: "members" },
  { prefix: "/admin/history", module: "history" },
  { prefix: "/admin/revenue", module: "revenue" },
  { prefix: "/admin/loyalty", module: "loyalty" },
  { prefix: "/admin/rewards", module: "loyalty" },
  { prefix: "/admin/analytics", module: "reports" },
  { prefix: "/admin/reports", module: "reports" },
  { prefix: "/admin/staff", module: "admin" },
  { prefix: "/admin/settings", module: "admin" },
];

export function homeFor(admin: boolean, access: AccessMap) {
  if (admin) return "/admin";
  const order: { id: ModuleId; href: string }[] = [
    { id: "gaming", href: "/admin/room" },
    { id: "customers", href: "/admin/players" },
    { id: "members", href: "/admin/members" },
    { id: "history", href: "/admin/history" },
    { id: "loyalty", href: "/admin/loyalty" },
    { id: "reports", href: "/admin/analytics" },
  ];
  return order.find((item) => sees(access, item.id))?.href ?? "/admin/room";
}

export function pathAllowed(pathname: string, admin: boolean, access: AccessMap) {
  if (pathname === "/admin/login") return true;
  if (pathname === "/admin") return admin;
  if (admin) return true;
  const hit = pages.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
  if (!hit || hit.module === "admin") return false;
  return sees(access, hit.module);
}

export function loginEmail(value: string) {
  const clean = value.trim().toLowerCase();
  if (!clean) throw new Error("Enter a username or email.");
  if (clean.includes("@")) {
    const [name, domain] = clean.split("@");
    if (!name || !domain || !domain.includes(".")) throw new Error("Enter a valid email, or a username without @.");
    return clean;
  }
  if (!/^[a-z0-9._-]{3,30}$/.test(clean)) throw new Error("Use 3 to 30 letters or numbers for the username.");
  return `${clean}${STAFF_EMAIL_DOMAIN}`;
}

export function displayLogin(email: string, username: string) {
  if (username) return username;
  if (email.endsWith(STAFF_EMAIL_DOMAIN)) return email.slice(0, -STAFF_EMAIL_DOMAIN.length);
  return email;
}
