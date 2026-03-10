import { statusBadge, consoleText } from "./elements.js";

let lastRawText = "";

export function setPanel({ status = "—", text = "" }) {
  statusBadge.textContent = status;
  consoleText.textContent = text || "";
}

export function setLastRawText(value) {
  lastRawText = value;
}

export function getLastRawText() {
  return lastRawText;
}