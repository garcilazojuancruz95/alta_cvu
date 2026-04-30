// 👉 ahora todo pasa por tu backend (proxy)
const BASE_URL = "http://localhost:3000";

async function fetchJson(url) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  const raw = await res.text();
  const data = raw ? JSON.parse(raw) : null;

  if (!res.ok) {
    throw new Error(data?.error || "Error en la llamada al backend");
  }

  return { res, raw, data };
}

export function obtenerCuenta(cuenta) {
  return fetchJson(`${BASE_URL}/aune/cuentas/${cuenta}`);
}

export function obtenerPersonasCuenta(cuenta) {
  return fetchJson(`${BASE_URL}/aune/cuentas/${cuenta}/personas`);
}

export function obtenerDatosPersonaPorCuit(cuit) {
  return fetchJson(
    `${BASE_URL}/aune/personas/datosPersona?tipoId=CUIT&id=${encodeURIComponent(cuit)}`
  );
}

export function obtenerDatosPersonaPorDni(dni) {
  return fetchJson(
    `${BASE_URL}/aune/personas/datosPersona?tipoId=DNI&id=${encodeURIComponent(dni)}`
  );
}

export function obtenerListadoPersonaPorCuit(cuit) {
  return fetchJson(
    `${BASE_URL}/aune/personas/listadoPersonas?tipoId=CUIT&id=${encodeURIComponent(cuit)}`
  );
}

export function obtenerListadoPersonaPorDni(dni) {
  return fetchJson(
    `${BASE_URL}/aune/personas/listadoPersonas?tipoId=DNI&id=${encodeURIComponent(dni)}`
  );
}