/* =========================================================
   1) DEPENDENCIAS
========================================================= */
const express = require("express");
const fetch = require("node-fetch").default;
const cors = require("cors");

/* =========================================================
   2) CONFIGURACIÓN GENERAL
========================================================= */
const app = express();
const PORT = 3000;

app.use(cors());

const BASE_URL_COMPLIF = "https://api.complif.com";
const TOKEN_COMPLIF = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiAiYXV0aGVudGljYXRlZCIsICJleHAiOiAxNzczNDI1NjkxLCAiaWF0IjogMTc3MjgyMDg5MCwgInN1YiI6ICI1NDI2YmY2Ny1lZmNiLTQ5ZTktODVlYS0xYzEyYmM1NjY1NjciLCAicm9sZSI6ICJhdXRoZW50aWNhdGVkIiwgInVzZXJfdHlwZSI6ICJhcHBsaWNhdGlvbiIsICJhcHBfbWV0YWRhdGEiOiB7InByb3ZpZGVyIjogImNsaWVudF9jcmVkZW50aWFscyIsICJwcm92aWRlcnMiOiBbImNsaWVudF9jcmVkZW50aWFscyJdLCAib3JnYW5pemF0aW9ucyI6IFsiTkFTSU5JIl0sICJpZF9leHRlcm5hbF9vcmdhbml6YXRpb24iOiBudWxsfX0.V-vEvGtLQgIPfxMGJYitW11MdipzvPX9UqBDovo3jK8";

/* =========================================================
   3) HELPERS
========================================================= */
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

function extraerDatosFiscalesComplif(integraciones) {
  if (!Array.isArray(integraciones)) return null;

  for (const item of integraciones) {
    const datosFiscales = item?.request?.titular?.datosFiscales;
    if (datosFiscales) return datosFiscales;
  }

  return null;
}

/* =========================================================
   4) RUTA DEL PROXY
========================================================= */
app.get("/complif/:cuenta", async (req, res) => {
  try {
    const cuenta = req.params.cuenta;

    if (!cuenta) {
      return res.status(400).json({
        error: "Falta el número de cuenta."
      });
    }

    /* 4.1) Buscar cuenta en Complif */
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

    /* 4.2) Buscar integraciones */
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

    /* 4.3) Respuesta final */
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
   5) LEVANTAR SERVIDOR
========================================================= */
app.listen(PORT, () => {
  console.log(`Proxy Complif corriendo en http://localhost:${PORT}`);
});