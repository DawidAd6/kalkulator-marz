# Kalkulator Marży 

Kalkulator marży dla sprzedawców dropshippingowych. Oblicz zysk i rentowność ofert na **Allegro**, **Temu** i **AliExpress**.

🔗 **Live demo:** [kalkulator-marz.vercel.app](https://kalkulator-marz.vercel.app)

---

## Funkcje

- 📊 Obliczanie zysku i marży na sztuce
- 💱 Przeliczanie walut (PLN, USD, EUR, CNY, GBP)
- 🧾 Uwzględnienie VAT, prowizji platformy, kosztów reklamy, pakowania i zwrotów
- 📈 Kalkulator ceny minimalnej (break-even)
- 📉 Wykres kołowy podziału kosztów
- 🗂️ Historia obliczeń z wyszukiwaniem, sortowaniem i filtrowaniem
- 📤 Eksport historii do CSV (kompatybilny z Excel PL)
- 🔗 Udostępnianie wyliczeń przez URL
- 🌙 Tryb ciemny / jasny
- ⚡ PWA – działa offline po pierwszym załadowaniu
- 📱 Responsywny – działa na telefonie i tablecie

## Szybkie szablony

| Szablon | Platforma | Waluta |
|---|---|---|
| AliExpress produkt | AliExpress (8%) | USD |
| Allegro produkt | Allegro (12%) | PLN |
| Temu produkt | Temu (5%) | USD |

---

## Technologie

- Vanilla HTML / CSS / JavaScript (ES Modules)
- Canvas API (wykres donut)
- Service Worker (PWA / offline)
- LocalStorage (historia)
- Web Share / Clipboard API

---

## Uruchamianie lokalnie

Projekt jest czystym frontendem bez żadnych zależności. Wymagany serwer HTTP (ze względu na ES Modules i Service Worker):

```bash
# Python 3
python -m http.server 3000

# Node.js (npx)
npx serve .
```

Następnie otwórz `http://localhost:3000`.

---


## Struktura projektu

```
├── index.html          # Główny plik HTML
├── manifest.json       # PWA manifest
├── sw.js               # Service Worker
├── css/
│   └── style.css       # Style (dark/light theme, responsive)
└── js/
    ├── app.js          # Logika UI i zdarzenia
    ├── calculator.js   # Obliczenia marży i break-even
    ├── history.js      # Zarządzanie historią i eksport CSV
    └── validation.js   # Walidacja formularza
```

---

## Licencja

MIT © 2026
