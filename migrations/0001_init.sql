-- Venues table: stores admin-verified venues
CREATE TABLE IF NOT EXISTS venues (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  osm_id      TEXT UNIQUE,          -- Photon OSM ID (nullable if manually added)
  name        TEXT NOT NULL,
  address     TEXT,
  city        TEXT,
  lat         REAL,
  lon         REAL,
  category    TEXT,                  -- restaurant, cafe, library, etc.
  wheelchair  TEXT DEFAULT 'pending', -- yes / no / limited / pending
  ramp        INTEGER DEFAULT 0,     -- 0 = no, 1 = yes
  wide_doors   INTEGER DEFAULT 0,
  accessible_wc INTEGER DEFAULT 0,
  elevator     INTEGER DEFAULT 0,
  parking      INTEGER DEFAULT 0,
  image_url    TEXT,
  description  TEXT,
  verified_by  TEXT,                 -- admin email
  verified_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_venues_name ON venues(name);
CREATE INDEX IF NOT EXISTS idx_venues_osm_id ON venues(osm_id);
CREATE INDEX IF NOT EXISTS idx_venues_wheelchair ON venues(wheelchair);
CREATE INDEX IF NOT EXISTS idx_venues_city ON venues(city);
