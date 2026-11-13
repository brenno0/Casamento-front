# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Guests** of Nayane & Brenno's wedding. Most arrive on a phone from a personal invite link (`/c/:token`) sent over WhatsApp; ages range from friends to grandparents. Their jobs: learn when and where, confirm presence (RSVP), give a gift, leave a message.
- **The couple** (Nayane and Brenno), who run the wedding from a private panel (`/painel`): tasks, guests, vendors, finances, gift list, message moderation, trips, wedding-day timeline, site content.

## Product Purpose

The couple's own wedding site and planning tool for their wedding on 17 July 2027. Success: every guest finds the date, places and dress code without asking, confirms presence in under a minute, and the couple plans the whole wedding in one place.

## Positioning

A site built by the groom for this one wedding, not a template platform: each guest group gets a personal invite (envelope with their name, personal message, addresses and maps only behind the invite link).

## Operating Context

- Public layer (`/`) hides addresses, maps, RSVP and the message wall; the invite layer (`/c/:token`) shows them.
- Content (story, places, dress code and its color swatches, FAQ, gallery, gifts) is edited by the couple in the panel and served by an API.
- Gifts are paid through an external checkout; `/presente/retorno` is the return page.
- All copy is Brazilian Portuguese.

## Capabilities and Constraints

- React 19, React Router, TanStack Query, Tailwind CSS 4 (tokens in `src/styles/theme.css`), GSAP and AnimeJS for motion, Leaflet for maps.
- Existing tests assert on visible text, roles and labels; behaviour and copy must keep working.
- Reduced-motion preference is honoured everywhere.

## Brand Commitments

- Names and date: Nayane & Brenno, 17.07.2027.
- No visual identity is committed elsewhere (confirmed by the couple, 2026-11-13): colors, fonts and layout are free.
- The couple likes clear, generously spaced design.

## Evidence on Hand

- The couple has, or will have, plenty of good photographs for the story and gallery sections (confirmed 2026-11-13). None are in the repository; they are uploaded through the panel.
- No real story text, addresses or FAQ live in the repository; they come from the API.

## Product Principles

1. The guest's three questions (when, where, how do I confirm) are answered before anything decorative.
2. It is one couple's wedding, not a wedding product: personal over polished-generic.
3. Works for a grandparent on a phone as well as for a friend on a laptop.
4. The panel is a working tool: calm and scannable, sharing the site's identity without its ceremony.

## Accessibility & Inclusion

Readable for older guests: generous text size, strong contrast, large touch targets, reduced-motion support.
