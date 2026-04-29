/* =========================================================
   1) DEPENDENCIAS
========================================================= */
const express = require("express");
const fetch = require("node-fetch").default;
const cors = require("cors");

/* =========================================================
   2) CONFIGURACION GENERAL
========================================================= */
const app = express();
const PORT = 3000;

app.use(cors());

const BASE_URL_COMPLIF = "https://api.complif.com";
const TOKEN_COMPLIF = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiAiYXV0aGVudGljYXRlZCIsICJleHAiOiAxNzc3MzAwNDc3LCAiaWF0IjogMTc3NjY5NTY3NiwgInN1YiI6ICI1NDI2YmY2Ny1lZmNiLTQ5ZTktODVlYS0xYzEyYmM1NjY1NjciLCAicm9sZSI6ICJhdXRoZW50aWNhdGVkIiwgInVzZXJfdHlwZSI6ICJhcHBsaWNhdGlvbiIsICJhcHBfbWV0YWRhdGEiOiB7InByb3ZpZGVyIjogImNsaWVudF9jcmVkZW50aWFscyIsICJwcm92aWRlcnMiOiBbImNsaWVudF9jcmVkZW50aWFscyJdLCAib3JnYW5pemF0aW9ucyI6IFsiTkFTSU5JIl0sICJpZF9vcmdhbml6YXRpb24iOiAiTkFTSU5JIiwgImlkX2V4dGVybmFsX29yZ2FuaXphdGlvbiI6IG51bGx9fQ.nu-2bbvbYTKqljG1QyVWbj4LChIAtXn_xIIOk99XoAY";

/* =========================================================
   3) HELPERS
========================================================= */

/**
 * Hace una consulta GET a Complif y devuelve:
 * - res: respuesta original
 * - raw: texto crudo
 * - data: JSON parseado si aplica
 */
async function fetchJsonComplif(url) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: TOKEN_COMPLIF
    }
  });

  const raw = await res.text();

  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  return { res, raw, data };
}

/**
 * Busca dentro de accounts_integrations los datos fiscales del titular.
 */
function extraerDatosFiscalesComplif(integraciones) {
  if (!Array.isArray(integraciones)) return null;

  for (const item of integraciones) {
    const datosFiscales = item?.request?.titular?.datosFiscales;
    if (datosFiscales) return datosFiscales;
  }

  return null;
}

/* =========================================================
   4) TEST DEL TOKEN
========================================================= */

/**
 * Prueba simple para validar si el token funciona.
 * Consulta el endpoint general de cuentas.
 */
async function probarToken() {
  try {
    console.log("TOKEN EN USO:", TOKEN_COMPLIF.slice(0, 50) + "...");

    const res = await fetch(`${BASE_URL_COMPLIF}/api/crm/v1/accounts`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: TOKEN_COMPLIF
      }
    });

    console.log("STATUS TOKEN:", res.status);

    const text = await res.text();
    console.log("RESPUESTA TOKEN:", text);
  } catch (error) {
    console.error("Error probando token:", error.message);
  }
}

/* =========================================================
   5) RUTA DEL PROXY
========================================================= */

/**
 * GET /complif/:cuenta
 *
 * Flujo:
 * 1. Busca la cuenta en Complif
 * 2. Obtiene el id_account
 * 3. Busca las integraciones de esa cuenta
 * 4. Extrae categoria de ganancias e IVA
 */
app.get("/complif/:cuenta", async (req, res) => {
  try {
    const cuenta = req.params.cuenta;

    if (!cuenta) {
      return res.status(400).json({
        error: "Falta el número de cuenta."
      });
    }

    /* ---------------------------------------------------------
       5.1) Buscar cuenta en Complif
    --------------------------------------------------------- */
    const r1 = await fetchJsonComplif(
      `${BASE_URL_COMPLIF}/api/crm/v1/accounts/${encodeURIComponent(cuenta)}`
    );

    if (!r1.res.ok) {
      return res.status(r1.res.status).json({
        error: "Error consultando la cuenta en Complif.",
        detail: r1.data
      });
    }

    const idAccount = r1.data?.id_account ?? null;

    if (!idAccount) {
      return res.status(404).json({
        error: "Cuenta no encontrada en Complif."
      });
    }

    /* ---------------------------------------------------------
       5.2) Buscar integraciones de la cuenta
    --------------------------------------------------------- */
    const r2 = await fetchJsonComplif(
      `${BASE_URL_COMPLIF}/api/crm/v1/accounts_integrations?id_account=eq.${encodeURIComponent(idAccount)}`
    );

    if (!r2.res.ok) {
      return res.status(r2.res.status).json({
        error: "Error consultando accounts_integrations en Complif.",
        detail: r2.data
      });
    }

    const datosFiscales = extraerDatosFiscalesComplif(r2.data);

    /* ---------------------------------------------------------
       5.3) Respuesta final
    --------------------------------------------------------- */
    return res.json({
      idAccountComplif: idAccount,
      categoria_iigg: datosFiscales?.tipoResponsableGanancias ?? null,
      categoriaIva: datosFiscales?.tipoResponsableIVA ?? null
    });
  } catch (err) {
    return res.status(500).json({
      error: "Error interno consultando Complif.",
      detail: err.message
    });
  }
});

/* =========================================================
   6) LEVANTAR SERVIDOR
========================================================= */
app.listen(PORT, () => {
  console.log(`Proxy Complif corriendo en http://localhost:${PORT}`);
  //probarToken();
});