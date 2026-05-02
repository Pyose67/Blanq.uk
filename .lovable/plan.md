## 1. Color swatches — square + named-color mapping

**File:** `src/routes/product.$slug.tsx`

- Change the colour selector buttons from `rounded-full h-7 w-7` to **square** tiles (`h-8 w-8`, no border-radius), keeping the selected ring/border treatment.
- Replace the tiny hardcoded `swatch()` function (4 colours) with a robust resolver that:
  1. Normalises the variant value (e.g. `"Desert Tan"` → `"desert tan"`).
  2. Looks it up in an extended map of common fashion colour names (Desert Tan, Camel, Bone, Ecru, Stone, Taupe, Mocha, Olive, Forest, Burgundy, Rust, Terracotta, Slate, Graphite, Cream, Ivory, Black, White, Navy, Charcoal, Sand, Off-white, etc. — ~40 entries covering the palette BLANQ is likely to use).
  3. Falls back to the browser's native CSS color parser for standard names (`"red"`, `"navy"`, `"khaki"`…) by setting it on a hidden element / `CSS.supports('color', name)`.
  4. Final fallback: a neutral grey + the colour name shown as a tooltip (`title` attr).

This way new variants you add in Shopify with descriptive names like "Desert Tan" render with the correct swatch automatically — no code change required for known names.

## 2. Restore full Material Properties + Technical Notes (always-open)

**File:** `src/routes/product.$slug.tsx`

- Remove the `<Accordion>` wrapper around Material Properties and Technical Notes.
- Render both sections **always expanded** as two stacked blocks below the CTA, matching the previous layout:
  - "Material Properties" eyebrow + list of `{title, body}` items.
  - "Technical Notes" eyebrow + definition list of `{label, value}` rows.
- Keep the Size Guide as the dialog (it stays a modal — that's how it was).
- The Accordion import can stay (still used elsewhere) or be removed if unused.

## 3. Shopify content workflow — how to edit Size Guide / Material Props / Tech Notes

This is informational (no code change). The data already comes from Shopify **metafields** under namespace `blanq`:

| Section in site         | Metafield namespace | Metafield key     | Type           |
|-------------------------|--------------------|-------------------|----------------|
| Size Guide table        | `blanq`            | `size_guide`      | JSON           |
| Material Properties     | `blanq`            | `material_props`  | JSON           |
| Technical Notes         | `blanq`            | `tech_notes`      | JSON           |

**One-time setup in Shopify Admin** (you do this once per store):

1. Go to **Settings → Custom data → Products → Add definition**.
2. Create three definitions, all **namespace `blanq`**:
   - `size_guide` — type **JSON**
   - `material_props` — type **JSON**
   - `tech_notes` — type **JSON**

**Per-product editing:** open any product in Shopify Admin → scroll to **Metafields** → paste/edit the JSON. Expected shapes:

```json
// size_guide
[
  { "size": "S",  "chest": "52", "shoulder": "44", "length": "68", "sleeve": "63" },
  { "size": "M",  "chest": "54", "shoulder": "46", "length": "70", "sleeve": "64" }
]

// material_props
[
  { "title": "17.9 Micron Merino", "body": "Australian wool, mulesing-free, soft hand." },
  { "title": "Fully-fashioned knit", "body": "Panels knit to shape, not cut from yardage." }
]

// tech_notes
[
  { "label": "Composition", "value": "100% Merino Wool" },
  { "label": "Weight",      "value": "320 gsm" },
  { "label": "Origin",      "value": "Knit in Italy" }
]
```

Save the product → the storefront picks it up on the next page load. No deploy needed.

If you want, I can also add a fourth metafield (e.g. `care_instructions`) following the same pattern — just say the word.

## Notes

- No changes to checkout, cart, header, footer, or collections.
- Reviews stay as-is (real, locally-stored — no fakes).
