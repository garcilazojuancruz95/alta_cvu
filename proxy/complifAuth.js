const fetch = require("node-fetch").default;

async function getComplifToken() {
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

  console.log("Token Complif obtenido");

  return `Bearer ${data.access_token}`; // 👈 ajustar si el campo cambia
}

module.exports = { getComplifToken };