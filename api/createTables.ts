import { Handler } from "aws-lambda";
import { Client } from "pg";
import { Resource } from "sst";


//this function is called when the connection string changes on the database
//as such it should really only be called once, but we have protection
//in place if it is called multiple times
export const handler: Handler = async () => {
  const client = new Client({
    database: Resource.Database.database,
    user: Resource.Database.username,
    password: Resource.Database.password,
    host: Resource.Database.host,
    port: Resource.Database.port,
  });

  try {
    await client.connect();

    //the base database is already created.
    //for brevitys sake, only check if the table "user" exists
    const userTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user'
      )
    `);

    if (!userTableResult.rows[0].exists) {
      console.log("Creating and populating default tables");

      await client.query(`
CREATE TABLE IF NOT EXISTS "user" (
  "id" VARCHAR PRIMARY KEY,
  "name" VARCHAR NOT NULL,
  "partner" BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS "medium" (
  "id" VARCHAR PRIMARY KEY,
  "name" VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS "message" (
  "id" VARCHAR PRIMARY KEY,
  "senderID" VARCHAR REFERENCES "user"(id),
  "mediumID" VARCHAR REFERENCES "medium"(id),
  "body" VARCHAR NOT NULL,
  "timestamp" TIMESTAMP not null
);

INSERT INTO "user" (id, name, partner) 
SELECT 'ycD76wW4R2', 'Aaron', true
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE id = 'ycD76wW4R2');

INSERT INTO "user" (id, name, partner)
SELECT 'IoQSaxeVO5', 'Matt', true
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE id = 'IoQSaxeVO5');

INSERT INTO "user" (id, name, partner)
SELECT 'WndZWmGkO4', 'Cesar', true
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE id = 'WndZWmGkO4');

INSERT INTO "user" (id, name, partner)
SELECT 'ENzoNm7g4E', 'Erik', true
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE id = 'ENzoNm7g4E');

INSERT INTO "user" (id, name, partner)
SELECT 'dLKecN3ntd', 'Greg', true
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE id = 'dLKecN3ntd');

INSERT INTO "user" (id, name, partner)
SELECT 'enVvyDlBul', 'Darick', true
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE id = 'enVvyDlBul');

INSERT INTO "user" (id, name, partner)
SELECT '9ogaDuDNFx', 'Alex', true
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE id = '9ogaDuDNFx');

INSERT INTO "user" (id, name, partner)
SELECT '6z7dkeVLNm', 'Dax', false
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE id = '6z7dkeVLNm');

INSERT INTO "user" (id, name, partner)
SELECT '7VoEoJWEwn', 'Nate', false
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE id = '7VoEoJWEwn');

INSERT INTO "medium" (id, name)
SELECT 'G14bSFuNDq', 'Discord'
WHERE NOT EXISTS (SELECT 1 FROM "medium" WHERE id = 'G14bSFuNDq');

INSERT INTO "medium" (id, name)
SELECT 'b7rqt_8w_H', 'Twitter DM'
WHERE NOT EXISTS (SELECT 1 FROM "medium" WHERE id = 'b7rqt_8w_H');

INSERT INTO "medium" (id, name)
SELECT '0HzSMcee_H', 'Tweet reply to unrelated thread'
WHERE NOT EXISTS (SELECT 1 FROM "medium" WHERE id = '0HzSMcee_H');

INSERT INTO "medium" (id, name)
SELECT 'ttx7NCmyac', 'SMS'
WHERE NOT EXISTS (SELECT 1 FROM "medium" WHERE id = 'ttx7NCmyac');
`);
        console.log("Default Tables created and data inserted");
    } else {
      console.log("Default Tables already exist");
    }

    // Create tables
    // Check and create CVR database
    const cvrDbResult = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = '${Resource.Database.database}_cvr'
    `);
    if (cvrDbResult.rowCount === 0) {
      console.log("Creating CVR database");
      await client.query(`CREATE DATABASE ${Resource.Database.database}_cvr`);
      console.log("CVR database created");
    } else {
      console.log("CVR database already exists");
    }

    // Check and create change database
    const changeDbResult = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = '${Resource.Database.database}_change'
    `);
    if (changeDbResult.rowCount === 0) {
      console.log("Creating Change database");
      await client.query(
        `CREATE DATABASE ${Resource.Database.database}_change`
      );
      console.log("Change database created");
    } else {
      console.log("Change database already exists");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Tables created successfully" }),
    };
  } catch (error) {
    console.error("Error creating tables:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to create tables" }),
    };
  } finally {
    await client.end();
  }
};
