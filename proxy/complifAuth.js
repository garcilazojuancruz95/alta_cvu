const fetch = require("node-fetch").default;

const TOKEN_REFRESH_MARGIN_MS = 60 * 1000;

let complifTokenCache = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiAiYXV0aGVudGljYXRlZCIsICJleHAiOiAxNzgxNjIwOTg1LCAiaWF0IjogMTc4MTAxNjE4NCwgInN1YiI6ICI1NDI2YmY2Ny1lZmNiLTQ5ZTktODVlYS0xYzEyYmM1NjY1NjciLCAicm9sZSI6ICJhdXRoZW50aWNhdGVkIiwgInVzZXJfdHlwZSI6ICJhcHBsaWNhdGlvbiIsICJhcHBfbWV0YWRhdGEiOiB7InByb3ZpZGVyIjogImNsaWVudF9jcmVkZW50aWFscyIsICJwcm92aWRlcnMiOiBbImNsaWVudF9jcmVkZW50aWFscyJdLCAib3JnYW5pemF0aW9ucyI6IFsiTkFTSU5JIl0sICJpZF9vcmdhbml6YXRpb24iOiAiTkFTSU5JIiwgImlkX2V4dGVybmFsX29yZ2FuaXphdGlvbiI6IG51bGx9fQ.8f-gVbdS7HX4YHTMiWtYucktVmEq9Tk_QeYk3mdljuU",
  expiresAt: 0
};

function decodeJwtPayload(token) {
  const parts = token.split(".");

  if (parts.length < 2) {
    throw new Error("Token JWT invalido");
  }

  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const json = Buffer.from(padded, "base64").toString("utf8");

  return JSON.parse(json);
}

function getCachedComplifToken() {
  const now = Date.now();

  if (
    complifTokenCache.token &&
    now < complifTokenCache.expiresAt - TOKEN_REFRESH_MARGIN_MS
  ) {
    return complifTokenCache.token;
  }

  return null;
}

async function getComplifToken() {
  const cachedToken = getCachedComplifToken();

  if (cachedToken) {
    return cachedToken;
  }

  const response = await fetch(
    `${process.env.COMPLIF_BASE_URL}/api/auth/v1/oauth/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: process.env.COMPLIF_CLIENT_ID,
        client_secret: process.env.COMPLIF_CLIENT_SECRET
      })
    }
  );

  if (!response.ok) {
    throw new Error("Error obteniendo token de Complif");
  }

  const data = await response.json();

  if (!data?.access_token) {
    throw new Error("La respuesta de Complif no incluyo un token valido");
  }

  const payload = decodeJwtPayload(data.access_token);

  if (!payload?.exp) {
    throw new Error("El token de Complif no incluye expiracion");
  }

  complifTokenCache = {
    token: `Bearer ${data.access_token}`,
    expiresAt: payload.exp * 1000
  };

  console.log("Token de Complif obtenido correctamente");

  return complifTokenCache.token;
}

module.exports = { getComplifToken };
