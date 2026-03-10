import { btn, input } from "../ui/elements.js";
import { setPanel, setLastRawText } from "../ui/panel.js";
import { limpiarCuit, calcularDuracionSociedad } from "../utils/formatters.js";
import {
  buscarDeclaracion,
  extraerTelefonoEmpresa,
  extraerEmail,
  obtenerDniApoderado,
  extraerDomiciliosApoderado,
  extraerOrigenFondos,
  extraerPersonaPEP
} from "../utils/extractors.js";
import {
  obtenerCuenta,
  obtenerPersonasCuenta,
  obtenerDatosPersonaPorCuit,
  obtenerDatosPersonaPorDni,
  obtenerListadoPersonaPorCuit,
  obtenerListadoPersonaPorDni
} from "../services/auneService.js";
import { obtenerDatosComplif } from "../services/complifService.js";

export async function buscarCuenta() {
  const cuenta = input.value.trim();

  if (!cuenta) {
    setPanel({
      status: "ERROR",
      text: "Ingresá un número de cuenta."
    });
    return;
  }

  btn.disabled = true;
  btn.textContent = "Buscando...";

  try {
    const r1 = await obtenerCuenta(cuenta);
    const tipoTitular = r1.data?.tipoTitular;

    if (tipoTitular === "Físico") {
      setPanel({
        status: "OK",
        text: "La cuenta pertenece a una persona física."
      });
      return;
    }

    const denominacion = r1.data?.denominacion ?? "-";
    const direccion = r1.data?.domicilios?.[0]?.direccion ?? "-";
    const telefonoEmpresa = extraerTelefonoEmpresa(r1.data);

    const r2 = await obtenerPersonasCuenta(cuenta);
    const persona = r2.data?.find((p) => p.relacion === "Titular") || r2.data?.[0];

    const cuit = limpiarCuit(persona?.cuit);
    const inversorCalificado = persona?.inversorCalificado ?? null;

    const r3 = await obtenerDatosPersonaPorCuit(cuit);

    const fechaConstitucion = r3.data?.datosOrganizacion?.fechaConstitucion ?? null;
    const duracionSociedad = calcularDuracionSociedad(fechaConstitucion);
    const emailPersona = extraerEmail(r3.data);
    const dniApoderado = obtenerDniApoderado(r3.data);

    let cuitApoderado = null;
    let domicilioLegalApoderado = null;
    let domicilioRealApoderado = null;
    let apoderadoEsPep = null;

    if (dniApoderado) {
      const r4 = await obtenerDatosPersonaPorDni(dniApoderado);

      cuitApoderado = r4.data?.datosFiscalesNacionales?.CUIT
        ? limpiarCuit(r4.data.datosFiscalesNacionales.CUIT)
        : null;

      const doms = extraerDomiciliosApoderado(r4.data);
      domicilioLegalApoderado = doms.domicilioLegalApoderado;
      domicilioRealApoderado = doms.domicilioRealApoderado;
      apoderadoEsPep = extraerPersonaPEP(r4.data);
    }

    let esFatca = null;
    let esSujetoObligado = null;
    let origenFondos = null;

    if (cuit) {
      const r5 = await obtenerListadoPersonaPorCuit(cuit);

      if (r5.res.ok && Array.isArray(r5.data) && r5.data.length) {
        const item = r5.data[0];
        esFatca = buscarDeclaracion(item?.declaraciones, "personaEstadounidense");
        esSujetoObligado = buscarDeclaracion(item?.declaraciones, "sujetoObligado");
        origenFondos = extraerOrigenFondos(item);
      }
    }

    let apoderadoFatca = null;
    let apoderadoNombre = null;
    let apoderadoSujetoObligado = null;

    if (dniApoderado) {
      const r6 = await obtenerListadoPersonaPorDni(dniApoderado);

      if (r6.res.ok && Array.isArray(r6.data) && r6.data.length) {
        const item = r6.data[0];

        apoderadoFatca = buscarDeclaracion(item?.declaraciones, "personaEstadounidense");
        apoderadoSujetoObligado = buscarDeclaracion(item?.declaraciones, "sujetoObligado");

        const nombres = item?.datosPrincipalesFisicas?.nombres ?? "";
        const apellidos = item?.datosPrincipalesFisicas?.apellidos ?? "";

        apoderadoNombre = [nombres, apellidos]
          .filter((v) => v && String(v).trim() !== "")
          .join(" ");
      }
    }

    const {
      idAccountComplif,
      categoria_iigg,
      categoriaIva,
      fechaNacimiento
    } = await obtenerDatosComplif(cuenta);

    const resumen = {
      denominacion,
      fechaConstitucion,
      duracionSociedad,
      cuit,
      cuitApoderado,
      origenFondos,
      inversorCalificado,
      esFatca,
      esSujetoObligado,
      dniApoderado,
      emailPersona,
      fechaNacimiento,
      domicilioRealApoderado,
      domicilioLegalApoderado,
      apoderadoEsPep,
      direccion,
      apoderadoNombre,
      apoderadoSujetoObligado,
      telefonoEmpresa,
      apoderadoFatca,
      idAccountComplif,
      categoria_iigg,
      categoriaIva
    };

    const raw = JSON.stringify(resumen, null, 2);
    setLastRawText(raw);

    setPanel({
      status: "OK",
      text: raw
    });
  } catch (err) {
    setPanel({
      status: "ERROR",
      text: String(err)
    });
  } finally {
    btn.disabled = false;
    btn.textContent = "Continuar";
  }
}