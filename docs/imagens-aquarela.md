# Watercolour images for the redesign

Prompts for Gemini's image generator. The site becomes a hand-painted invitation built around the church painting.

## How to generate

1. Attach `public/images/casal/igreja.jpg` to every prompt as the style reference (except `papel.jpg`).
2. Copy the whole code block; each prompt already carries the shared style instructions.
3. Pick the aspect ratio listed for the image. If that ratio is not offered, pick the closest one.
4. Ask for the highest resolution available (longest side 2000px or more).
5. Save with the exact file name into `public/images/aquarela/`. PNG or JPG both work.

Gemini does not produce real transparency. Every image is asked on pure white; the code blends the white into the paper.
If a result comes back with a checkerboard, grey or tinted background, any text, or a frame, regenerate it.

**White flowers.** All flowers are white. The white of the image becomes the cream paper of the page, exactly as in a real
watercolour where white petals are bare paper. So a white flower is only visible through what surrounds it: grey-green petal
shadows, a yellow centre and dark leaves behind it. If a result has white flowers floating on the white background with no
dark foliage behind them, regenerate it: they would disappear on the site.

Generate the *Must have* group first: the hero and the general look depend only on those six.

## Must have

### 1. `igreja-hero.png`

- **Aspect ratio:** 16:9
- **Used for:** Hero, desktop. Opens the page under the names.

```
Repaint the attached church painting at higher resolution and finer detail. Keep the same composition, the same building, tower, clock, cross, awning, trees and palm, and the same colours. Leave generous empty white sky above the cross (about one fifth of the height). Let the bottom edge dissolve into loose pale green and ochre washes and a few paint splatters instead of ending in a hard ground line. The left and right edges fade out softly into white.

Style: hand-painted watercolour on cotton paper, matching the attached reference painting exactly: loose wet-on-wet washes, visible brush marks, pigment pooling at the edges, soft uneven edges that fade out. Palette limited to warm ochre and sand yellows (#E3B866, #F0D9A8), sage and olive greens (#8FA583, #5E7A4E, #2F4A36), and small touches of terracotta (#C0715A). Flowers: every flower is white, never yellow, ochre, pink or terracotta. Paint each white flower by leaving the petals almost unpainted and defining them with soft warm-grey and pale sage shadows, a small ochre-yellow centre, and darker green leaves directly behind and around the petals, so the white shape reads clearly by contrast. No white flower may sit alone against the empty white background: it always overlaps dark foliage or a darker object. No ink outlines, no text, no letters, no numbers, no border, no frame, no drop shadow, no paper texture, no photorealism, no 3D render. Isolated on a pure flat white background (#FFFFFF), no checkerboard, no grey.
```

### 2. `igreja-retrato.png`

- **Aspect ratio:** 4:5 (portrait)
- **Used for:** Hero on phones.

```
The same church as the attached painting, recomposed vertically. The tower stands centred and tall with the cross near the top, the entrance and awning below it, one leafy tree on the left and the palm tree on the right, both partly cropped by soft fading edges. Empty white sky above the cross. The bottom dissolves into pale green and ochre washes.

Style: hand-painted watercolour on cotton paper, matching the attached reference painting exactly: loose wet-on-wet washes, visible brush marks, pigment pooling at the edges, soft uneven edges that fade out. Palette limited to warm ochre and sand yellows (#E3B866, #F0D9A8), sage and olive greens (#8FA583, #5E7A4E, #2F4A36), and small touches of terracotta (#C0715A). Flowers: every flower is white, never yellow, ochre, pink or terracotta. Paint each white flower by leaving the petals almost unpainted and defining them with soft warm-grey and pale sage shadows, a small ochre-yellow centre, and darker green leaves directly behind and around the petals, so the white shape reads clearly by contrast. No white flower may sit alone against the empty white background: it always overlaps dark foliage or a darker object. No ink outlines, no text, no letters, no numbers, no border, no frame, no drop shadow, no paper texture, no photorealism, no 3D render. Isolated on a pure flat white background (#FFFFFF), no checkerboard, no grey.
```

### 3. `papel.jpg`

- **Aspect ratio:** 1:1
- **Used for:** Page background, tiled. The only image without a white background.

```
Seamless, tileable texture of warm off-white cold-press watercolour paper photographed flat. Very subtle, fine, even grain; soft even lighting; no stains, no creases, no objects, no vignette, no darker corners, no text. Uniform colour very close to #F7F3EA. The left edge must match the right edge and the top must match the bottom so it can repeat without visible seams.
```

