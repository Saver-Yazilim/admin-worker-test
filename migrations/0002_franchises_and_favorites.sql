-- Franchises / chains table
CREATE TABLE IF NOT EXISTS franchises (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,          -- "Starbucks", "McDonald's"
  slug        TEXT NOT NULL UNIQUE,          -- "starbucks", "mcdonalds"
  category    TEXT,                           -- restaurant, cafe, bar, etc.
  logo_url    TEXT,
  website     TEXT,
  description TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Link venues to franchises (a venue can be part of a chain)
ALTER TABLE venues ADD COLUMN franchise_id INTEGER REFERENCES franchises(id);

-- User favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email  TEXT NOT NULL,
  venue_id    INTEGER REFERENCES venues(id) ON DELETE CASCADE,
  franchise_id INTEGER REFERENCES franchises(id) ON DELETE CASCADE,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_email, venue_id),
  UNIQUE(user_email, franchise_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_venues_franchise_id ON venues(franchise_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_email);
CREATE INDEX IF NOT EXISTS idx_favorites_venue ON favorites(venue_id);
CREATE INDEX IF NOT EXISTS idx_favorites_franchise ON favorites(franchise_id);
