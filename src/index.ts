import { Router, type IRequest } from "itty-router";
import { corsResponse, getAllowedOrigin } from "@/constants/cors";
import venueRoutes from "@/routes/venues";
import franchiseRoutes from "@/routes/franchises";
import favoriteRoutes from "@/routes/favorites";
import type { D1Database } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
}

const router = Router<IRequest, [Env]>();

// CORS preflight
router.options("*", (request) => {
  const origin = getAllowedOrigin(request);
  if (!origin) {
    return new Response(null, { status: 403 });
  }
  return corsResponse(new Response(null, { status: 204 }), origin);
});

// Health check
router.get("/", () => {
  return new Response(JSON.stringify({ status: "ok", service: "admin-worker" }), {
    headers: { "Content-Type": "application/json" },
  });
});

// Mount routes
router.all("/venues*", venueRoutes.handle);
router.all("/franchises*", franchiseRoutes.handle);
router.all("/favorites*", favoriteRoutes.handle);

// 404
router.all("*", () => {
  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return router.handle(request, env);
  },
};
