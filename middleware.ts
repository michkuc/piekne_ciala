import {next} from "@vercel/functions";
import {validSession} from "./lib/access-session";

export const config = {runtime:"nodejs", matcher:"/:path*"};
const publicPaths = new Set(["/login", "/login.html", "/api/access", "/assets/login.js", "/assets/styles.css", "/assets/site/age-gate-40.webp", "/favicon.svg"]);
export default function middleware(request: Request) {
  const url = new URL(request.url);
  if (publicPaths.has(url.pathname)) return next();
  if (validSession(request.headers.get("cookie") || "")) {
    return next({headers:{"Cache-Control":"private, no-store", "Vary":"Cookie"}});
  }
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/media/") || url.pathname.startsWith("/assets/")) {
    return new Response("Unauthorized", {status:401, headers:{"Cache-Control":"private, no-store"}});
  }
  const login = new URL("/login", url.origin);
  login.searchParams.set("next", url.pathname + url.search + url.hash);
  return new Response(null, {status:302, headers:{"Location":login.toString(), "Cache-Control":"private, no-store"}});
}
