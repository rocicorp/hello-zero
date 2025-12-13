import { Hono } from "hono";
import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { handle } from "hono/vercel";
import { SignJWT, jwtVerify } from "jose";
import { Pool } from "pg";
import { mustGetMutator, mustGetQuery } from "@rocicorp/zero";
import { handleMutateRequest, handleQueryRequest } from "@rocicorp/zero/server";
import { zeroNodePg } from "@rocicorp/zero/server/adapters/pg";
import { mutators } from "../src/mutators";
import { queries } from "../src/queries";
import { schema, type AuthData } from "../src/schema";

export const config = {
  runtime: "nodejs",
};

export const app = new Hono().basePath("/api");

// See seed.sql
// In real life you would of course authenticate the user however you like.
const userIDs = [
  "6z7dkeVLNm",
  "ycD76wW4R2",
  "IoQSaxeVO5",
  "WndZWmGkO4",
  "ENzoNm7g4E",
  "dLKecN3ntd",
  "7VoEoJWEwn",
  "enVvyDlBul",
  "9ogaDuDNFx",
];

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

const authSecret = new TextEncoder().encode(must(process.env.AUTH_SECRET));
const pool = new Pool({
  connectionString: must(process.env.ZERO_UPSTREAM_DB),
});
const dbProvider = zeroNodePg(schema, pool);

const getContext = async (c: Context): Promise<AuthData> => {
  const token = getCookie(c, "jwt");
  if (!token) {
    return { userID: null };
  }

  try {
    const verified = await jwtVerify(token, authSecret);
    const sub = verified.payload.sub;
    return { userID: typeof sub === "string" ? sub : null };
  } catch {
    return { userID: null };
  }
};

app.get("/login", async (c) => {
  const jwtPayload = {
    sub: userIDs[randomInt(userIDs.length)],
    iat: Math.floor(Date.now() / 1000),
  };

  const jwt = await new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30days")
    .sign(new TextEncoder().encode(must(process.env.AUTH_SECRET)));

  setCookie(c, "jwt", jwt, {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return c.text("ok");
});

app.post("/zero/query", async (c) => {
  const ctx = await getContext(c);
  const result = await handleQueryRequest(
    (name, args) => mustGetQuery(queries, name).fn({ args, ctx }),
    schema,
    c.req.raw
  );
  return c.json(result);
});

app.post("/zero/mutate", async (c) => {
  const ctx = await getContext(c);
  const result = await handleMutateRequest(
    dbProvider,
    (transact) =>
      transact((tx, name, args) =>
        mustGetMutator(mutators, name).fn({ tx, args, ctx })
      ),
    c.req.raw
  );
  return c.json(result);
});

export default handle(app);

function must<T>(val: T) {
  if (!val) {
    throw new Error("Expected value to be defined");
  }
  return val;
}