### 4. `ramo-canto.png`

- **Aspect ratio:** 1:1
- **Used for:** Corner flourish on sections and cards (I mirror it for the other corners).

```
A corner botanical arrangement that sits only in the top-left corner of the image and thins out toward the centre, leaving the bottom-right two thirds completely empty white. Overlapping tropical leaves, two palm fronds, olive sprigs with small leaves, and three or four small white wildflowers nestled among the darkest leaves. Leaves reach along the top edge and down the left edge like an L.

Style: hand-painted watercolour on cotton paper, matching the attached reference painting exactly: loose wet-on-wet washes, visible brush marks, pigment pooling at the edges, soft uneven edges that fade out. Palette limited to warm ochre and sand yellows (#E3B866, #F0D9A8), sage and olive greens (#8FA583, #5E7A4E, #2F4A36), and small touches of terracotta (#C0715A). Flowers: every flower is white, never yellow, ochre, pink or terracotta. Paint each white flower by leaving the petals almost unpainted and defining them with soft warm-grey and pale sage shadows, a small ochre-yellow centre, and darker green leaves directly behind and around the petals, so the white shape reads clearly by contrast. No white flower may sit alone against the empty white background: it always overlaps dark foliage or a darker object. No ink outlines, no text, no letters, no numbers, no border, no frame, no drop shadow, no paper texture, no photorealism, no 3D render. Isolated on a pure flat white background (#FFFFFF), no checkerboard, no grey.
```

### 5. `arco-folhas.png`

- **Aspect ratio:** 4:5 (portrait)
- **Used for:** Frame around arched couple photos.

```
A botanical arch. Two leafy branches rise from the bottom-left and bottom-right corners, follow the sides upward and meet at the top in a rounded arch. The whole centre is completely empty white, and the arch is open at the bottom. Olive and sage leaves of varied sizes, a few palm fronds, small white flowers and buds scattered along the branches, each one set against darker leaves. The arch is thin: foliage occupies only the outer 15 percent of the image.

Style: hand-painted watercolour on cotton paper, matching the attached reference painting exactly: loose wet-on-wet washes, visible brush marks, pigment pooling at the edges, soft uneven edges that fade out. Palette limited to warm ochre and sand yellows (#E3B866, #F0D9A8), sage and olive greens (#8FA583, #5E7A4E, #2F4A36), and small touches of terracotta (#C0715A). Flowers: every flower is white, never yellow, ochre, pink or terracotta. Paint each white flower by leaving the petals almost unpainted and defining them with soft warm-grey and pale sage shadows, a small ochre-yellow centre, and darker green leaves directly behind and around the petals, so the white shape reads clearly by contrast. No white flower may sit alone against the empty white background: it always overlaps dark foliage or a darker object. No ink outlines, no text, no letters, no numbers, no border, no frame, no drop shadow, no paper texture, no photorealism, no 3D render. Isolated on a pure flat white background (#FFFFFF), no checkerboard, no grey.
```

### 6. `divisor.png`

- **Aspect ratio:** 21:9 (or the widest ratio available)
- **Used for:** Divider between sections.

```
A single thin horizontal leafy sprig running left to right across the middle of the image, roughly symmetrical, with one tiny white flower at its centre resting on two darker leaves, and small leaves pointing outward on both sides. It is delicate and occupies only a narrow band; everything above and below is empty white.

Style: hand-painted watercolour on cotton paper, matching the attached reference painting exactly: loose wet-on-wet washes, visible brush marks, pigment pooling at the edges, soft uneven edges that fade out. Palette limited to warm ochre and sand yellows (#E3B866, #F0D9A8), sage and olive greens (#8FA583, #5E7A4E, #2F4A36), and small touches of terracotta (#C0715A). Flowers: every flower is white, never yellow, ochre, pink or terracotta. Paint each white flower by leaving the petals almost unpainted and defining them with soft warm-grey and pale sage shadows, a small ochre-yellow centre, and darker green leaves directly behind and around the petals, so the white shape reads clearly by contrast. No white flower may sit alone against the empty white background: it always overlaps dark foliage or a darker object. No ink outlines, no text, no letters, no numbers, no border, no frame, no drop shadow, no paper texture, no photorealism, no 3D render. Isolated on a pure flat white background (#FFFFFF), no checkerboard, no grey.
```

