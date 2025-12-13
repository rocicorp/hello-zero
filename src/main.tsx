import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ZeroProvider } from "@rocicorp/zero/react";
import { schema } from "./schema.ts";
import Cookies from "js-cookie";
import { decodeJwt } from "jose";
import { mutators } from "./mutators.ts";

const encodedJWT = Cookies.get("jwt");
const decodedJWT = encodedJWT && decodeJwt(encodedJWT);
const userID = decodedJWT?.sub ? (decodedJWT.sub as string) : null;
const cacheURL = import.meta.env.VITE_PUBLIC_ZERO_CACHE_URL;
const context = { userID };

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ZeroProvider
      {...{ userID: userID ?? "anon", cacheURL, schema, mutators, context }}
    >
      <App />
    </ZeroProvider>
  </StrictMode>
);
