import { BASE_URL_PROXY } from "../config/api.js";

export async function obtenerDatosComplif(cuenta) {
  try {
    const resp = await fetch(
      `${BASE_URL_PROXY}/complif/${encodeURIComponent(cuenta)}`
    );

    const data = await resp.json();

    if (!resp.ok) {
      console.error("Error consultando Complif:", data);
      return {
        idAccountComplif: null,
        categoria_iigg: null,
        categoriaIva: null,
        fechaNacimiento: null
      };
    }

    return {
      idAccountComplif: data.idAccountComplif ?? null,
      categoria_iigg: data.categoria_iigg ?? null,
      categoriaIva: data.categoriaIva ?? null,
      fechaNacimiento: data.fechaNacimiento ?? null
    };
  } catch (err) {
    console.error("Complif no respondió:", err);
    return {
      idAccountComplif: null,
      categoria_iigg: null,
      categoriaIva: null,
      fechaNacimiento: null
    };
  }
}