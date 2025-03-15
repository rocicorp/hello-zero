CREATE TABLE "color" (
  "value" TEXT PRIMARY KEY,
  "lock" BOOL NOT NULL DEFAULT TRUE CHECK (lock),
  UNIQUE (lock)
);

INSERT INTO "color" (value) VALUES ('red');
