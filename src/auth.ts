import { jwtVerify } from "jose";
import { AuthData } from "./schema";

export async function getAuthData(token: string | undefined): Promise<AuthData | undefined> {
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

function must<T>(val: T) {
  if (!val) {
    throw new Error("Expected value to be defined");
  }
  return val;
}
