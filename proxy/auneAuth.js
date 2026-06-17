const fetch = require("node-fetch").default;

const TOKEN_REFRESH_MARGIN_MS = 60 * 1000;
const FALLBACK_TOKEN_TTL_MS = 15 * 60 * 1000;

let auneTokenCache = {
  token: "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpZF9jbGllbnRlICxBUElfSkNHYXJjaWxhem8gLDE3MC4yMzguMTI0LjE4OCIsImp0aSI6ImE2ZWY1MTBhLTZiZDUtNDIzOC1hOGJiLTg0NTViYzI3OWU4MCIsImV4cCI6MTc4MTEwMjczMn0.o3QdQ1KLhwTTSr4ppO2DIP_pZMTDR-bv9uBgVsXiCoEEWOUqzflF72OgN9oqBJVwcdBuZ9mjcxZ4AjCS3eMWyQ",
  expiresAt: 0
};

function decodeJwtPayload(token) {
  const parts = token.split(".");

  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = Buffer.from(padded, "base64").toString("utf8");

    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getCachedAuneToken() {
  const now = Date.now();

  if (
    auneTokenCache.token &&
    now < auneTokenCache.expiresAt - TOKEN_REFRESH_MARGIN_MS
  ) {
    return auneTokenCache.token;
  }

  return null;
}

function resolveAuneExpirationMs(data) {
  const jwtPayload = decodeJwtPayload(data.token);

  if (jwtPayload?.exp) {
    return jwtPayload.exp * 1000;
  }

  if (typeof data.expires_in === "number") {
    return Date.now() + data.expires_in * 1000;
  }

  return Date.now() + FALLBACK_TOKEN_TTL_MS;
}

async function getAuneToken() {
  const cachedToken = getCachedAuneToken();

  if (cachedToken) {
    return cachedToken;
  }

  const response = await fetch(`${process.env.AUNE_BASE_URL}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      clientId: process.env.AUNE_CLIENT_ID,
      username: process.env.AUNE_USERNAME,
      password: process.env.AUNE_PASSWORD
    })
  });

  if (!response.ok) {
    throw new Error("Error obteniendo token de Aune");
  }

  const data = await response.json();

  if (!data?.token) {
    throw new Error("La respuesta de Aune no incluyo un token valido");
  }

  auneTokenCache = {
    token: `Bearer ${data.token}`,
    expiresAt: resolveAuneExpirationMs(data)
  };

  console.log("Token de Aune obtenido correctamente");

  return auneTokenCache.token;
}

module.exports = { getAuneToken };
