# Saans font files

Drop the Saans webfont files into this folder. Filenames must match exactly
(case-sensitive on Linux/Mac):

- `Saans-Regular.woff2`    (weight 400)
- `Saans-Medium.woff2`     (weight 500) — default body weight
- `Saans-Semibold.woff2`   (weight 600)
- `Saans-Bold.woff2`       (weight 700)
- `Saans-Extrabold.woff2`  (weight 800)

`@font-face` declarations are wired up in `apps/web/app/globals.css`.
Any weight whose file is missing will silently fall back to Inter.

The font is licensed by Displaay Type Foundry (https://displaay.net/typeface/saans/).
You'll need a commercial license for production use — a free TRIAL version is
available on Displaay's site, Befonts, and FreeFontDL for development/preview.

If your provider gave you `.woff` or `.ttf` instead of `.woff2`, either:
  1. Convert to `.woff2` (much smaller — use https://transfonter.org), OR
  2. Update the `src:` URLs in `globals.css` to point to your file extension.
