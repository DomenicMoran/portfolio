# Was nur du erledigen kannst

Diese Datei enthält ausschließlich das. Alles andere steht im Code oder ist
bereits erledigt.

---

## 1. Seit wann arbeitest du agentengestützt?

**Wo das steht:** Im Abschnitt „Arbeitsweise" auf der Startseite, in beiden
Sprachen — „Ich arbeite seit über einem Jahr agentengestützt" /
„I have worked agent-assisted for over a year".

**Warum es hier steht:** Es ist die einzige Zeitangabe der Seite, die nicht
aus einer Quelle gerechnet wird. Alle anderen sind es: die Bauzeit aus dem
ersten Commit, die Lernjahre aus 2022, die Tage je Salati-Version aus dem
Änderungsprotokoll. Diese eine ist getippt und steht seitdem still.

Damit hat sie das Problem, das die anderen zwei schon hatten und das im Code
dokumentiert ist: Sie wird nicht falsch, sie wird still zu klein. In einem
Jahr steht dort „über einem Jahr", wo „über zwei Jahren" richtig wäre — und
niemand merkt es, weil nichts sie prüft.

**Was ich versucht habe:** Aus den Repos ableiten. Die früheste
Agenten-Konvention (`CLAUDE.md`) liegt im MenuCloud-Repo vom 26.03.2026, und
das ist zugleich dessen erster Commit. SalatiTech und NOURI haben keine.
Damit belegen die Repos vier Monate, nicht ein Jahr — die Arbeit davor liegt
außerhalb dieser Historie. Ich kann die Angabe also weder herleiten noch
prüfen und habe sie deshalb unverändert gelassen.

**Was ich brauche:** Ein Datum, ab dem du agentengestützt arbeitest — Monat
und Jahr genügen. Dann wird daraus dieselbe gerechnete Angabe wie überall
sonst, sie wächst von allein mit, und `check-figures` kann sie mitprüfen.
