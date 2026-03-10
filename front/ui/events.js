import { input, btn, copyBtn, consoleText } from "./elements.js";
import { buscarCuenta } from "../controllers/cuentaController.js";
import { getLastRawText } from "./panel.js";

export function bindEvents() {
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(getLastRawText() || consoleText.textContent);
      copyBtn.textContent = "Copiado ✓";

      setTimeout(() => {
        copyBtn.textContent = "Copiar JSON";
      }, 1200);
    } catch {
      alert("No se pudo copiar automáticamente.");
    }
  });

  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, "").slice(0, 6);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") buscarCuenta();
  });

  btn.addEventListener("click", buscarCuenta);
}