## Section vignettes

### 7. `v-encontro.png`

- **Aspect ratio:** 1:1
- **Used for:** Story chapter: first date (cinema).

```
A small still life: a red-and-cream striped popcorn box overflowing with popcorn and two paper cinema tickets leaning against it, with one small leafy sprig beside them. Single object group centred, occupying about half the image, lots of empty white around it.

Style: hand-painted watercolour on cotton paper, matching the attached reference painting exactly: loose wet-on-wet washes, visible brush marks, pigment pooling at the edges, soft uneven edges that fade out. Palette limited to warm ochre and sand yellows (#E3B866, #F0D9A8), sage and olive greens (#8FA583, #5E7A4E, #2F4A36), and small touches of terracotta (#C0715A). Flowers: every flower is white, never yellow, ochre, pink or terracotta. Paint each white flower by leaving the petals almost unpainted and defining them with soft warm-grey and pale sage shadows, a small ochre-yellow centre, and darker green leaves directly behind and around the petals, so the white shape reads clearly by contrast. No white flower may sit alone against the empty white background: it always overlaps dark foliage or a darker object. No ink outlines, no text, no letters, no numbers, no border, no frame, no drop shadow, no paper texture, no photorealism, no 3D render. Isolated on a pure flat white background (#FFFFFF), no checkerboard, no grey.
```

### 8. `v-viagem.png`

- **Aspect ratio:** 1:1
- **Used for:** Story chapter: first trip (Porto de Galinhas).

```
A small tropical beach vignette with soft irregular edges: turquoise shallow sea, a strip of pale sand, one leaning coconut palm and a small wooden sailing raft (jangada) with a white triangular sail. Centred, occupying about half the image, lots of empty white around it.

Style: hand-painted watercolour on cotton paper, matching the attached reference painting exactly: loose wet-on-wet washes, visible brush marks, pigment pooling at the edges, soft uneven edges that fade out. Palette limited to warm ochre and sand yellows (#E3B866, #F0D9A8), sage and olive greens (#8FA583, #5E7A4E, #2F4A36), and small touches of terracotta (#C0715A). Flowers: every flower is white, never yellow, ochre, pink or terracotta. Paint each white flower by leaving the petals almost unpainted and defining them with soft warm-grey and pale sage shadows, a small ochre-yellow centre, and darker green leaves directly behind and around the petals, so the white shape reads clearly by contrast. No white flower may sit alone against the empty white background: it always overlaps dark foliage or a darker object. No ink outlines, no text, no letters, no numbers, no border, no frame, no drop shadow, no paper texture, no photorealism, no 3D render. Isolated on a pure flat white background (#FFFFFF), no checkerboard, no grey.
```

### 9. `v-pedido.png`

- **Aspect ratio:** 1:1
- **Used for:** Story chapter: the proposal.

```
A small still life: an open ring box in dark green velvet holding a gold engagement ring with a single small stone, and a tiny white flower lying on two dark olive leaves beside it. Centred, occupying about half the image, lots of empty white around it.

Style: hand-painted watercolour on cotton paper, matching the attached reference painting exactly: loose wet-on-wet washes, visible brush marks, pigment pooling at the edges, soft uneven edges that fade out. Palette limited to warm ochre and sand yellows (#E3B866, #F0D9A8), sage and olive greens (#8FA583, #5E7A4E, #2F4A36), and small touches of terracotta (#C0715A). Flowers: every flower is white, never yellow, ochre, pink or terracotta. Paint each white flower by leaving the petals almost unpainted and defining them with soft warm-grey and pale sage shadows, a small ochre-yellow centre, and darker green leaves directly behind and around the petals, so the white shape reads clearly by contrast. No white flower may sit alone against the empty white background: it always overlaps dark foliage or a darker object. No ink outlines, no text, no letters, no numbers, no border, no frame, no drop shadow, no paper texture, no photorealism, no 3D render. Isolated on a pure flat white background (#FFFFFF), no checkerboard, no grey.
```

### 10. `v-cerimonia.png`

- **Aspect ratio:** 1:1
- **Used for:** Ceremony section.

