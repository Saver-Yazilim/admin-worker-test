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

// GET /favorites/:userEmail — get user's favorites
router.get("/favorites/:userEmail", async (request, env: Env) => {
  const userEmail = request.params?.userEmail;
  if (!userEmail) return withCors(request, json({ error: "Missing user email" }, 400));

  try {
    // Get favorite venues
    const { results: venueFavorites } = await env.DB
      .prepare(`
        SELECT v.*, f.created_at as favorited_at
        FROM favorites f
        JOIN venues v ON f.venue_id = v.id
        WHERE f.user_email = ? AND f.venue_id IS NOT NULL
        ORDER BY f.created_at DESC
      `)
      .bind(userEmail)
      .all();

    // Get favorite franchises
    const { results: franchiseFavorites } = await env.DB
      .prepare(`
        SELECT fr.*, f.created_at as favorited_at
        FROM favorites f
        JOIN franchises fr ON f.franchise_id = fr.id
        WHERE f.user_email = ? AND f.franchise_id IS NOT NULL
        ORDER BY f.created_at DESC
      `)
      .bind(userEmail)
      .all();

    return withCors(request, json({
      venues: venueFavorites ?? [],
      franchises: franchiseFavorites ?? [],
    }));
  } catch (e) {
    return withCors(request, json({ error: String(e) }, 500));
  }
});

// POST /favorites — add favorite
router.post("/favorites", async (request, env: Env) => {
  try {
    const body = (await request.json()) as { user_email: string; venue_id?: number; franchise_id?: number };

    if (!body.user_email) return withCors(request, json({ error: "user_email required" }, 400));
    if (!body.venue_id && !body.franchise_id) {
      return withCors(request, json({ error: "venue_id or franchise_id required" }, 400));
    }

    await env.DB
      .prepare("INSERT OR IGNORE INTO favorites (user_email, venue_id, franchise_id) VALUES (?, ?, ?)")
      .bind(body.user_email, body.venue_id ?? null, body.franchise_id ?? null)
      .run();

    return withCors(request, json({ message: "Added to favorites" }, 201));
  } catch (e) {
    return withCors(request, json({ error: String(e) }, 500));
  }
});

// DELETE /favorites — remove favorite
router.delete("/favorites", async (request, env: Env) => {
  try {
    const body = (await request.json()) as { user_email: string; venue_id?: number; franchise_id?: number };

    if (!body.user_email) return withCors(request, json({ error: "user_email required" }, 400));

    if (body.venue_id) {
      await env.DB
        .prepare("DELETE FROM favorites WHERE user_email = ? AND venue_id = ?")
        .bind(body.user_email, body.venue_id)
        .run();
    } else if (body.franchise_id) {
      await env.DB
        .prepare("DELETE FROM favorites WHERE user_email = ? AND franchise_id = ?")
        .bind(body.user_email, body.franchise_id)
        .run();
    } else {
      return withCors(request, json({ error: "venue_id or franchise_id required" }, 400));
    }

    return withCors(request, json({ message: "Removed from favorites" }));
  } catch (e) {
    return withCors(request, json({ error: String(e) }, 500));
  }
});

export default router;
