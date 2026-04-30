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
const BASE_URL_AUNE = process.env.AUNE_BASE_URL;

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

function booleanoSiNo(valor) {
  if (valor === true) return "SI";
  if (valor === false) return "NO";
  return null;
}

function formatearFechaDDMMYYYY(fecha) {
  if (!fecha) return null;

  const [yyyy, mm, dd] = fecha.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

function extraerMediosAune(mediosComunicacion) {
  if (!Array.isArray(mediosComunicacion)) {
    return {
      telefono: null,
      email: null
    };
  }

  const movil = mediosComunicacion.find(
    (item) => item.tipo?.toLowerCase() === "movil"
  );

  const email = mediosComunicacion.find(
    (item) => item.tipo?.toLowerCase() === "e-mail"
  );

  return {
    telefono: movil?.medio ?? null,
    email: email?.medio ?? null
  };
}

function extraerDireccionLegalAune(domicilios) {
  if (!Array.isArray(domicilios) || domicilios.length === 0) {
    return null;
  }

  const dom = domicilios[0];

  const direccion = dom?.direccion ?? "";
  const ciudad = dom?.ciudad ?? "";

  const resultado = [direccion, ciudad].filter(Boolean).join(", ");

  return resultado || null;
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
   5) RUTAS AUNE
========================================================= */
app.get("/aune/cuentas/:cuenta", async (req, res) => {
  try {
    const cuenta = req.params.cuenta;
    const token = await getAuneToken();

    const response = await fetch(
      `${BASE_URL_AUNE}/api/cuentas/${encodeURIComponent(cuenta)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token
        }
      }
    );

    const data = await response.json();

    const medios = extraerMediosAune(data.mediosComunicacion);
    const direccionLegal = extraerDireccionLegalAune(data.domicilios);

    return res.status(response.status).json({
      id: data.id ?? null,
      denominacion: data.denominacion ?? null,
      tipoTitular: data.tipoTitular ?? null,
      telefono: medios.telefono,
      email: medios.email,
      direccionLegal
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error consultando cuenta en Aune",
      detail: error.message
    });
  }
});

app.get("/aune/cuentas/:cuenta/personas", async (req, res) => {
  try {
    const cuenta = req.params.cuenta;
    const token = await getAuneToken();

    const response = await fetch(
      `${BASE_URL_AUNE}/api/cuentas/${encodeURIComponent(cuenta)}/personas`,
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

app.get("/aune/personas/datosPersona", async (req, res) => {
  try {
    const { tipoId, id } = req.query;

    if (!tipoId || !id) {
      return res.status(400).json({
        error: "Faltan parámetros tipoId o id."
      });
    }

    const token = await getAuneToken();

    const response = await fetch(
      `${BASE_URL_AUNE}/api/personas/datosPersona?tipoId=${encodeURIComponent(tipoId)}&id=${encodeURIComponent(id)}`,
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

    if (!tipoId || !id) {
      return res.status(400).json({
        error: "Faltan parámetros tipoId o id."
      });
    }

    const token = await getAuneToken();

    const response = await fetch(
      `${BASE_URL_AUNE}/api/personas/listadoPersonas?tipoId=${encodeURIComponent(tipoId)}&id=${encodeURIComponent(id)}`,
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

/* =========================================================
   6) RUTAS COMPLIF
========================================================= */
app.get("/complif/:cuenta", async (req, res) => {
  try {
    const cuenta = req.params.cuenta;

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

app.get("/resumen/:cuenta", async (req, res) => {
  try {
    const cuenta = req.params.cuenta;

    const [auneResp, complifResp, complifPersonasResp] = await Promise.all([
      fetch(`http://localhost:${PORT}/aune/cuentas/${encodeURIComponent(cuenta)}`),
      fetch(`http://localhost:${PORT}/complif/${encodeURIComponent(cuenta)}`),
      fetch(`http://localhost:${PORT}/complif/${encodeURIComponent(cuenta)}/personas`)
    ]);

    const aune = await auneResp.json();
    const complif = await complifResp.json();
    const complifPersonas = await complifPersonasResp.json();

    return res.json({
      cuenta,
      aune,
      complif,
      personaComplif: complifPersonas.persona ?? null
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error generando resumen de cuenta.",
      detail: error.message
    });
  }
});

app.get("/complif/:cuenta/personas", async (req, res) => {
  try {
    const cuenta = req.params.cuenta;

    const rCuenta = await fetchJsonComplif(
      `${BASE_URL_COMPLIF}/api/crm/v1/accounts/${encodeURIComponent(cuenta)}`
    );

    if (!rCuenta.res.ok) {
      return res.status(rCuenta.res.status).json({
        error: "Error consultando la cuenta en Complif.",
        detail: rCuenta.data
      });
    }

    const owners = rCuenta.data?.owners ?? [];

    if (!owners.length) {
      return res.json({
        cuenta,
        personas: []
      });
    }

    const owner = owners[0];

    const rPersona = await fetchJsonComplif(
      `${BASE_URL_COMPLIF}/api/crm/v1/people/${encodeURIComponent(owner.id_person)}`
    );

    if (!rPersona.res.ok) {
      return res.status(rPersona.res.status).json({
        error: "No se pudo consultar la persona en Complif",
        detail: rPersona.data
      });
    }

    const persona = rPersona.data;
    const domicilio = persona.addresses?.[0];

    const resultado = {
      id_person: persona.id_person ?? null,
      nombre: persona.name ?? null,
      cuit: persona.tax_id_number ?? null,
      phone: persona.phone ?? null,
      birth_date: formatearFechaDDMMYYYY(persona.birth_date),
      es_pep: booleanoSiNo(persona.extra_data?.es_pep),
      es_soi: booleanoSiNo(persona.extra_data?.es_soi),
      es_ocde: booleanoSiNo(persona.extra_data?.es_ocde),
      es_fatca: booleanoSiNo(persona.extra_data?.es_fatca),
      id_number: persona.id_number ?? null,
      address: domicilio
        ? `${domicilio.number ?? ""} ${domicilio.street ?? ""} ${domicilio.city ?? ""}`.trim()
        : null
    };

    return res.json({
      cuenta,
      persona: resultado
    });
  } catch (err) {
    return res.status(500).json({
      error: "Error interno consultando personas en Complif.",
      detail: err.message
    });
  }
});

/* =========================================================
   7) LEVANTAR SERVIDOR
========================================================= */
app.listen(PORT, () => {
  console.log(`Proxy corriendo en http://localhost:${PORT}`);
});