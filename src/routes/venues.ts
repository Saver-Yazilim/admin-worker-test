import { Router, IRequest } from "itty-router";
import { corsResponse, getAllowedOrigin } from "@/constants/cors";
import {
  listVenues,
  getVenueById,
  getVenueByOsmId,
  searchVenues,
  createVenue,
  updateVenue,
  deleteVenue,
} from "@/lib/db";
import type { D1Database } from "@cloudflare/workers-types";

interface Env {
  DB: D1Database;
}

const router = Router<IRequest, [Env]>();

// ── Helpers ──

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function withCors(request: Request, response: Response): Response {
  const origin = getAllowedOrigin(request);
  if (!origin) return response;
  return corsResponse(response, origin);
}

// ── Routes ──

// GET /venues — list all
router.get("/venues", async (request, env: Env) => {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "100", 10);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
  const q = url.searchParams.get("q");

  try {
    const venues = q
      ? await searchVenues(env.DB, q, limit)
      : await listVenues(env.DB, limit, offset);
    return withCors(request, json({ venues }));
  } catch (e) {
    return withCors(request, json({ error: String(e) }, 500));
  }
});

// GET /venues/:id — get one
router.get("/venues/:id", async (request, env: Env) => {
  const id = parseInt(request.params?.id ?? "0", 10);
  if (!id) return withCors(request, json({ error: "Invalid ID" }, 400));

  try {
    const venue = await getVenueById(env.DB, id);
    if (!venue) return withCors(request, json({ error: "Not found" }, 404));
    return withCors(request, json({ venue }));
  } catch (e) {
    return withCors(request, json({ error: String(e) }, 500));
  }
});

// GET /venues/osm/:osmId — get by OSM ID
router.get("/venues/osm/:osmId", async (request, env: Env) => {
  const osmId = request.params?.osmId;
  if (!osmId) return withCors(request, json({ error: "Missing OSM ID" }, 400));

  try {
    const venue = await getVenueByOsmId(env.DB, osmId);
    if (!venue) return withCors(request, json({ error: "Not found" }, 404));
    return withCors(request, json({ venue }));
  } catch (e) {
    return withCors(request, json({ error: String(e) }, 500));
  }
});

// POST /venues — create
router.post("/venues", async (request, env: Env) => {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (!body.name || typeof body.name !== "string") {
      return withCors(request, json({ error: "name is required" }, 400));
    }

    const id = await createVenue(env.DB, {
      osm_id: body.osm_id ? String(body.osm_id) : null,
      name: body.name,
      address: body.address ? String(body.address) : null,
      city: body.city ? String(body.city) : null,
      lat: body.lat ? Number(body.lat) : null,
      lon: body.lon ? Number(body.lon) : null,
      category: body.category ? String(body.category) : null,
      wheelchair: body.wheelchair ? String(body.wheelchair) : "pending",
      ramp: body.ramp ? 1 : 0,
      wide_doors: body.wide_doors ? 1 : 0,
      accessible_wc: body.accessible_wc ? 1 : 0,
      elevator: body.elevator ? 1 : 0,
      parking: body.parking ? 1 : 0,
      image_url: body.image_url ? String(body.image_url) : null,
      description: body.description ? String(body.description) : null,
      verified_by: body.verified_by ? String(body.verified_by) : null,
    });

    return withCors(request, json({ id, message: "Venue created" }, 201));
  } catch (e) {
    return withCors(request, json({ error: String(e) }, 500));
  }
});

// PUT /venues/:id — update
router.put("/venues/:id", async (request, env: Env) => {
  const id = parseInt(request.params?.id ?? "0", 10);
  if (!id) return withCors(request, json({ error: "Invalid ID" }, 400));

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const updateData: Record<string, unknown> = {};

    if (body.osm_id !== undefined) updateData.osm_id = body.osm_id ? String(body.osm_id) : null;
    if (body.name !== undefined) updateData.name = String(body.name);
    if (body.address !== undefined) updateData.address = String(body.address);
    if (body.city !== undefined) updateData.city = String(body.city);
    if (body.lat !== undefined) updateData.lat = Number(body.lat);
    if (body.lon !== undefined) updateData.lon = Number(body.lon);
    if (body.category !== undefined) updateData.category = String(body.category);
    if (body.wheelchair !== undefined) updateData.wheelchair = String(body.wheelchair);
    if (body.ramp !== undefined) updateData.ramp = body.ramp ? 1 : 0;
    if (body.wide_doors !== undefined) updateData.wide_doors = body.wide_doors ? 1 : 0;
    if (body.accessible_wc !== undefined) updateData.accessible_wc = body.accessible_wc ? 1 : 0;
    if (body.elevator !== undefined) updateData.elevator = body.elevator ? 1 : 0;
    if (body.parking !== undefined) updateData.parking = body.parking ? 1 : 0;
    if (body.image_url !== undefined) updateData.image_url = String(body.image_url);
    if (body.description !== undefined) updateData.description = String(body.description);
    if (body.verified_by !== undefined) updateData.verified_by = String(body.verified_by);

    await updateVenue(env.DB, id, updateData);
    return withCors(request, json({ message: "Venue updated" }));
  } catch (e) {
    return withCors(request, json({ error: String(e) }, 500));
  }
});

// DELETE /venues/:id
router.delete("/venues/:id", async (request, env: Env) => {
  const id = parseInt(request.params?.id ?? "0", 10);
  if (!id) return withCors(request, json({ error: "Invalid ID" }, 400));

  try {
    await deleteVenue(env.DB, id);
    return withCors(request, json({ message: "Venue deleted" }));
  } catch (e) {
    return withCors(request, json({ error: String(e) }, 500));
  }
});

export default router;
