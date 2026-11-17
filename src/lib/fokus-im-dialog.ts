/**
 * Hält den Tastaturfokus in einem offenen Dialog.
 *
 * `aria-modal` reicht nicht, und ein `focusin`-Wächter allein auch nicht:
 * In der CI und lokal entwich der Fokus trotzdem zu `body`, Befehlspalette
 * nach 2 Schritten, Telefonmenü nach 9 Schritten. `inert` nimmt die
 * restliche Seite aus der Tab-Reihenfolge, fängt den Sprung hinter das
 * letzte Feld im Dialog aber nicht. Deshalb zusätzlich Tab abfangen und
 * im Dialog im Kreis führen.
 *
 * Die Liste der Ziele enthält auch Scrollbereiche: Chrome macht sie seit
 * Version 127 ohne `tabindex` tastaturfokussierbar. Ein reiner
 * Auswahlausdruck übersieht sie, gemessen sprang der Fokus genau von dort
 * nach draußen.
 *
 * Die Inert-Sperre wird gezählt, weil Palette und Menü gleichzeitig offen
 * sein können.
 */

const sperren = new WeakMap<HTMLElement, number>();

const FOKUS_AUSWAHL = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "audio[controls]",
  "video[controls]",
  "[contenteditable]:not([contenteditable=false])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function istSichtbar(el: HTMLElement): boolean {
  if (el.hidden || el.getAttribute("aria-hidden") === "true") return false;
  const stil = getComputedStyle(el);
  if (stil.visibility === "hidden" || stil.display === "none") return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

function istScrollbereich(el: HTMLElement): boolean {
  const stil = getComputedStyle(el);
  const senkrecht =
    /(auto|scroll)/.test(stil.overflowY) && el.scrollHeight > el.clientHeight;
  const waagerecht =
    /(auto|scroll)/.test(stil.overflowX) && el.scrollWidth > el.clientWidth;
  return senkrecht || waagerecht;
}

export function sammleFokussierbare(wurzel: HTMLElement): HTMLElement[] {
  const funde = new Set<HTMLElement>();
  for (const knoten of wurzel.querySelectorAll(FOKUS_AUSWAHL)) {
    if (knoten instanceof HTMLElement && istSichtbar(knoten)) funde.add(knoten);
  }
  for (const knoten of wurzel.querySelectorAll("*")) {
    if (
      knoten instanceof HTMLElement &&
      istScrollbereich(knoten) &&
      istSichtbar(knoten)
    ) {
      funde.add(knoten);
    }
  }
  if (wurzel.tabIndex >= 0 && istSichtbar(wurzel)) funde.add(wurzel);
  return [...funde].sort((a, b) => {
    const ta = a.tabIndex > 0 ? a.tabIndex : 0;
    const tb = b.tabIndex > 0 ? b.tabIndex : 0;
    if (ta !== tb) return ta - tb;
    const lage = a.compareDocumentPosition(b);
    if (lage & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (lage & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
}

export function halteFokusImDialog(
  dialog: HTMLElement,
  ereignis: KeyboardEvent,
): void {
  if (ereignis.key !== "Tab") return;
  const ziele = sammleFokussierbare(dialog);
  // Immer selbst fuehren: Sonst entweicht Tab, sobald das aktuelle Ziel
  // nicht exakt das letzte in der Liste ist (zum Beispiel der
  // Scrollbereich der Ergebnisliste, oder ein Kind darin).
  ereignis.preventDefault();
  if (ziele.length === 0) {
    dialog.focus();
    return;
  }
  const aktiv = document.activeElement;
  let i = ziele.findIndex(
    (el) => el === aktiv || (aktiv instanceof Node && el.contains(aktiv)),
  );
  if (ereignis.shiftKey) {
    i = i <= 0 ? ziele.length - 1 : i - 1;
  } else {
    i = i === -1 || i === ziele.length - 1 ? 0 : i + 1;
  }
  ziele[i].focus();
}

export function sperreRestDerSeite(dialog: HTMLElement): () => void {
  const gesperrt: HTMLElement[] = [];
  let lauf: HTMLElement | null = dialog;

  while (lauf.parentElement) {
    for (const kind of Array.from(lauf.parentElement.children)) {
      if (kind === lauf || !(kind instanceof HTMLElement)) continue;
      const bisher = sperren.get(kind) ?? 0;
      if (bisher === 0 && kind.inert) continue;
      sperren.set(kind, bisher + 1);
      kind.inert = true;
      gesperrt.push(kind);
    }
    lauf = lauf.parentElement;
  }

  return () => {
    for (const el of gesperrt) {
      const rest = (sperren.get(el) ?? 1) - 1;
      if (rest <= 0) {
        sperren.delete(el);
        el.inert = false;
      } else {
        sperren.set(el, rest);
      }
    }
  };
}
