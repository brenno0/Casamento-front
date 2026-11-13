# Design: Mesa Posta

The wedding table laid for each guest. Tokens live in `src/styles/theme.css`.

## Colour

| Token | Value | Role |
|---|---|---|
| `linho` | `#f6f7f3` | Page ground (white linen) |
| `linho-escuro` | `#e9ede5` | Quiet fills, hover |
| `papel` | `#ffffff` | Cards, fields, alternate bands |
| `tinta` | `#17241c` | Body text, overlays |
| `verde` | `#1f3d2e` | Headings, primary actions, full-bleed bands |
| `verde-suave` | `#4d6255` | Secondary text |
| `musgo` | `#3d6a50` | Small accents, ampersand |
| `folha` / `folha-claro` / `folha-escuro` | `#d3dccf` / `#e3ebdf` / `#a9b9a8` | Hairlines, badges, field borders |
| `vela` / `vela-claro` | `#f0d277` / `#faf0cc` | Candle accent: times on green, selected and success states |
| `erro` | `#a3352b` | Errors, overdue, destructive actions |

Green is committed in whole bands (places section, footer, panel sidebar), never as scattered accents. Inside a green band add `sobre-verde` so buttons invert.

## Type

- `font-display` Libre Caslon Display: h1, h2, names, large numerals.
- `font-caslon` Libre Caslon Text: h3, quotes, short statements, italic ampersand.
- `font-sans` Figtree: body, labels, controls. Body 17px, line-height 1.65.
- `.versalete`: spaced small caps for dates.
- Display size tops out at 6rem.

## Shape and depth

- Paper has near-square corners: `rounded-card` 4px, `rounded-botao` 3px.
- `.cartao-mesa`: white card, soft shadow, fine inner rule (place card, login, thank-you).
- Photographs are prints: white `p-3` mat with `shadow-suave`, 4:5 crop.
- Lists separate with hairlines (`border-folha-escuro`), not boxed cards.

## Components

`.botao` (solid green, min height 48px), `.botao-contorno`, `.campo` (form field). Choice pairs (Vou / Não vou, PIX / Cartão) are two equal buttons that fill green when selected.

## Layout

- Guest sections: `py-24` mobile, `8rem` desktop, max width `6xl`. Narrow sections place the heading in a sticky left column (4/12) and content right (8/12); wide sections stack.
- Panel: green sidebar, linen content area, same tokens in a calmer register.

## Motion

One authored entrance: the names rise from behind a fold on load. Photos reveal on scroll. The invite place card opens once. All motion is off under `prefers-reduced-motion`.
