export function limpiarCuit(cuit) {
  return cuit ? String(cuit).replace(/\D/g, "") : null;
}

export function calcularDuracionSociedad(fecha) {
  if (!fecha) return null;

  const partes = fecha.split("/");
  const anio = parseInt(partes[2], 10);

  if (!Number.isFinite(anio)) return null;

  const actual = new Date().getFullYear();
  return actual - anio;
}