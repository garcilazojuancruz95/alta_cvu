const BASE_URL = "https://nasini.aunesa.com/Irmo";
const ENDPOINT_CUENTA = "/api/cuentas";

const input = document.getElementById("cuenta");
const btn = document.getElementById("btn");

const statusBadge = document.getElementById("statusBadge");
const consoleText = document.getElementById("consoleText");
const copyBtn = document.getElementById("copyBtn");

let lastRawText = "";

const TOKEN = "Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpZF9jbGllbnRlICxBUElfSkNHYXJjaWxhem8gLDE3MC4yMzguMTI0LjE4OCIsImV4cCI6MTc3MjgyNjg5MH0.9lq1Qr__44VnjLhLOyAoO6ZPVbpNCwBcIpG6Q1kvlj8l1QtRNt7X4T5yOjuoob7SCc8yxHPuVXpTG3RoYbra6w";

/* copiar JSON */
copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(lastRawText || consoleText.textContent);
    copyBtn.textContent = "Copiado ✓";
    setTimeout(() => (copyBtn.textContent = "Copiar JSON"), 1200);
  } catch {
    alert("No se pudo copiar automáticamente.");
  }
});

function setPanel({ status = "—", text = "" }) {
  statusBadge.textContent = status;
  consoleText.textContent = text || "";
}

input.addEventListener("input", () => {
  input.value = input.value.replace(/\D/g, "").slice(0, 6);
});

async function fetchJson(url) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Authorization": TOKEN
    }
  });

  const raw = await res.text();
  const data = raw ? JSON.parse(raw) : null;

  return { res, raw, data };
}

function limpiarCuit(cuit) {
  return cuit ? String(cuit).replace(/\D/g, "") : null;
}

function calcularDuracionSociedad(fecha) {
  if (!fecha) return null;
  const anio = parseInt(fecha.split("/")[2], 10);
  if (!Number.isFinite(anio)) return null;
  const actual = new Date().getFullYear();
  return actual - anio;
}

function extraerEmail(datosPersona) {
  const medios = datosPersona?.mediosComuniacion;
  if (!Array.isArray(medios)) return null;

  const email = medios.find(m =>
    (m?.tipoMedio || "").toLowerCase().includes("mail")
  );

  return email?.medio ?? null;
}

function obtenerDniApoderado(datosPersona) {
  const autoridades = datosPersona?.autoridades;
  if (!Array.isArray(autoridades)) return null;

  const presidente = autoridades.find(a => a?.cargo === "Presidente");
  return presidente?.autoridad?.id ?? null;
}

function extraerDomiciliosApoderado(datosDni) {
  const domicilios = datosDni?.domiciliosSimples;

  let domicilioLegalApoderado = null;
  let domicilioRealApoderado = null;

  if (!Array.isArray(domicilios)) {
    return { domicilioLegalApoderado, domicilioRealApoderado };
  }

  const armarDireccion = (d) => {
    const calleAltura = [d?.calle, d?.altura].filter(Boolean).join(" ");
    const partes = [calleAltura, d?.ciudad, d?.provincia, d?.pais]
      .filter(v => v && String(v).trim() !== "");
    return partes.length ? partes.join(", ") : null;
  };

  domicilios.forEach(d => {
    const direccion = armarDireccion(d);
    if (!direccion) return;

    if (d?.uso === "Legal") domicilioLegalApoderado = direccion;
    if (d?.uso === "Real") domicilioRealApoderado = direccion;
  });

  return { domicilioLegalApoderado, domicilioRealApoderado };
}

/* helpers declaraciones */
function buscarDeclaracion(declaraciones, key) {
  if (!Array.isArray(declaraciones)) return null;
  const obj = declaraciones.find(d => Object.prototype.hasOwnProperty.call(d, key));
  return obj ? obj[key] : null;
}

function extraerOrigenFondos(itemListado) {
  const acts = itemListado?.datosFiscalesNacionales?.actividadesEconomicasAFIP;
  if (!Array.isArray(acts) || !acts.length) return null;

  // 1er actividad sin el [codigo]
  return String(acts[0]).replace(/\[[^\]]+\]\s*/, "");
}

function extraerPersonaPEP(datosDni) {
  return buscarDeclaracion(datosDni?.declaraciones, "personaPEP");
}

