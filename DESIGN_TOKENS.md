# Ciketo Design Tokens

These tokens govern the look and feel of the Ciketo admin dashboard, ensuring it matches the clean, modern, spacious, editorial aesthetic of the Ciketo website.

## Colors

- `--bg`: #FFFFFF
- `--surface`: #FFFFFF
- `--surface-muted`: #F7F6F4
- `--input-bg`: #F1F0EE
- `--input-border`: #E2E0DC
- `--border`: #E5E3DF
- `--text`: #0A0A0A
- `--text-secondary`: #4B4B4B
- `--text-muted`: #8A8A8A
- `--placeholder`: #A8A6A2
- `--accent`: #D2693A
- `--primary`: #000000
- `--primary-foreground`: #FFFFFF

## Status Colors
Each status category is defined by a text color and a background tint.

- **Neutral (Pre-shipment)**: `--status-neutral-bg` (`#F3F4F6`), `--status-neutral-text` (`#374151`)
- **Blue (Pickup/Origin)**: `--status-blue-bg` (`#E0F2FE`), `--status-blue-text` (`#0369A1`)
- **Orange (Movement)**: `--status-accent-bg` (`#FFEDD5`), `--status-accent-text` (`#C2410C`)
- **Teal (Destination)**: `--status-teal-bg` (`#CCFBF1`), `--status-teal-text` (`#0F766E`)
- **Green (Delivered)**: `--status-green-bg` (`#DCFCE7`), `--status-green-text` (`#15803D`)
- **Amber (Exception/Hold)**: `--status-amber-bg` (`#FEF3C7`), `--status-amber-text` (`#B45309`)
- **Red (Error/Cancelled)**: `--status-red-bg` (`#FEE2E2`), `--status-red-text` (`#B91C1C`)

## Typography

- **Font Family**: Inter, sans-serif
- **Font Weights**: 400 (regular), 500 (medium), 600 (semibold for tables/badges)
- **H1**: `clamp(36px, 5vw, 60px)`, weight 500, line-height 1.08, letter-spacing -0.02em
- **Section Titles**: 20px, weight 500
- **Body & Labels**: 16px (14px inside dense tables)
- **Eyebrow**: 14px, uppercase, letter-spacing 0.02em, preceded by a 14px solid `--accent` square with 12px gap.

## Component Specs

- **Inputs/Selects/Textareas**: 
  - Height: 56px (Textarea min-height 160px)
  - Background: `--input-bg`
  - Border: 1px solid `--input-border`
  - Radius: 4px
  - Padding: 0 24px
  - Focus: 2px outline in `--text` with 2px offset
- **Primary Button**: Background `--primary`, white text, height 56px (44px in toolbars), radius 4px, weight 500. Hover: #1A1A1A, Disabled: 40% opacity.
- **Secondary Button**: White bg, 1px `--border`, black text.
- **Cards/Drawers**: White bg, 1px `--border`, radius 8px, shadow: `0 1px 2px rgba(0,0,0,0.04)`.
- **Status Badges**: Pill-shaped (radius 9999px), 13px, weight 500.
