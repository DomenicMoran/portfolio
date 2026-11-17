"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useContent } from "@/content/ContentProvider";
import { schreibe, zerlege } from "@/lib/number-format";

type Lang = "de" | "en";

type Props = {
  value: string;
  className?: string;
  /** Wenn gesetzt, braucht der Zaehler den ContentProvider nicht. */
  lang?: Lang;
  /**
   * Beim ersten Besuch hochzaehlen, auch wenn der Wert schon im Bild steht.
   * Fuer die Belegleiste im Vorspann. Reduced Motion und Druck zeigen den
   * Endwert.
   */
  beimStart?: boolean;
};

/**
 * Zählt beim Sichtbarwerden hoch.
 *
 * Werte, die keine reine Zahl sind ("100 %", "1.44", "EU", "24/7"), werden nur
 * im führenden Zahlenteil animiert; der Rest bleibt wörtlich stehen. So bleibt
 * die Inhaltsdatei lesbar, statt jeden Wert in {Zahl, Suffix} zu zerlegen.
 */
export function Counter({ value, className, lang, beimStart }: Props) {
  if (lang) {
    return (
      <CounterInner
        value={value}
        className={className}
        lang={lang}
        beimStart={beimStart}
      />
    );
  }
  return (
    <CounterFromContent
      value={value}
      className={className}
      beimStart={beimStart}
    />
  );
}

function CounterFromContent({
  value,
  className,
  beimStart,
}: Omit<Props, "lang">) {
  const { lang } = useContent();
  return (
    <CounterInner
      value={value}
      className={className}
      lang={lang}
      beimStart={beimStart}
    />
  );
}