```
Two plain gold wedding rings interlocked and tied with a thin sage green ribbon to a small olive sprig. Centred, occupying about half the image, lots of empty white around it.

Style: hand-painted watercolour on cotton paper, matching the attached reference painting exactly: loose wet-on-wet washes, visible brush marks, pigment pooling at the edges, soft uneven edges that fade out. Palette limited to warm ochre and sand yellows (#E3B866, #F0D9A8), sage and olive greens (#8FA583, #5E7A4E, #2F4A36), and small touches of terracotta (#C0715A). Flowers: every flower is white, never yellow, ochre, pink or terracotta. Paint each white flower by leaving the petals almost unpainted and defining them with soft warm-grey and pale sage shadows, a small ochre-yellow centre, and darker green leaves directly behind and around the petals, so the white shape reads clearly by contrast. No white flower may sit alone against the empty white background: it always overlaps dark foliage or a darker object. No ink outlines, no text, no letters, no numbers, no border, no frame, no drop shadow, no paper texture, no photorealism, no 3D render. Isolated on a pure flat white background (#FFFFFF), no checkerboard, no grey.
```

### 11. `v-traje.png`

- **Aspect ratio:** 1:1
- **Used for:** Dress code section.

```
A dark green men's suit and an elegant long flowing dress in soft terracotta hanging side by side on two wooden hangers, with a small leafy sprig between the hangers. No people, no faces. Centred, occupying about two thirds of the image, empty white around it.

Style: hand-painted watercolour on cotton paper, matching the attached reference painting exactly: loose wet-on-wet washes, visible brush marks, pigment pooling at the edges, soft uneven edges that fade out. Palette limited to warm ochre and sand yellows (#E3B866, #F0D9A8), sage and olive greens (#8FA583, #5E7A4E, #2F4A36), and small touches of terracotta (#C0715A). Flowers: every flower is white, never yellow, ochre, pink or terracotta. Paint each white flower by leaving the petals almost unpainted and defining them with soft warm-grey and pale sage shadows, a small ochre-yellow centre, and darker green leaves directly behind and around the petals, so the white shape reads clearly by contrast. No white flower may sit alone against the empty white background: it always overlaps dark foliage or a darker object. No ink outlines, no text, no letters, no numbers, no border, no frame, no drop shadow, no paper texture, no photorealism, no 3D render. Isolated on a pure flat white background (#FFFFFF), no checkerboard, no grey.
```

### 12. `v-presentes.png`

- **Aspect ratio:** 1:1
- **Used for:** Gifts section.

```
A gift box wrapped in cream paper, tied with a sage green ribbon and bow, with a dark green leaf and a small white flower tucked into the bow, the flower resting on the leaf. Centred, occupying about half the image, lots of empty white around it.

Style: hand-painted watercolour on cotton paper, matching the attached reference painting exactly: loose wet-on-wet washes, visible brush marks, pigment pooling at the edges, soft uneven edges that fade out. Palette limited to warm ochre and sand yellows (#E3B866, #F0D9A8), sage and olive greens (#8FA583, #5E7A4E, #2F4A36), and small touches of terracotta (#C0715A). Flowers: every flower is white, never yellow, ochre, pink or terracotta. Paint each white flower by leaving the petals almost unpainted and defining them with soft warm-grey and pale sage shadows, a small ochre-yellow centre, and darker green leaves directly behind and around the petals, so the white shape reads clearly by contrast. No white flower may sit alone against the empty white background: it always overlaps dark foliage or a darker object. No ink outlines, no text, no letters, no numbers, no border, no frame, no drop shadow, no paper texture, no photorealism, no 3D render. Isolated on a pure flat white background (#FFFFFF), no checkerboard, no grey.
```

### 13. `v-galeria.png`

- **Aspect ratio:** 1:1
- **Used for:** Gallery section.

```
A vintage film camera in warm brown and cream tones seen from the front, slightly angled, with a small white flower and two dark green leaves resting on top of it, the flower in front of the leaves and the dark camera body. Centred, occupying about half the image, lots of empty white around it.

Style: hand-painted watercolour on cotton paper, matching the attached reference painting exactly: loose wet-on-wet washes, visible brush marks, pigment pooling at the edges, soft uneven edges that fade out. Palette limited to warm ochre and sand yellows (#E3B866, #F0D9A8), sage and olive greens (#8FA583, #5E7A4E, #2F4A36), and small touches of terracotta (#C0715A). Flowers: every flower is white, never yellow, ochre, pink or terracotta. Paint each white flower by leaving the petals almost unpainted and defining them with soft warm-grey and pale sage shadows, a small ochre-yellow centre, and darker green leaves directly behind and around the petals, so the white shape reads clearly by contrast. No white flower may sit alone against the empty white background: it always overlaps dark foliage or a darker object. No ink outlines, no text, no letters, no numbers, no border, no frame, no drop shadow, no paper texture, no photorealism, no 3D render. Isolated on a pure flat white background (#FFFFFF), no checkerboard, no grey.
```

