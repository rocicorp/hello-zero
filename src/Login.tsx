import { Zero } from "@rocicorp/zero";
import { useEffect, useMemo, useState } from "react";
import { Schema, schema } from "./schema";
import { ZeroProvider } from "@rocicorp/zero/react";
import Cookies from "js-cookie";
import { decodeJwt } from "jose";
import App from "./App";

function getAuthToken() {
  // We transmit jwt via cookie so that we don't need a roundtrip at startup.
  return Cookies.get("jwt");
}

export default function Login() {
  const [encodedJWT, setEncodedJWT] = useState(getAuthToken());
  const [zero, setZero] = useState<Zero<Schema> | null>(null);

  const userID = useMemo(() => {
    const decodedJWT = encodedJWT && decodeJwt(encodedJWT);
    return decodedJWT?.sub ? (decodedJWT.sub as string) : "anon";
  }, [encodedJWT]);

  useEffect(() => {
    const z = new Zero({
      userID,
      // Zero will call this when auth token is invalid for userID.
      // You can optionally refresh the auth token at this time.
      auth: () => encodedJWT,
      server: import.meta.env.VITE_PUBLIC_SERVER,
      schema,
      kvStore: "idb",
    });

    setZero(z);

    return () => {
      void z?.close();
      setZero(null);
    };
  }, [userID, encodedJWT]);

  const toggleLogin = useMemo(() => {
    return async () => {
      if (userID === "anon") {
        await fetch("/api/login");
      } else {
        Cookies.remove("jwt");
      }
      setEncodedJWT(getAuthToken());
    };
  }, [userID]);

  if (!zero) {
    return null;
  }

  return (
    <ZeroProvider zero={zero}>
      <App toggleLogin={toggleLogin} />
    </ZeroProvider>
  );
}
