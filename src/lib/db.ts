import type { D1Database } from "@cloudflare/workers-types";

export interface Venue {
  id: number;
  osm_id: string | null;
  name: string;
  address: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
  category: string | null;
  wheelchair: string;
  ramp: number;
  wide_doors: number;
  accessible_wc: number;
  elevator: number;
  parking: number;
  image_url: string | null;
  description: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function listVenues(db: D1Database, limit = 100, offset = 0): Promise<Venue[]> {
  const { results } = await db
    .prepare("SELECT * FROM venues ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .bind(limit, offset)
    .all<Venue>();
  return results ?? [];
}

export async function getVenueById(db: D1Database, id: number): Promise<Venue | null> {
  const row = await db
    .prepare("SELECT * FROM venues WHERE id = ?")
    .bind(id)
    .first<Venue>();
  return row ?? null;
}

export async function getVenueByOsmId(db: D1Database, osmId: string): Promise<Venue | null> {
  const row = await db
    .prepare("SELECT * FROM venues WHERE osm_id = ?")
    .bind(osmId)
    .first<Venue>();
  return row ?? null;
}

export async function searchVenues(db: D1Database, q: string, limit = 20): Promise<Venue[]> {
  const pattern = `%${q}%`;
  const { results } = await db
    .prepare("SELECT * FROM venues WHERE name LIKE ? OR address LIKE ? OR city LIKE ? ORDER BY name LIMIT ?")
    .bind(pattern, pattern, pattern, limit)
    .all<Venue>();
  return results ?? [];
}

export async function createVenue(db: D1Database, data: Omit<Venue, "id" | "created_at" | "updated_at">): Promise<number> {
  const result = await db
    .prepare(`
      INSERT INTO venues
        (osm_id, name, address, city, lat, lon, category, wheelchair, ramp, wide_doors, accessible_wc, elevator, parking, image_url, description, verified_by)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      data.osm_id ?? null,
      data.name,
      data.address ?? null,
      data.city ?? null,
      data.lat ?? null,
      data.lon ?? null,
      data.category ?? null,
      data.wheelchair ?? "pending",
      data.ramp ?? 0,
      data.wide_doors ?? 0,
      data.accessible_wc ?? 0,
      data.elevator ?? 0,
      data.parking ?? 0,
      data.image_url ?? null,
      data.description ?? null,
      data.verified_by ?? null
    )
    .run();
  return result.meta.last_row_id ?? 0;
}

export async function updateVenue(db: D1Database, id: number, data: Partial<Venue>): Promise<void> {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.osm_id !== undefined) { fields.push("osm_id = ?"); values.push(data.osm_id); }
  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
  if (data.address !== undefined) { fields.push("address = ?"); values.push(data.address); }
  if (data.city !== undefined) { fields.push("city = ?"); values.push(data.city); }
  if (data.lat !== undefined) { fields.push("lat = ?"); values.push(data.lat); }
  if (data.lon !== undefined) { fields.push("lon = ?"); values.push(data.lon); }
  if (data.category !== undefined) { fields.push("category = ?"); values.push(data.category); }
  if (data.wheelchair !== undefined) { fields.push("wheelchair = ?"); values.push(data.wheelchair); }
  if (data.ramp !== undefined) { fields.push("ramp = ?"); values.push(data.ramp); }
  if (data.wide_doors !== undefined) { fields.push("wide_doors = ?"); values.push(data.wide_doors); }
  if (data.accessible_wc !== undefined) { fields.push("accessible_wc = ?"); values.push(data.accessible_wc); }
  if (data.elevator !== undefined) { fields.push("elevator = ?"); values.push(data.elevator); }
  if (data.parking !== undefined) { fields.push("parking = ?"); values.push(data.parking); }
  if (data.image_url !== undefined) { fields.push("image_url = ?"); values.push(data.image_url); }
  if (data.description !== undefined) { fields.push("description = ?"); values.push(data.description); }
  if (data.verified_by !== undefined) { fields.push("verified_by = ?"); values.push(data.verified_by); }

  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);

  await db
    .prepare(`UPDATE venues SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
}

export async function deleteVenue(db: D1Database, id: number): Promise<void> {
  await db.prepare("DELETE FROM venues WHERE id = ?").bind(id).run();
}
