# Button Component Comparison Document

## Overview

This document compares the Figma Button component design (node ID: 4185:3779) with the current implementation in `src/components/atoms/Button/Button.tsx` and `src/components/atoms/Button/Button.css`.

**Figma Reference**: Button component from the design system (Buttons page, node ID: 128-10284)  
**Implementation Files**:
- `src/components/atoms/Button/Button.tsx`
- `src/components/atoms/Button/Button.css`
- `tokens/tokens.css` (design tokens)

---

## 1. HTML Structure Comparison

### Figma Design
```tsx
<div className={className} data-node-id="4185:3779">
  {hasIconStart && (
    <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Star">
      {/* Icon with absolute positioning */}
    </div>
  )}
  <p className="..." data-node-id="4185:3781">
    {label}
  </p>
  {hasIconEnd && (
    <div className="relative shrink-0 size-[20px]" data-name="close">
      {/* Icon with absolute positioning */}
    </div>
  )}
</div>
```

### Current Implementation
```tsx
<button
  type={type}
  className={`button ${variantClass} ${sizeClass} ${stateClass} ${className}`}
  onClick={handleClick}
  disabled={isDisabled}
  data-node-id="4185:3779"
>
  {hasIconStart && iconStart && (
    <span className="button__icon button__icon--start" data-name="Star">
      {iconStart}
    </span>
  )}
  {displayLabel && (
    <span className="button__label" data-node-id="4185:3781">
      {displayLabel}
    </span>
  )}
  {hasIconEnd && iconEnd && (
    <span className="button__icon button__icon--end" data-name="close">
      {iconEnd}
    </span>
  )}
</button>
```

### Differences

| Aspect | Figma | Implementation | Impact |
|--------|-------|----------------|--------|
| **Root Element** | `<div>` | `<button>` | ✅ **Better** - Implementation uses semantic HTML for accessibility |
| **Label Element** | `<p>` | `<span>` | ⚠️ **Minor** - Both work, but `<p>` is more semantic for text content |
| **Icon Wrapper** | Complex nested divs with absolute positioning | Simple `<span>` wrapper | ⚠️ **Different** - Figma uses more complex positioning structure |

---

## 2. Component Props & Defaults

### Figma Design Props
```typescript
type ButtonProps = {
  className?: string;
  hasIconEnd?: boolean;        // Default: true
  hasIconStart?: boolean;       // Default: true
  iconEnd?: React.ReactNode | null;
  iconStart?: React.ReactNode | null;
  label?: string;               // Default: "Button"
  size?: "Medium" | "Small";    // Default: "Medium"
  state?: "Default" | "Hover" | "Disabled" | "Pressed" | "Active";  // Default: "Default"
  variant?: "CTA" | "brand" | "Subtle" | "default";  // Default: "CTA"
};
```

### Current Implementation Props
```typescript
export type ButtonProps = {
  className?: string;
  children?: React.ReactNode;   // ✅ Additional prop not in Figma
  label?: string;               // Default: "Button"
  variant?: 'CTA' | 'brand' | 'default' | 'Subtle';  // Default: 'CTA'
  size?: 'Medium' | 'Small';    // Default: 'Medium'
  state?: 'Default' | 'Hover' | 'Pressed' | 'Disabled' | 'Active';  // Default: 'Default'
  hasIconStart?: boolean;       // Default: false ❌
  hasIconEnd?: boolean;         // Default: false ❌
  iconStart?: React.ReactNode;
  iconEnd?: React.ReactNode;
  onClick?: () => void;         // ✅ Additional prop not in Figma
  type?: 'button' | 'submit' | 'reset';  // ✅ Additional prop not in Figma
  disabled?: boolean;            // ✅ Additional prop not in Figma
};
```

### Differences

| Prop | Figma Default | Implementation Default | Impact |
|------|--------------|----------------------|--------|
| `hasIconStart` | `true` | `false` | ⚠️ **Different** - Figma shows icons by default |
| `hasIconEnd` | `true` | `false` | ⚠️ **Different** - Figma shows icons by default |
| `children` | N/A | Supported | ✅ **Additional** - Allows more flexible usage |
| `onClick` | N/A | Supported | ✅ **Additional** - Standard React pattern |
| `type` | N/A | `'button'` | ✅ **Additional** - HTML button type |
| `disabled` | N/A | Supported | ✅ **Additional** - Standard HTML attribute |

