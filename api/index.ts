import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { handle } from "hono/vercel";
import { SignJWT, jwtVerify } from "jose";
import { Pool } from "pg";
import { withValidation, ReadonlyJSONValue } from "@rocicorp/zero";
import { PushProcessor } from "@rocicorp/zero/server";
import { zeroNodePg } from "@rocicorp/zero/server/adapters/pg";
import { handleGetQueriesRequest } from "@rocicorp/zero/server";
import { AuthData, schema } from "../src/schema";
import { createMutators } from "../src/mutators";
import { queries, allUsers } from "../src/queries";

export const config = {
  runtime: "edge",
};

const pool = new Pool({
  connectionString: process.env.ZERO_UPSTREAM_DB,
});

const pushProcessor = new PushProcessor(zeroNodePg(schema, pool));

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

app.get("/login", async (c) => {
  const jwtPayload = {
    sub: userIDs[randomInt(userIDs.length)],
    iat: Math.floor(Date.now() / 1000),
  };

  const jwt = await new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30days")
    .sign(new TextEncoder().encode(must(process.env.ZERO_AUTH_SECRET)));

  setCookie(c, "jwt", jwt, {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return c.text("ok");
});

async function getAuthData(request: Request): Promise<AuthData | undefined> {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return undefined;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(must(process.env.ZERO_AUTH_SECRET)),
    );
    return { sub: payload.sub as string | null };
  } catch {
    return undefined;
  }
}


// Get Queries endpoint for synced queries
app.post("/get-queries", async (c) => {
  const authData = await getAuthData(c.req.raw);

  return c.json(
    await handleGetQueriesRequest(
      (name, args) => getQuery(authData, name, args),
      schema,
      c.req.raw,
    ),
  );
});

const validated = Object.fromEntries(
  Object.values(queries).map((q) => [q.queryName, withValidation(q)])
);

function getQuery(
  authData: AuthData | undefined,
  name: string,
  args: readonly ReadonlyJSONValue[],
) {
  const q = validated[name];
  if (!q) {
    throw new Error(`No such query: ${name}`);
  }
  // withValidation returns a function that takes (context, ...args)
  // and returns a Query. We need to return { query: Query }
  return {
    query: q(authData, ...args),
  };
}

// Push endpoint for custom mutators
app.post("/push", async (c) => {
  const authData = await getAuthData(c.req.raw);

  const result = await pushProcessor.process(
    createMutators(authData),
    c.req.raw,
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
