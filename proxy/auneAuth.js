async function getAuneToken() {
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
  console.log("Token obtenido de Aune");

  return data.token; // después ajustamos esto si el campo es distinto
}

module.exports = { getAuneToken };