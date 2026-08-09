import { describe, expect, it } from "vitest";
import { mailAdresse } from "./mailto";

describe("mailAdresse", () => {
  it("bleibt ohne Betreff eine schlichte Adresse", () => {
    expect(mailAdresse("a@b.de")).toBe("mailto:a@b.de");
    expect(mailAdresse("a@b.de", "")).toBe("mailto:a@b.de");
  });

  it("hängt den Betreff als Abfrage an", () => {
    expect(mailAdresse("a@b.de", "Hallo")).toBe("mailto:a@b.de?subject=Hallo");
  });

  it("kodiert Leerzeichen und Umlaute", () => {
    expect(mailAdresse("a@b.de", "Anfrage über die Seite")).toBe(
      "mailto:a@b.de?subject=Anfrage%20%C3%BCber%20die%20Seite",
    );
  });

  it("kodiert das kaufmännische Und", () => {
    /* Ohne Kodierung endet der Betreff vor dem Zeichen, und der Rest wird zu
       einem eigenen Feld, die Nachricht käme mit halbem Betreff an. */
    const adresse = mailAdresse("a@b.de", "Recruiting & Hiring");
    expect(adresse).toBe("mailto:a@b.de?subject=Recruiting%20%26%20Hiring");
    expect(adresse.split("&")).toHaveLength(1);
  });
});
