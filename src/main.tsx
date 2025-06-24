import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ZeroProvider } from "@rocicorp/zero/react";
import { schema } from "./schema.ts";
import Cookies from "js-cookie";
import { decodeJwt } from "jose";

const encodedJWT = Cookies.get("jwt");
const decodedJWT = encodedJWT && decodeJwt(encodedJWT);
const userID = decodedJWT?.sub ? (decodedJWT.sub as string) : "anon";
const server = import.meta.env.VITE_PUBLIC_SERVER;
const auth = encodedJWT;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ZeroProvider {...{ userID, auth, server, schema }}>
      <App />
    </ZeroProvider>
  </StrictMode>
);
