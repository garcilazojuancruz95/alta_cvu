import { BASE_URL_PROXY } from "../config/api.js";

export async function obtenerDatosComplif(cuenta) {
  try {
    const resp = await fetch(
      `${BASE_URL_PROXY}/complif/${encodeURIComponent(cuenta)}`
    );

    const data = await resp.json();

    if (!resp.ok) {
      throw new Error("Error consultando Complif");
    }

    return {
      idAccountComplif: data.idAccountComplif ?? null,
      categoria_iigg: data.categoria_iigg ?? null,
      categoriaIva: data.categoriaIva ?? null,
      fechaNacimiento: data.fechaNacimiento ?? null
    };
  } catch (err) {
    console.error("Error en Complif:", err);

    return {
      idAccountComplif: null,
      categoria_iigg: null,
      categoriaIva: null,
      fechaNacimiento: null
    };
  }
}