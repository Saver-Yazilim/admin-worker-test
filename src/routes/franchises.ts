import { Router, IRequest } from "itty-router";
import { corsResponse, getAllowedOrigin } from "@/constants/cors";
import type { D1Database } from "@cloudflare/workers-types";

interface Env {
  DB: D1Database;
}

const router = Router<IRequest, [Env]>();

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

function withCors(request: Request, response: Response): Response {
  const origin = getAllowedOrigin(request);
  if (!origin) return response;
  return corsResponse(response, origin);
}

// GET /franchises — list all franchises
router.get("/franchises", async (request, env: Env) => {
  try {
    const { results } = await env.DB
      .prepare("SELECT * FROM franchises ORDER BY name")
      .all();
    return withCors(request, json({ franchises: results ?? [] }));
  } catch (e) {
    return withCors(request, json({ error: String(e) }, 500));
  }
});

// GET /franchises/:slug — get franchise + its venues
router.get("/franchises/:slug", async (request, env: Env) => {
  const slug = request.params?.slug;
  if (!slug) return withCors(request, json({ error: "Missing slug" }, 400));

  try {
    const franchise = await env.DB
      .prepare("SELECT * FROM franchises WHERE slug = ?")
      .bind(slug)
      .first();

    if (!franchise) return withCors(request, json({ error: "Not found" }, 404));

    const { results: venues } = await env.DB
      .prepare("SELECT * FROM venues WHERE franchise_id = ? ORDER BY name")
      .bind(franchise.id)
      .all();

    return withCors(request, json({ franchise, venues: venues ?? [] }));
  } catch (e) {
    return withCors(request, json({ error: String(e) }, 500));
  }
});

// POST /franchises — create franchise
router.post("/franchises", async (request, env: Env) => {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (!body.name || typeof body.name !== "string") {
      return withCors(request, json({ error: "name is required" }, 400));
    }

    const slug = (body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")) as string;

    const result = await env.DB
      .prepare("INSERT INTO franchises (name, slug, category, logo_url, website, description) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(
        body.name,
        slug,
        body.category ? String(body.category) : null,
        body.logo_url ? String(body.logo_url) : null,
        body.website ? String(body.website) : null,
        body.description ? String(body.description) : null
      )
      .run();

    return withCors(request, json({ id: result.meta.last_row_id, slug, message: "Franchise created" }, 201));
  } catch (e) {
    return withCors(request, json({ error: String(e) }, 500));
  }
});

// POST /franchises/:slug/venues — add venue to franchise
router.post("/franchises/:slug/venues", async (request, env: Env) => {
  const slug = request.params?.slug;
  if (!slug) return withCors(request, json({ error: "Missing slug" }, 400));

  try {
    const body = (await request.json()) as { venue_id?: number };
    if (!body.venue_id) return withCors(request, json({ error: "venue_id required" }, 400));

    const franchise = await env.DB
      .prepare("SELECT id FROM franchises WHERE slug = ?")
      .bind(slug)
      .first<{ id: number }>();

    if (!franchise) return withCors(request, json({ error: "Franchise not found" }, 404));

    await env.DB
      .prepare("UPDATE venues SET franchise_id = ? WHERE id = ?")
      .bind(franchise.id, body.venue_id)
      .run();

    return withCors(request, json({ message: "Venue linked to franchise" }));
  } catch (e) {
    return withCors(request, json({ error: String(e) }, 500));
  }
});

export default router;
