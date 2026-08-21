# Orientierungsberatung Bewertung — Landingpage

Statische Landingpage für die ibras® Orientierungsberatung Bewertung.
Kein Build-Schritt nötig — reines HTML/CSS, eine Datei (`index.html`) plus
acht Icon-Grafiken.

## Deployment (Vercel)

1. Dieses Repository bei [vercel.com](https://vercel.com) importieren
   ("Add New" → "Project" → Repository auswählen).
2. Framework Preset: **Other** (kein Build-Command, kein Output-Directory
   nötig — Vercel liefert `index.html` direkt aus).
3. Deploy.
4. Unter **Settings → Domains** die Domain `orientierungsberatung.de`
   hinzufügen und die dort angezeigten DNS-Einträge beim Domain-Registrar
   setzen (i. d. R. ein A-Record auf `76.76.21.21` für die nackte Domain
   und ein CNAME für `www`, das Vercel individuell anzeigt).

## Lokale Vorschau

Einfach `index.html` im Browser öffnen, oder z. B. mit:

```bash
npx serve .
```

## Struktur

- `index.html` — komplette Seite (Inline-CSS, keine externen Abhängigkeiten
  außer der Google-Font "Newsreader"/"Lato")
- `icon-*.png` — Leistungs-Icons (aus dem Original-Flyer extrahiert)
- Für das Porträtfoto: `christian-lueth.jpg` in diesen Ordner legen —
  die Seite bindet es automatisch ein, sobald es vorhanden ist (siehe
  Bild-Anleitung).
