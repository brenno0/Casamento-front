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

Green is committed in whole bands (places section, footer), never as scattered accents. Inside a green band add `sobre-verde` so buttons invert.

## Couple's panel

The private panel and its login drop the green for a light, romantic work tool: rosy mist ground, white cards, warm graphite ink, rosé accents. Every panel screen sits under `.painel`, which also swaps the paper radii for soft ones (`rounded-card` 16px, `rounded-botao` pill) and points focus, carets and checkboxes at graphite.

| Token | Value | Role |
|---|---|---|
| `nevoa` / `nevoa-escuro` | `#faf7f5` / `#f1ebe8` | Page ground; quiet fills, tracks, hover |
| `linha` / `linha-forte` | `#ece4e1` / `#ddd2ce` | Hairlines; field and table-header borders |
| `grafite` / `grafite-suave` | `#1f1a1c` / `#77696d` | Text and primary actions; secondary text |
| `rose` / `rose-claro` / `rose-fundo` | `#e4b8bd` / `#f8ebec` / `#a85561` | Accents: badges, progress, links, "now" |
| `lavanda-claro`, `pessego-claro` | `#eeeaf7`, `#fcebdf` | Secondary badge tints |

Primary action is a graphite pill (`.acao`); colour stays in small tints on badges and bars.

- Type: Inter at 15px and Instrument Serif in place of Caslon (`.painel` swaps `--font-sans` and `--font-display`); serif only for the page h1, dialog titles and the couple's names. KPI figures use `.numero` (sans 500, tight tracking) with the denominator greyed.
- Frame: the sidebar sits on the mist; the page is a white sheet with a 20px radius. Nav items carry a 16px line icon (`IconePainel`), grouped under small uppercase labels; the active item is a raised white chip.
- Surfaces: `.cartao-painel` (18px radius, hairline, soft shadow); `.bandeja` holds a label row with icon over a white card (overview KPIs). People show as pastel initial avatars (`Avatar`).
- Controls: `.segmentos`/`.abas` are one segmented control, the chosen option a raised white pill. Secondary actions are white pills with a hairline.
- States: loading is `Esqueleto` (shimmering blocks, "Carregando…" for screen readers); empty lists use `Vazio` (dashed tray, icon in a mist circle). Badges can carry a dot (`.selo-ponto`); `.selo-alerta` is the dark pill with a rosé dot for what needs action (guests without an answer).
- Destructive actions have no confirm step: `BotaoSegurar` fills while held (pointer, touch, Space or Enter) and fires after 900ms; releasing cancels. Drawers carry a close button (`BotaoFechar`) in the title row.
- Motion: dialogs open as drawers (from the right on wide screens, from the bottom on phones) over a blurred backdrop; page sections rise in sequence; progress bars grow in; `.barra.tracos` renders as a tick ruler. GSAP slides the white nav chip to the active item and counts the overview numbers up. On the overview, a three.js canvas drops a few rose petals behind the title; it loads lazily, pauses off screen or in a hidden tab, and never loads under reduced motion. All of it collapses under reduced motion.

## Type

- `font-display` Libre Caslon Display: h1, h2, names, large numerals.
- `font-caslon` Libre Caslon Text: h3, quotes, short statements, italic ampersand.
- `font-sans` Figtree: body, labels, controls. Body 17px, line-height 1.65.
- `.versalete`: spaced small caps for dates.
- Display size tops out at 6rem.

## Shape and depth

- Paper has near-square corners: `rounded-card` 4px, `rounded-botao` 3px.
- `.cartao-mesa`: white card, soft shadow, fine inner rule (place card, thank-you).
- Photographs are prints: white `p-3` mat with `shadow-suave`, 4:5 crop.
- Lists separate with hairlines (`border-folha-escuro`), not boxed cards.

## Components

`.botao` (solid green, min height 48px), `.botao-contorno`, `.campo` (form field). Choice pairs (Vou / Não vou, PIX / Cartão) are two equal buttons that fill green when selected.

## Layout

- Guest sections: `py-24` mobile, `8rem` desktop, max width `6xl`. Narrow sections place the heading in a sticky left column (4/12) and content right (8/12); wide sections stack.
- Panel: green sidebar, linen content area, same tokens in a calmer register.

## Motion

One authored entrance: the names rise from behind a fold on load. Photos reveal on scroll. The invite place card opens once. All motion is off under `prefers-reduced-motion`.