---

## 3. Icon Sizing & Structure

### Figma Design
- **Icon Start (Medium)**: 24px × 24px container
- **Icon Start (Small)**: 16px × 16px container
- **Icon End (All sizes)**: 20px × 20px container
- **Icon Positioning**: Uses absolute positioning with specific inset values:
  - Start icon: `inset-[3.13%_3.12%_7.21%_3.12%]` (for 24px) or `inset-[3.33%_3.33%_7.42%_3.33%]` (for 16px)
  - End icon: `inset-[2.17px]` with nested rotation transform

### Current Implementation
```css
.button--size-medium .button__icon {
  width: 24px;
  height: 24px;
}

.button--size-small .button__icon {
  width: 20px;
  height: 20px;
}
```

### Differences

| Aspect | Figma | Implementation | Impact |
|--------|-------|----------------|--------|
| **Icon Start (Small)** | 16px | 20px | ⚠️ **Different** - Implementation uses same size for both icons |
| **Icon End (Small)** | 20px | 20px | ✅ **Matches** |
| **Icon Start (Medium)** | 24px | 24px | ✅ **Matches** |
| **Icon End (Medium)** | 20px | 24px | ⚠️ **Different** - Implementation uses same size for both icons |
| **Positioning** | Complex absolute positioning | Simple flexbox centering | ⚠️ **Different** - Simpler but may not match exact visual appearance |

---

## 4. Typography

### Figma Design
- **Font Family**: `var(--sds-typography-body-font-family, 'Inter:Regular', sans-serif)`
- **Font Size (Medium)**: `var(--sds-typography-body-size-medium, 16px)`
- **Font Size (Small)**: `var(--sds-typography-body-size-small, 14px)`
- **Font Weight**: `var(--sds-typography-body-font-weight-regular, 400)`
- **Line Height**: `1.4` (shown in generated code) or `1.399999976158142` (from design tokens)
- **Subtle Variant**: Uses `body-size-small` (14px) for text

### Current Implementation
```css
.button__label {
  font-family: var(--sds-typography-body-font-family, 'Inter', sans-serif);
  font-size: var(--sds-typography-body-size-medium, 16px);
  font-weight: var(--sds-typography-body-font-weight-regular, 400);
  line-height: 1.399999976158142;
  font-style: normal;
  color: inherit;
}
```

### Differences

| Aspect | Figma | Implementation | Impact |
|--------|-------|----------------|--------|
| **Font Family** | `'Inter:Regular'` | `'Inter'` | ✅ **Corrected** - Implementation uses valid CSS font-family |
| **Line Height** | `1.4` or `1.399999976158142` | `1.399999976158142` | ✅ **Matches** - Uses exact token value |
| **Subtle Variant Font Size** | `14px` (body-size-small) | `16px` (body-size-medium) | ⚠️ **Different** - Implementation doesn't adjust font size for Subtle variant |

---

## 5. CSS Styling Comparison

### Container Styles

#### Figma Design (from generated code)
- Uses Tailwind-style classes that translate to:
  - `display: flex`
  - `align-items: center`
  - `justify-content: center`
  - `overflow: clip`
  - `position: relative`
  - `border-radius: var(--nexus/shape/borderRadius/xs, 8px)`
  - `flex-shrink: 0`
  - Padding and gap applied via Tailwind classes

#### Current Implementation
```css
.button {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: clip;
  position: relative;
  border: var(--sds-size-stroke-border, 1px) solid;
  border-radius: var(--nexus/shape/borderRadius/xs, 8px);
  flex-shrink: 0;
  padding: var(--nexus/spacing/2, 8px) var(--nexus/spacing/4, 16px);
  gap: var(--nexus/spacing/content/gap/md, 16px);
  /* ... typography ... */
}
```

### Differences

| Style Property | Figma | Implementation | Status |
|---------------|-------|----------------|--------|
| **Display** | `flex` | `flex` | ✅ Matches |
| **Border** | Not explicitly shown | `1px solid` | ⚠️ Implementation adds border (may be needed for variants) |
| **Padding** | Applied via classes | `8px 16px` (Medium) | ✅ Matches |
| **Gap** | Applied via classes | `16px` | ✅ Matches |
| **Border Radius** | `8px` | `8px` | ✅ Matches |

### Variant Styles