async function buscarCuenta() {
  const cuenta = input.value.trim();

  if (!cuenta) {
    setPanel({ status: "ERROR", text: "Ingresá un número de cuenta." });
    return;
  }

  btn.disabled = true;
  btn.textContent = "Buscando...";

  try {
    /* 1️⃣ CUENTA */
    const r1 = await fetchJson(`${BASE_URL}${ENDPOINT_CUENTA}/${cuenta}`);
    const tipoTitular = r1.data?.tipoTitular;

    if (tipoTitular === "Físico") {
      setPanel({ status: "OK", text: "La cuenta pertenece a una persona física." });
      return;
    }

    const denominacion = r1.data?.denominacion ?? "-";
    const direccion = r1.data?.domicilios?.[0]?.direccion ?? "-";

    /* 2️⃣ PERSONAS */
    const r2 = await fetchJson(`${BASE_URL}${ENDPOINT_CUENTA}/${cuenta}/personas`);
    const persona = r2.data?.find(p => p.relacion === "Titular") || r2.data?.[0];

    const cuit = limpiarCuit(persona?.cuit);
    const inversorCalificado = persona?.inversorCalificado ?? null;

    /* 3️⃣ DATOS PERSONA POR CUIT */
    const r3 = await fetchJson(
      `${BASE_URL}/api/personas/datosPersona?tipoId=CUIT&id=${encodeURIComponent(cuit)}`
    );

    const fechaConstitucion = r3.data?.datosOrganizacion?.fechaConstitucion ?? null;
    const duracionSociedad = calcularDuracionSociedad(fechaConstitucion);
    const emailPersona = extraerEmail(r3.data);
    const dniApoderado = obtenerDniApoderado(r3.data);

    /* 4️⃣ DATOS PERSONA POR DNI */
    let cuitApoderado = null;
    let domicilioLegalApoderado = null;
    let domicilioRealApoderado = null;
    let apoderadoEsPep = null;

    if (dniApoderado) {
      const r4 = await fetchJson(
        `${BASE_URL}/api/personas/datosPersona?tipoId=DNI&id=${encodeURIComponent(dniApoderado)}`
      );

      cuitApoderado =
        r4.data?.datosFiscalesNacionales?.CUIT
          ? limpiarCuit(r4.data.datosFiscalesNacionales.CUIT)
          : null;

      const doms = extraerDomiciliosApoderado(r4.data);
      domicilioLegalApoderado = doms.domicilioLegalApoderado;
      domicilioRealApoderado = doms.domicilioRealApoderado;

      apoderadoEsPep = extraerPersonaPEP(r4.data);
    }

    /* 5️⃣ LISTADO PERSONAS POR CUIT (sociedad) */
    let esFatca = null;
    let esSujetoObligado = null;
    let origenFondos = null;

    if (cuit) {
      const r5 = await fetchJson(
        `${BASE_URL}/api/personas/listadoPersonas?tipoId=CUIT&id=${encodeURIComponent(cuit)}`
      );

      if (r5.res.ok && Array.isArray(r5.data) && r5.data.length) {
        const item = r5.data[0];
        esFatca = buscarDeclaracion(item?.declaraciones, "personaEstadounidense");
        esSujetoObligado = buscarDeclaracion(item?.declaraciones, "sujetoObligado");
        origenFondos = extraerOrigenFondos(item);
      }
    }

    /* 6️⃣ LISTADO PERSONAS POR DNI (apoderado) -> apoderadoFatca */
    let apoderadoFatca = null;

    if (dniApoderado) {
      const r6 = await fetchJson(
        `${BASE_URL}/api/personas/listadoPersonas?tipoId=DNI&id=${encodeURIComponent(dniApoderado)}`
      );

      if (r6.res.ok && Array.isArray(r6.data) && r6.data.length) {
        const item = r6.data[0];
        apoderadoFatca = buscarDeclaracion(item?.declaraciones, "personaEstadounidense");
      }
    }

    /* RESULTADO FINAL */
    const resumen = {
      denominacion,
      direccion,
      cuit,
      inversorCalificado,
      fechaConstitucion,
      duracionSociedad,
      emailPersona,
      dniApoderado,
      cuitApoderado,
      domicilioLegalApoderado,
      domicilioRealApoderado,
      esFatca,
      esSujetoObligado,
      origenFondos,
      apoderadoEsPep,
      apoderadoFatca
    };

    lastRawText = JSON.stringify(resumen, null, 2);

    setPanel({
      status: "OK",
      text: JSON.stringify(resumen, null, 2)
    });

  } catch (err) {
    setPanel({ status: "ERROR", text: String(err) });
  } finally {
    btn.disabled = false;
    btn.textContent = "Continuar";
  }
}

btn.addEventListener("click", buscarCuenta);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") buscarCuenta();
});