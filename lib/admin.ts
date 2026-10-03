import "server-only";
import { fail, getCaller, type Caller } from "./auth";

/** Returns the admin caller, or a Response to send back when the caller isn't one. */
export async function requireAdmin(req: Request): Promise<Caller | Response> {
  const caller = await getCaller(req);
  if (!caller) return fail(401, "Connect your wallet first.");
  if (!caller.isAdmin) return fail(403, "This wallet isn't on the admin list.");
  return caller;
}
