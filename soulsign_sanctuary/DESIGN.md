# Design System Document: The Sentinel Sanctuary

## 1. Overview & Creative North Star
### Creative North Star: "The Digital Sanctuary"
This design system moves away from the aggressive, chaotic aesthetics often found in Web3. Instead, it embraces the role of a "Digital Life Guard"—a watchful, serene presence. We achieve this through **Atmospheric Depth** and **Intentional Asymmetry**. 

The interface should not feel like a website; it should feel like a high-end medical HUD or a private vault. We break the "template" look by avoiding rigid boxes. Elements should overlap, use high-contrast typography scales for editorial impact, and breathe through generous use of the Spacing Scale. We are building a sanctuary that feels both technologically advanced and deeply human.

---

## 2. Colors & Atmospheric Surface Logic
The palette is rooted in the depth of space (`background: #10141a`) and the ethereal glow of vital signs.

*   **Primary Logic:** `primary (#c3f5ff)` and `primary_container (#00e5ff)` represent "Life" and "Presence." Use these for active pulses and high-priority interactions.
*   **Success Logic:** `secondary (#40e56c)` is reserved for the "Check-in" state—a moment of relief and security.
*   **Warning Logic:** `tertiary_container (#ffc687)` and `error (#ffb4ab)` provide a soft, amber glow for the 72h countdown. It shouldn't scream "danger," but rather "attention required."

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries are defined strictly through background shifts. For example, a `surface_container_low` section sitting on a `surface` background creates a natural, soft edge. We define space through mass and tone, not outlines.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
1.  **Base:** `surface` (#10141a)
2.  **Sectioning:** `surface_container_low` (#181c22)
3.  **Component Level:** `surface_container` (#1c2026)
4.  **Interaction Level:** `surface_container_highest` (#31353c)

### The "Glass & Gradient" Rule
To achieve the "High-Tech Sanctuary" vibe, use Glassmorphism for floating overlays. Apply a semi-transparent `surface_variant` with a 20px–40px backdrop blur. Use subtle gradients (e.g., `primary` to `primary_container`) only for the most critical CTAs to give them a "soulful" glow.

---

## 3. Typography
We utilize a high-contrast pairing of **Space Grotesk** (Display/Headlines) and **Inter** (Body/UI).

*   **Display & Headlines:** Use `display-lg` (3.5rem) and `headline-lg` (2rem) for data points like countdowns and soul-states. The technical, wide stance of Space Grotesk feels like a futuristic terminal.
*   **Body & UI:** `body-md` and `body-sm` use Inter for maximum legibility. 
*   **Monospaced Accents:** For blockchain hashes or "Time Since Last Pulse," use `label-sm` with a monospaced weight to ground the design in technical reality.
*   **Editorial Scaling:** Use extreme size differences (e.g., a `display-lg` number next to a `label-sm` caption) to create a premium, intentional layout that feels custom-built.

---

## 4. Elevation & Depth
### The Layering Principle
Depth is achieved by "stacking" the surface-container tiers. Place a `surface_container_lowest` card on a `surface_container_low` section. This creates a soft "recessed" look without traditional shadows.

### Ambient Shadows
For floating elements (Modals, Hovering State Cards), use shadows that mimic light passing through glass:
*   **Blur:** 40px–60px.
*   **Opacity:** 6%–10%.
*   **Color:** Use a tinted version of `primary` or `surface_tint` rather than black.

### The "Ghost Border" Fallback
If a border is required for accessibility, it must be a **Ghost Border**: use the `outline_variant` token at 15% opacity. Standard 100% opaque borders are strictly forbidden.

---

## 5. Components

### The Life-Pulse Button (Primary CTA)
*   **Style:** `primary_container` background with `on_primary_container` text.
*   **Shape:** `xl` (0.75rem) or `full` (9999px) roundedness to feel organic.
*   **Effect:** A subtle `0.5` spacing outer glow using `primary_fixed_dim` at 30% opacity.

### Glassmorphic Activity Cards
*   **Structure:** No dividers. Use `surface_container_low` with a backdrop blur.
*   **Separation:** Use `8` (2.75rem) vertical spacing to separate content blocks instead of lines.
*   **Header:** Use `title-md` in `primary` for the card title to make it feel "active."

### The "Vital" Input Field
*   **State:** Unfocused inputs should be `surface_container_lowest`. 
*   **Focus:** Transition to a "Ghost Border" using `primary`.
*   **Error:** Instead of a red box, use a soft `error_container` glow behind the input field.

### Soul-Pulse Indicator (Specialty Component)
A custom component representing the 72h limit. 
*   **Graphic:** A circular progress ring using `secondary` (Success) that transitions to `tertiary` (Amber) as the 72h limit approaches. 
*   **Typography:** `display-md` in the center for the remaining hours.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical layouts. Place a large headline on the left and a small monospaced data point on the far right.
*   **Do** use `surface_bright` sparingly for hover states to create a "sheen" effect.
*   **Do** leverage the Spacing Scale `16` and `20` for "Hero" sections to create a sense of vast, secure space.
*   **Do** use `on_surface_variant` for secondary text to maintain a low-stimulation, sanctuary-like environment.

### Don't:
*   **Don't** use pure black (#000000). Always use the `background` (#10141a) or `surface_container_lowest`.
*   **Don't** use 90-degree sharp corners. Minimum roundedness is `md` (0.375rem).
*   **Don't** use standard "Warning Red" (#FF0000). Use the softer `error` (#ffb4ab) or `tertiary` (#ffe9d5) tones to keep the user calm.
*   **Don't** use divider lines. If the layout feels messy, increase the Spacing Scale instead of adding a line.