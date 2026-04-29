/* =========================================================
   1) DEPENDENCIAS
========================================================= */
require("dotenv").config();

const express = require("express");
const fetch = require("node-fetch").default;
const cors = require("cors");

const { getAuneToken } = require("./auneAuth");
const { getComplifToken } = require("./complifAuth");

/* =========================================================
   2) CONFIGURACION GENERAL
========================================================= */
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const BASE_URL_COMPLIF = process.env.COMPLIF_BASE_URL;

/* =========================================================
   3) HELPERS
========================================================= */
async function fetchJsonComplif(url) {
  const token = await getComplifToken();

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: token
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

function extraerDatosFiscalesComplif(integraciones) {
  if (!Array.isArray(integraciones)) return null;

  for (const item of integraciones) {
    const datosFiscales = item?.request?.titular?.datosFiscales;
    if (datosFiscales) return datosFiscales;
  }

  return null;
}

/* =========================================================
   4) RUTAS DE TEST TEMPORALES
========================================================= */
app.get("/test/aune-token", async (req, res) => {
  try {
    const token = await getAuneToken();

    return res.json({
      ok: true,
      message: "Token de Aune obtenido correctamente",
      tokenPreview: token ? token.slice(0, 20) + "..." : null
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.get("/test/complif-token", async (req, res) => {
  try {
    const token = await getComplifToken();

    return res.json({
      ok: true,
      message: "Token de Complif obtenido correctamente",
      tokenPreview: token ? token.slice(0, 20) + "..." : null
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

/* =========================================================
   5) RUTA DEL PROXY COMPLIF
========================================================= */
app.get("/complif/:cuenta", async (req, res) => {
  try {
    const cuenta = req.params.cuenta;

    if (!cuenta) {
      return res.status(400).json({
        error: "Falta el número de cuenta."
      });
    }

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
app.get("/aune/cuentas/:cuenta", async (req, res) => {
  try {
    const cuenta = req.params.cuenta;
    const token = await getAuneToken();

    const response = await fetch(
      `${process.env.AUNE_BASE_URL}/api/cuentas/${encodeURIComponent(cuenta)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token
        }
      }
    );

    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Error consultando cuenta en Aune",
      detail: error.message
    });
  }
});

app.get("/aune/personas/datosPersona", async (req, res) => {
  try {
    const { tipoId, id } = req.query;
    const token = await getAuneToken();

    const response = await fetch(
      `${process.env.AUNE_BASE_URL}/api/personas/datosPersona?tipoId=${encodeURIComponent(tipoId)}&id=${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token
        }
      }
    );

    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Error consultando datosPersona en Aune",
      detail: error.message
    });
  }
});

app.get("/aune/personas/listadoPersonas", async (req, res) => {
  try {
    const { tipoId, id } = req.query;
    const token = await getAuneToken();

    const response = await fetch(
      `${process.env.AUNE_BASE_URL}/api/personas/listadoPersonas?tipoId=${encodeURIComponent(tipoId)}&id=${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token
        }
      }
    );

    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Error consultando listadoPersonas en Aune",
      detail: error.message
    });
  }
});

app.get("/aune/cuentas/:cuenta/personas", async (req, res) => {
  try {
    const cuenta = req.params.cuenta;
    const token = await getAuneToken();

    const response = await fetch(
      `${process.env.AUNE_BASE_URL}/api/cuentas/${encodeURIComponent(cuenta)}/personas`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token
        }
      }
    );

    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Error consultando personas de cuenta en Aune",
      detail: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy corriendo en http://localhost:${PORT}`);
});