### 14. `v-duvidas.png`

- **Aspect ratio:** 1:1
- **Used for:** Questions section.

```
An open cream envelope with a folded letter sliding out of it and a small leafy sprig tucked inside. The letter is blank. Centred, occupying about half the image, lots of empty white around it.

Style: hand-painted watercolour on cotton paper, matching the attached reference painting exactly: loose wet-on-wet washes, visible brush marks, pigment pooling at the edges, soft uneven edges that fade out. Palette limited to warm ochre and sand yellows (#E3B866, #F0D9A8), sage and olive greens (#8FA583, #5E7A4E, #2F4A36), and small touches of terracotta (#C0715A). Flowers: every flower is white, never yellow, ochre, pink or terracotta. Paint each white flower by leaving the petals almost unpainted and defining them with soft warm-grey and pale sage shadows, a small ochre-yellow centre, and darker green leaves directly behind and around the petals, so the white shape reads clearly by contrast. No white flower may sit alone against the empty white background: it always overlaps dark foliage or a darker object. No ink outlines, no text, no letters, no numbers, no border, no frame, no drop shadow, no paper texture, no photorealism, no 3D render. Isolated on a pure flat white background (#FFFFFF), no checkerboard, no grey.
```

### 15. `v-chegar.png`

- **Aspect ratio:** 1:1
- **Used for:** How to get there section.

```
A partly unfolded paper map in soft cream and pale green with a winding dotted path and one small terracotta location pin standing on it. No place names or writing on the map. Centred, occupying about half the image, lots of empty white around it.

Style: hand-painted watercolour on cotton paper, matching the attached reference painting exactly: loose wet-on-wet washes, visible brush marks, pigment pooling at the edges, soft uneven edges that fade out. Palette limited to warm ochre and sand yellows (#E3B866, #F0D9A8), sage and olive greens (#8FA583, #5E7A4E, #2F4A36), and small touches of terracotta (#C0715A). Flowers: every flower is white, never yellow, ochre, pink or terracotta. Paint each white flower by leaving the petals almost unpainted and defining them with soft warm-grey and pale sage shadows, a small ochre-yellow centre, and darker green leaves directly behind and around the petals, so the white shape reads clearly by contrast. No white flower may sit alone against the empty white background: it always overlaps dark foliage or a darker object. No ink outlines, no text, no letters, no numbers, no border, no frame, no drop shadow, no paper texture, no photorealism, no 3D render. Isolated on a pure flat white background (#FFFFFF), no checkerboard, no grey.
```

## Nice to have

### 16. `lacre.png`

- **Aspect ratio:** 1:1
- **Used for:** Wax seal; I set the N&B monogram on it in code.

```
A round wax seal in sage green seen straight from above, with an irregular melted rim and a plain, smooth, slightly sunken circular centre. No monogram, no emblem. Centred, occupying about half the image. This one object may have soft realistic shading, but stays painted in watercolour.

Style: hand-painted watercolour on cotton paper, matching the attached reference painting exactly: loose wet-on-wet washes, visible brush marks, pigment pooling at the edges, soft uneven edges that fade out. Palette limited to warm ochre and sand yellows (#E3B866, #F0D9A8), sage and olive greens (#8FA583, #5E7A4E, #2F4A36), and small touches of terracotta (#C0715A). Flowers: every flower is white, never yellow, ochre, pink or terracotta. Paint each white flower by leaving the petals almost unpainted and defining them with soft warm-grey and pale sage shadows, a small ochre-yellow centre, and darker green leaves directly behind and around the petals, so the white shape reads clearly by contrast. No white flower may sit alone against the empty white background: it always overlaps dark foliage or a darker object. No ink outlines, no text, no letters, no numbers, no border, no frame, no drop shadow, no paper texture, no photorealism, no 3D render. Isolated on a pure flat white background (#FFFFFF), no checkerboard, no grey.
```

### 17. `mancha-verde.png`