function CounterInner({
  value,
  className,
  lang,
  beimStart = false,
}: Props & { lang: Lang }) {
  const ref = useRef<HTMLSpanElement>(null);

  const form = zerlege(value, lang);
  const target = form.zahl;
  const animatable = target !== null;
  const suffix = form.zusatz;

  const endwert =
    target !== null ? schreibe(target, form, lang) + suffix : value;

  /**
   * Der Endwert steht von Anfang an da, die Animation kommt obendrauf.
   *
   * Vorher stand hier `useState("0")`. Damit trug das ausgelieferte HTML eine
   * Null, und alles, was kein JavaScript ausführt, las sie: Vorleseprogramme
   * mit abgeschaltetem Skript, Antwortmaschinen, jeder Besucher mit
   * Skriptblocker. Auf einer Seite, deren erster Satz "Vier Systeme in
   * Produktion" lautet, stand darunter "0 Systeme in Produktion".
   *
   * Schlimmer noch, es traf auch Besucher mit JavaScript. Gemessen am
   * 02.08.2026 an der ausgelieferten Seite, drei Umgebungen, zehn Sekunden
   * ohne jede Eingabe: Desktop 1440, Telefon 390 und Reduced Motion zeigten
   * durchgehend "0,0,0,0". Der Kasten lag dabei vollständig im Sichtbereich,
   * 386 px unter der Oberkante eines 900 px hohen Fensters. Erst ein Scrollen
   * ließ den Beobachter anspringen, dann standen 4, 4.109, 1.276 und 7.437 da.
   *
   * Deshalb wird nie vorsorglich auf null gesetzt. Springt der Beobachter nie
   * an, bleibt schlicht die richtige Zahl stehen, der Fehlerfall ist damit
   * der stille Normalfall statt einer sichtbaren Falschaussage.
   */
  const [display, setDisplay] = useState(endwert);

  /**
   * Fuer `beimStart` steht der Endwert im HTML (kein Skript sieht die richtige
   * Zahl). Vor dem ersten Paint setzt das Layout den Zaehler auf null, damit
   * der Endwert nicht kurz aufblitzt und wieder herunterfällt.
   */
  useLayoutEffect(() => {
    if (!beimStart || !animatable) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("print").matches) return;
    /* Ohne setState: Sonst warnt der Hooks-Linter, und der Endwert steht
       trotzdem schon im React-Zustand fuer das ausgelieferte HTML. */
    if (ref.current) {
      ref.current.textContent = schreibe(0, form, lang) + suffix;
    }
    // form entsteht aus value und lang, beide stehen in den Abhaengigkeiten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animatable, beimStart, lang, suffix, value]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !animatable) return;

    /**
     * Bei Reduced Motion läuft gar nichts.
     *
     * `MotionConfig reducedMotion="user"` erreicht diese Stelle nicht: Der
     * imperative Aufruf `animate()` liest die Einstellung nicht, anders als
     * die Motion-Bauteile. Der Wunsch stand also im Dokument und wurde hier
     * übergangen. Da der Endwert ohnehin von Anfang an dasteht, ist die
     * richtige Antwort schlicht: nichts tun.
     */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let controls: { stop: () => void } | null = null;
    let done = false;

    const starten = () => {
      if (done) return;
      done = true;
      /**
       * Was schon beim ersten Bild im Vorspann steht, zaehlt nur hoch, wenn
       * das ausdruecklich gewuenscht ist (`beimStart`). Sonst wuerde die Zahl
       * vom richtigen Wert auf null zurueckspringen.
       *
       * Nachgeladenes unterhalb der Falz darf hochzaehlen, auch wenn der
       * Beobachter sofort feuert: Die 400-ms-Sperre nach dem Einhängen hat
       * genau das verhindert, sobald jemand schon weitergescrollt hatte,
       * bevor der Abschnitt in den Baum kam.
       */
      const schonImErstenBild =
        !beimStart &&
        window.scrollY < 40 &&
        el.getBoundingClientRect().top < window.innerHeight &&
        el.getBoundingClientRect().bottom > 0;
      if (schonImErstenBild) {
        setDisplay(endwert);
        return;
      }
      const start = performance.now();
      const dauer = 1400;
      let raf = 0;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / dauer);
        const eased = 1 - (1 - t) ** 3;
        const latest = target * eased;
        setDisplay(schreibe(latest, form, lang) + suffix);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      controls = { stop: () => cancelAnimationFrame(raf) };
    };

    const sofortSetzen = () => {
      if (done) return;
      done = true;
      setDisplay(endwert);
    };

    /**
     * Der Grund für den zusätzlichen Scroll-Wächter:
     *
     * Ein IntersectionObserver meldet nur, was den Sichtbereich tatsächlich
     * kreuzt. Springt jemand direkt zu einem Abschnitt (über die
     * Befehlspalette, einen Anker oder Pos1/Ende) landet dieses Element unter
     * Umständen oberhalb des Sichtbereichs, ohne ihn je berührt zu haben. Der
     * Beobachter schweigt dann für immer, und die Kennzahl bliebe auf "0"
     * stehen. Eine Seite, die mit belegbaren Zahlen argumentiert, darf einem
     * Besucher nicht "0 API-Routen" zeigen.
     *
     * Deshalb: übersprungen heißt sofort Endwert, ohne Animation.
     */
    const pruefeUebersprungen = () => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0) sofortSetzen();
    };

    /**
     * Und der Grund für den Druck-Wächter:
     *
     * Beim Drucken scrollt niemand. Der Beobachter feuert nie, die Zahl bleibt
     * auf "0", und genau das kommt aufs Papier. Gemessen am 02.08.2026 in der
     * Druckdarstellung der Startseite: Wo 11.892 Rezepte, 59 Tabellen und 12
     * Migrationen stehen sollten, standen 6.860, 34 und 7, eingefrorene
     * Zwischenwerte einer Animation, die niemand zu Ende laufen ließ.
     *
     * Eine falsche Zahl ist auf dieser Seite schlimmer als eine fehlende:
     * Sie ist als Beleg gemeint, und ein Beleg, der sich selbst widerspricht,
     * beweist das Gegenteil dessen, was er soll.
     *
     * `matchMedia("print")` deckt beides ab: Der Browser schaltet die Abfrage
     * um, während er die Seiten aufbaut, und `matches` ist schon beim Aufbau
     * wahr, wenn die Seite in einer Druckumgebung geladen wird.
     */
    const druck = window.matchMedia("print");

    /**
     * Anders als `sofortSetzen` fragt das hier nicht, ob schon gezählt wird:
     * Eine laufende Animation ist genau der Fall, der den Zwischenwert aufs
     * Papier bringt. Sie wird angehalten und auf den Endwert gesetzt.
     */
    const aufEndwert = () => {
      done = true;
      controls?.stop();
      setDisplay(endwert);
    };
    const beiDruck = () => {
      if (druck.matches) aufEndwert();
    };

    if (beimStart) {
      starten();
    } else {
      const io = new IntersectionObserver(
        (beobachtungen) => {
          for (const e of beobachtungen) if (e.isIntersecting) starten();
        },
        { threshold: 0.5 },
      );
      io.observe(el);
      pruefeUebersprungen();
      window.addEventListener("scroll", pruefeUebersprungen, { passive: true });
      druck.addEventListener("change", beiDruck);
      window.addEventListener("beforeprint", aufEndwert);
      beiDruck();
      return () => {
        io.disconnect();
        window.removeEventListener("scroll", pruefeUebersprungen);
        window.removeEventListener("beforeprint", aufEndwert);
        druck.removeEventListener("change", beiDruck);
        controls?.stop();
      };
    }

    beiDruck();
    window.addEventListener("beforeprint", aufEndwert);
    druck.addEventListener("change", beiDruck);
    return () => {
      window.removeEventListener("beforeprint", aufEndwert);
      druck.removeEventListener("change", beiDruck);
      controls?.stop();
    };
    /* `form` ist bei jedem Rendern ein neues Objekt und gehört deshalb nicht in
       die Liste: Es entsteht aus `value` und `lang`, und die beiden stehen
       hier. Mit `form` liefe der Effekt bei jedem Rendern neu an und die
       Animation begänne von vorn. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animatable, target, endwert, lang, value, beimStart]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
