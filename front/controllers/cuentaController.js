import { BASE_URL_PROXY } from "../config/api.js";
import { btn, input } from "../ui/elements.js";
import { setPanel, setLastRawText } from "../ui/panel.js";

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
    const resp = await fetch(
      `${BASE_URL_PROXY}/resumen/${encodeURIComponent(cuenta)}`
    );
    const data = await resp.json();

    if (!resp.ok) {
      if (resp.status === 422 && data?.detail?.tipoTitular) {
        throw new Error("La cuenta ingresada no corresponde a una persona jurídica.");
      }

      throw new Error(data?.error || "Error consultando resumen.");
    }

    const raw = JSON.stringify(data, null, 2);
    setLastRawText(raw);

    setPanel({
      status: "OK",
      text: raw
    });
  } catch (err) {
    setLastRawText("");

    setPanel({
      status: "ERROR",
      text: String(err.message || err)
    });
  } finally {
    btn.disabled = false;
    btn.textContent = "Continuar";
  }
}