- **Aspect ratio:** 3:2
- **Used for:** Soft wash behind headings and cards.

```
An abstract watercolour wash stain in very pale sage green, wide and horizontal, with irregular feathered edges, darker pigment pooling along parts of the rim and two or three tiny splatters nearby. Nothing else in the image.

Style: hand-painted watercolour on cotton paper, matching the attached reference painting exactly: loose wet-on-wet washes, visible brush marks, pigment pooling at the edges, soft uneven edges that fade out. Palette limited to warm ochre and sand yellows (#E3B866, #F0D9A8), sage and olive greens (#8FA583, #5E7A4E, #2F4A36), and small touches of terracotta (#C0715A). Flowers: every flower is white, never yellow, ochre, pink or terracotta. Paint each white flower by leaving the petals almost unpainted and defining them with soft warm-grey and pale sage shadows, a small ochre-yellow centre, and darker green leaves directly behind and around the petals, so the white shape reads clearly by contrast. No white flower may sit alone against the empty white background: it always overlaps dark foliage or a darker object. No ink outlines, no text, no letters, no numbers, no border, no frame, no drop shadow, no paper texture, no photorealism, no 3D render. Isolated on a pure flat white background (#FFFFFF), no checkerboard, no grey.
```

### 18. `mancha-ocre.png`

- **Aspect ratio:** 3:2
- **Used for:** Soft wash behind headings and cards.

```
An abstract watercolour wash stain in very pale ochre yellow, wide and horizontal, with irregular feathered edges, darker pigment pooling along parts of the rim and two or three tiny splatters nearby. Nothing else in the image.

Style: hand-painted watercolour on cotton paper, matching the attached reference painting exactly: loose wet-on-wet washes, visible brush marks, pigment pooling at the edges, soft uneven edges that fade out. Palette limited to warm ochre and sand yellows (#E3B866, #F0D9A8), sage and olive greens (#8FA583, #5E7A4E, #2F4A36), and small touches of terracotta (#C0715A). Flowers: every flower is white, never yellow, ochre, pink or terracotta. Paint each white flower by leaving the petals almost unpainted and defining them with soft warm-grey and pale sage shadows, a small ochre-yellow centre, and darker green leaves directly behind and around the petals, so the white shape reads clearly by contrast. No white flower may sit alone against the empty white background: it always overlaps dark foliage or a darker object. No ink outlines, no text, no letters, no numbers, no border, no frame, no drop shadow, no paper texture, no photorealism, no 3D render. Isolated on a pure flat white background (#FFFFFF), no checkerboard, no grey.
```

### 19. `rodape.png`

- **Aspect ratio:** 21:9 (or the widest ratio available)
- **Used for:** Footer, behind the names.

```
A low horizontal band of foliage growing up from the bottom edge across the full width: leafy trees, bushes and two palm trees like the ones around the church in the reference. The foliage occupies only the bottom third and fades upward into empty white.

Style: hand-painted watercolour on cotton paper, matching the attached reference painting exactly: loose wet-on-wet washes, visible brush marks, pigment pooling at the edges, soft uneven edges that fade out. Palette limited to warm ochre and sand yellows (#E3B866, #F0D9A8), sage and olive greens (#8FA583, #5E7A4E, #2F4A36), and small touches of terracotta (#C0715A). Flowers: every flower is white, never yellow, ochre, pink or terracotta. Paint each white flower by leaving the petals almost unpainted and defining them with soft warm-grey and pale sage shadows, a small ochre-yellow centre, and darker green leaves directly behind and around the petals, so the white shape reads clearly by contrast. No white flower may sit alone against the empty white background: it always overlaps dark foliage or a darker object. No ink outlines, no text, no letters, no numbers, no border, no frame, no drop shadow, no paper texture, no photorealism, no 3D render. Isolated on a pure flat white background (#FFFFFF), no checkerboard, no grey.
```

## Envelope

Replaces the envelope drawn in code at the top of "Nossa história" (and can serve the personal invite opening).
Generate the closed envelope still first, then use it as the first frame of the opening video, so both match exactly.
I cut the front pocket out of the last video frame in code so the arched photo card can rise from inside.

### 20. `envelope-fechado.png`

- **Aspect ratio:** 1:1
- **Used for:** Closed envelope with the wax seal, before it opens.

