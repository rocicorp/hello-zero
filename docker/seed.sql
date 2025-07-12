CREATE TABLE "user" (
  "id" VARCHAR PRIMARY KEY,
  "name" VARCHAR NOT NULL,
  "partner" BOOLEAN NOT NULL,
  "labels" BOOLEAN[] NOT NULL
);

CREATE TABLE "medium" (
  "id" VARCHAR PRIMARY KEY,
  "name" VARCHAR NOT NULL
);

CREATE TABLE "message" (
  "id" VARCHAR PRIMARY KEY,
  "sender_id" VARCHAR REFERENCES "user"(id),
  "medium_id" VARCHAR REFERENCES "medium"(id),
  "body" VARCHAR NOT NULL,
  "timestamp" TIMESTAMP not null
);

INSERT INTO "user" (id, name, partner, labels) VALUES ('ycD76wW4R2', 'Aaron', true, ARRAY[true, false]);
INSERT INTO "user" (id, name, partner, labels) VALUES ('IoQSaxeVO5', 'Matt', true, ARRAY[true, false]);
INSERT INTO "user" (id, name, partner, labels) VALUES ('WndZWmGkO4', 'Cesar', true, ARRAY[true, false]);
INSERT INTO "user" (id, name, partner, labels) VALUES ('ENzoNm7g4E', 'Erik', true, ARRAY[true, false]);
INSERT INTO "user" (id, name, partner, labels) VALUES ('dLKecN3ntd', 'Greg', true, ARRAY[true, false]);
INSERT INTO "user" (id, name, partner, labels) VALUES ('enVvyDlBul', 'Darick', true, ARRAY[true, false]);
INSERT INTO "user" (id, name, partner, labels) VALUES ('9ogaDuDNFx', 'Alex', true, ARRAY[true, false]);
INSERT INTO "user" (id, name, partner, labels) VALUES ('6z7dkeVLNm', 'Dax', false, ARRAY[true, false]);
INSERT INTO "user" (id, name, partner, labels) VALUES ('7VoEoJWEwn', 'Nate', false, ARRAY[true, false]);

INSERT INTO "medium" (id, name) VALUES ('G14bSFuNDq', 'Discord');
INSERT INTO "medium" (id, name) VALUES ('b7rqt_8w_H', 'Twitter DM');
INSERT INTO "medium" (id, name) VALUES ('0HzSMcee_H', 'Tweet reply to unrelated thread');
INSERT INTO "medium" (id, name) VALUES ('ttx7NCmyac', 'SMS');
