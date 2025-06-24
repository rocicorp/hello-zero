CREATE TABLE "user" (
  "id" VARCHAR PRIMARY KEY,
  "name" VARCHAR NOT NULL,
  "partner" BOOLEAN NOT NULL
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
  "labels" VARCHAR[] NOT NULL,
  "timestamp" TIMESTAMP not null
);

INSERT INTO "user" (id, name, partner) VALUES ('ycD76wW4R2', 'Aaron', true);
INSERT INTO "user" (id, name, partner) VALUES ('IoQSaxeVO5', 'Matt', true);
INSERT INTO "user" (id, name, partner) VALUES ('WndZWmGkO4', 'Cesar', true);
INSERT INTO "user" (id, name, partner) VALUES ('ENzoNm7g4E', 'Erik', true);
INSERT INTO "user" (id, name, partner) VALUES ('dLKecN3ntd', 'Greg', true);
INSERT INTO "user" (id, name, partner) VALUES ('enVvyDlBul', 'Darick', true);
INSERT INTO "user" (id, name, partner) VALUES ('9ogaDuDNFx', 'Alex', true);
INSERT INTO "user" (id, name, partner) VALUES ('6z7dkeVLNm', 'Dax', false);
INSERT INTO "user" (id, name, partner) VALUES ('7VoEoJWEwn', 'Nate', false);

INSERT INTO "medium" (id, name) VALUES ('G14bSFuNDq', 'Discord');
INSERT INTO "medium" (id, name) VALUES ('b7rqt_8w_H', 'Twitter DM');
INSERT INTO "medium" (id, name) VALUES ('0HzSMcee_H', 'Tweet reply to unrelated thread');
INSERT INTO "medium" (id, name) VALUES ('ttx7NCmyac', 'SMS');
