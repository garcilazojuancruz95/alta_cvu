const fetch = require("node-fetch").default;

const TOKEN_REFRESH_MARGIN_MS = 60 * 1000;

let complifTokenCache = {
  token: null,
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
