import { BASE_URL_AUNE, ENDPOINT_CUENTA, TOKEN_AUNE } from "../config/api.js";

async function fetchJson(url) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: TOKEN_AUNE
    }
  });

  const raw = await res.text();
  const data = raw ? JSON.parse(raw) : null;

  return { res, raw, data };
}

export function obtenerCuenta(cuenta) {
  return fetchJson(`${BASE_URL_AUNE}${ENDPOINT_CUENTA}/${cuenta}`);
}

export function obtenerPersonasCuenta(cuenta) {
  return fetchJson(`${BASE_URL_AUNE}${ENDPOINT_CUENTA}/${cuenta}/personas`);
}

export function obtenerDatosPersonaPorCuit(cuit) {
  return fetchJson(
    `${BASE_URL_AUNE}/api/personas/datosPersona?tipoId=CUIT&id=${encodeURIComponent(cuit)}`
  );
}

export function obtenerDatosPersonaPorDni(dni) {
  return fetchJson(
    `${BASE_URL_AUNE}/api/personas/datosPersona?tipoId=DNI&id=${encodeURIComponent(dni)}`
  );
}

export function obtenerListadoPersonaPorCuit(cuit) {
  return fetchJson(
    `${BASE_URL_AUNE}/api/personas/listadoPersonas?tipoId=CUIT&id=${encodeURIComponent(cuit)}`
  );
}

export function obtenerListadoPersonaPorDni(dni) {
  return fetchJson(
    `${BASE_URL_AUNE}/api/personas/listadoPersonas?tipoId=DNI&id=${encodeURIComponent(dni)}`
  );
}