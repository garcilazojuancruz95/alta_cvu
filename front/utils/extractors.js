export function buscarDeclaracion(declaraciones, key) {
  if (!Array.isArray(declaraciones)) return null;

  const obj = declaraciones.find((d) =>
    Object.prototype.hasOwnProperty.call(d, key)
  );

  return obj ? obj[key] : null;
}

export function extraerTelefonoEmpresa(dataCuenta) {
  const medios = dataCuenta?.mediosComunicacion;
  if (!Array.isArray(medios)) return null;

  const movil = medios.find((m) => m?.tipo === "Movil");
  if (!movil?.medio) return null;

  return String(movil.medio).replace(/^\+/, "");
}

export function extraerEmail(datosPersona) {
  const medios = datosPersona?.mediosComuniacion;
  if (!Array.isArray(medios)) return null;

  const email = medios.find((m) =>
    (m?.tipoMedio || "").toLowerCase().includes("mail")
  );

  return email?.medio ?? null;
}

export function obtenerDniApoderado(datosPersona) {
  const autoridades = datosPersona?.autoridades;
  if (!Array.isArray(autoridades)) return null;

  const presidente = autoridades.find((a) => a?.cargo === "Presidente");
  return presidente?.autoridad?.id ?? null;
}

export function extraerDomiciliosApoderado(datosDni) {
  const domicilios = datosDni?.domiciliosSimples;

  let domicilioLegalApoderado = null;
  let domicilioRealApoderado = null;

  if (!Array.isArray(domicilios)) {
    return { domicilioLegalApoderado, domicilioRealApoderado };
  }

  const armarDireccion = (d) => {
    const calleAltura = [d?.calle, d?.altura].filter(Boolean).join(" ");
    const partes = [calleAltura, d?.ciudad, d?.provincia, d?.pais]
      .filter((v) => v && String(v).trim() !== "");

    return partes.length ? partes.join(", ") : null;
  };

  domicilios.forEach((d) => {
    const direccion = armarDireccion(d);
    if (!direccion) return;

    if (d?.uso === "Legal") domicilioLegalApoderado = direccion;
    if (d?.uso === "Real") domicilioRealApoderado = direccion;
  });

  return { domicilioLegalApoderado, domicilioRealApoderado };
}

export function extraerOrigenFondos(itemListado) {
  const acts = itemListado?.datosFiscalesNacionales?.actividadesEconomicasAFIP;
  if (!Array.isArray(acts) || !acts.length) return null;

  return String(acts[0]).replace(/\[[^\]]+\]\s*/, "");
}

export function extraerPersonaPEP(datosDni) {
  return buscarDeclaracion(datosDni?.declaraciones, "personaPEP");
}