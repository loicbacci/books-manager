import { handlers } from "@/lib/auth";

/**
 * NextAuth route handlers (GET/POST) wired to the shared Auth.js config.
 *
 * This file is intentionally thin: the heavy lifting lives in `@/lib/auth`
 * so API routes and middleware share the same configuration.
 */
export const { GET, POST } = handlers;