```
A closed wedding invitation envelope seen straight from the front, perfectly flat, symmetrical and horizontal, not rotated, no perspective. Landscape envelope in cream handmade cotton paper with soft deckled edges, a pointed triangular flap folded down and closed, sealed at the tip of the flap with a round sage green wax seal with an irregular melted rim and a plain smooth centre (no monogram, no letters). A thin olive sprig is tucked under the seal. The envelope is horizontally centred and occupies only the lower 55 percent of the image, touching neither side; the upper 45 percent is completely empty white, reserved for the flap when it opens.

Style: hand-painted watercolour on cotton paper, matching the attached reference painting exactly: loose wet-on-wet washes, visible brush marks, pigment pooling at the edges, soft uneven edges that fade out. Palette limited to warm ochre and sand yellows (#E3B866, #F0D9A8), sage and olive greens (#8FA583, #5E7A4E, #2F4A36), and small touches of terracotta (#C0715A). Flowers: every flower is white, never yellow, ochre, pink or terracotta. Paint each white flower by leaving the petals almost unpainted and defining them with soft warm-grey and pale sage shadows, a small ochre-yellow centre, and darker green leaves directly behind and around the petals, so the white shape reads clearly by contrast. No white flower may sit alone against the empty white background: it always overlaps dark foliage or a darker object. No ink outlines, no text, no letters, no numbers, no border, no frame, no drop shadow, no paper texture, no photorealism, no 3D render. Isolated on a pure flat white background (#FFFFFF), no checkerboard, no grey.
```

### 21. `envelope-abrindo.mp4` (video)

- **Tool:** Gemini video generation (Veo), image-to-video.
- **Start image:** attach `envelope-fechado.png` (the result of prompt 20) as the first frame.
- **Aspect ratio:** 16:9, highest resolution offered, about 8 seconds. Sound does not matter; I remove it.
- **Used for:** The envelope opening when the guest scrolls to it. The video stops on the open, empty envelope and the
  couple's real photo card then rises out of it in code, so nothing may come out of the envelope in the video.

```
Animate the attached image of a closed wedding envelope. The camera is completely locked off: no zoom, no pan, no tilt, no shake, no change of framing. The envelope body stays exactly where it is and does not move, slide or rotate at any moment. The background stays pure flat white for the whole video, with no shadows appearing or changing, and the lighting stays constant.

Action: for the first second nothing moves. Then the triangular flap slowly lifts and opens upward, hinging along the top edge of the envelope, in one smooth continuous motion, until it stands fully open pointing straight up above the envelope. The wax seal stays attached to the tip of the flap and travels with it. The inner side of the flap and the inside of the envelope are a slightly darker cream paper. The envelope is empty: no card, no letter and no object comes out, and nothing else appears. For the last two seconds everything holds perfectly still with the flap fully open.

Keep the hand-painted watercolour look of the attached image for the whole video: same paper, same colours, same soft painted edges. No hands, no people, no text, no letters, no added decorations, no sparkles, no petals, no cuts, no transitions.
```

If the video result drifts (camera moves, the envelope shifts, something comes out of it, or the look turns photographic),
regenerate it. If video keeps failing, fall back to a still: attach `envelope-fechado.png` and ask for the same envelope
with the flap raised straight up and empty, same size and position, saved as `envelope-aberto.png` (1:1).

## Checklist

- [ ] `igreja-hero.png` (16:9)
- [ ] `igreja-retrato.png` (4:5 (portrait))
- [ ] `papel.jpg` (1:1)
- [ ] `ramo-canto.png` (1:1)
- [ ] `arco-folhas.png` (4:5 (portrait))
- [ ] `divisor.png` (21:9 (or the widest ratio available))
- [ ] `v-encontro.png` (1:1)
- [ ] `v-viagem.png` (1:1)
- [ ] `v-pedido.png` (1:1)
- [ ] `v-cerimonia.png` (1:1)
- [ ] `v-traje.png` (1:1)
- [ ] `v-presentes.png` (1:1)
- [ ] `v-galeria.png` (1:1)
- [ ] `v-duvidas.png` (1:1)
- [ ] `v-chegar.png` (1:1)
- [ ] `lacre.png` (1:1)
- [ ] `mancha-verde.png` (3:2)
- [ ] `mancha-ocre.png` (3:2)
- [ ] `rodape.png` (21:9 (or the widest ratio available))
- [ ] `envelope-fechado.png` (1:1)
- [ ] `envelope-abrindo.mp4` (16:9 video, from the closed one)