All variant styles (CTA, brand, default, Subtle) appear to match the design tokens correctly. The implementation uses the same CSS custom properties as defined in `tokens/tokens.css`.

### State Styles

All state styles (Default, Hover, Pressed, Disabled, Active) appear to match the design tokens correctly.

---

## 6. Visual Differences Summary

### Critical Differences

1. **Icon Default Visibility**
   - **Figma**: Icons are shown by default (`hasIconStart=true`, `hasIconEnd=true`)
   - **Implementation**: Icons are hidden by default (`hasIconStart=false`, `hasIconEnd=false`)
   - **Impact**: Buttons without explicit icon props will look different

2. **Icon Sizing**
   - **Figma**: Different sizes for start vs end icons (24px/16px start, 20px end)
   - **Implementation**: Same size for both icons (24px Medium, 20px Small)
   - **Impact**: Visual appearance may differ, especially for Small size buttons

3. **Subtle Variant Typography**
   - **Figma**: Uses 14px font size for Subtle variant
   - **Implementation**: Uses 16px font size for all variants
   - **Impact**: Subtle buttons will appear larger than designed

4. **Label Element Type**
   - **Figma**: Uses `<p>` tag
   - **Implementation**: Uses `<span>` tag
   - **Impact**: Minor semantic difference, no visual impact

### Minor Differences

1. **Root Element**: Implementation uses `<button>` instead of `<div>` - this is actually better for accessibility
2. **Icon Positioning**: Implementation uses simpler flexbox centering vs Figma's absolute positioning
3. **Additional Props**: Implementation includes `children`, `onClick`, `type`, `disabled` - these are beneficial additions

---

## 7. Recommendations

### High Priority Fixes

1. **Update Icon Default Props**
   ```typescript
   hasIconStart = true,  // Change from false
   hasIconEnd = true,    // Change from false
   ```

2. **Fix Icon Sizing for Different Positions**
   ```css
   .button--size-medium .button__icon--start {
     width: 24px;
     height: 24px;
   }
   .button--size-medium .button__icon--end {
     width: 20px;
     height: 20px;
   }
   .button--size-small .button__icon--start {
     width: 16px;
     height: 16px;
   }
   .button--size-small .button__icon--end {
     width: 20px;
     height: 20px;
   }
   ```

3. **Fix Subtle Variant Font Size**
   ```css
   .button--variant-subtle .button__label {
     font-size: var(--sds-typography-body-size-small, 14px);
   }
   ```

### Medium Priority Improvements

1. **Consider Changing Label to `<p>` Tag**
   - More semantic for text content
   - No visual impact, but better HTML structure

2. **Review Icon Positioning**
   - If visual differences are noticed, consider implementing Figma's absolute positioning approach
   - Current flexbox approach is simpler and may be sufficient

### Low Priority / Optional

1. **Keep Additional Props**
   - `children`, `onClick`, `type`, `disabled` are beneficial additions
   - These enhance the component's usability

2. **Keep `<button>` Element**
   - Better for accessibility than `<div>`
   - Maintains semantic HTML structure

---

## 8. Testing Checklist

To verify the component matches Figma design, test:

- [ ] Button without icons (should match Figma when `hasIconStart=false` and `hasIconEnd=false`)
- [ ] Button with start icon only
- [ ] Button with end icon only
- [ ] Button with both icons
- [ ] Small size button icon sizes (start should be 16px, end should be 20px)
- [ ] Medium size button icon sizes (start should be 24px, end should be 20px)
- [ ] Subtle variant font size (should be 14px)
- [ ] All variant states (Default, Hover, Pressed, Disabled, Active)
- [ ] All variants (CTA, brand, default, Subtle)

---

## Conclusion

The current implementation is **mostly aligned** with the Figma design, with a few key differences:

1. ✅ **Structure**: Uses semantic `<button>` element (better than Figma's `<div>`)
2. ⚠️ **Icon Defaults**: Icons are hidden by default (should be visible)
3. ⚠️ **Icon Sizing**: Same size for both icons (should differ)
4. ⚠️ **Subtle Typography**: Uses medium font size (should use small)

The implementation includes beneficial additions (`children`, `onClick`, `type`, `disabled`) that enhance usability beyond the Figma design.

**Overall Assessment**: The component is functionally complete and visually close, but needs the three high-priority fixes listed above to fully match the Figma design specifications.
