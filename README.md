# Design System Components

This project contains a complete design system extracted from Figma, organized into atoms, molecules, layout primitives, and organisms.

## Structure

```
src/
├── components/
│   ├── atoms/          # Base components (Checkbox, Radio, Input, etc.)
│   ├── molecules/      # Composite components (CheckboxGroup, RadioGroup)
│   ├── layout/         # Layout primitives (Stack, Container, Grid)
│   └── organisms/      # Complex components (ShipmentDetails)
├── tokens/             # Design tokens (colors, spacing, typography)
└── index.css           # Global styles with token imports
```

## Design Tokens

All design tokens are defined in `tokens/tokens.css` and `tokens/design-tokens.json`. These tokens are extracted directly from Figma and include:

- **Colors**: Backgrounds, borders, text colors, button states
- **Spacing**: 2px, 4px, 8px, 12px, 16px
- **Border Radius**: 4px, 8px, 16px, 9999px (full)
- **Typography**: Inter font family, sizes (14px, 16px), weights (400, 600)
- **Shadows**: Drop shadow effects

## Components

### Atoms

Base form input components:

- `CheckboxField` - Checkbox with checked/unchecked/indeterminate states
- `RadioField` - Radio button with checked/unchecked states
- `SwitchField` - Toggle switch component
- `InputField` - Text input with outlined/filled variants
- `TextareaField` - Multi-line text input
- `Search` - Search input with icon
- `SliderField` - Range slider component
- `SelectField` - Dropdown select component

Button components:

- `Button` - Main button with variants (CTA, brand, default, Subtle), states (Default, Hover, Pressed, Disabled, Active), and sizes (Medium, Small)
- `IconButton` - Icon-only button with variants (Primary, Neutral, Subtle), states (Default, Hover, Disabled), and sizes (Medium, Small)
- `ButtonDanger` - Danger variant button with variants (Primary, Subtle), states (Enabled, Hover, Pressed, Disabled), and sizes (Medium, Small)
- `Tab` - Individual tab component with active/inactive states and hover support

### Molecules

Composite components built from atoms:

- `CheckboxGroup` - Group of checkboxes
- `RadioGroup` - Group of radio buttons with title
- `ButtonGroup` - Group of buttons with alignment options (Start, End, Center, Justify, Stack)
- `Tabs` - Tab navigation component with horizontal/vertical orientation and content panels

### Layout Primitives

Layout utilities:

- `Stack` - Flexbox container with configurable direction, gap, alignment
- `Container` - Container with max-width and padding options
- `Grid` - CSS Grid layout with configurable columns and gaps

### Organisms

Complex components:

- `ShipmentDetails` - Shipment form with multiple radio groups

## Usage Example

```tsx
import { CheckboxField, RadioGroup, Button, IconButton, ButtonGroup, Tabs, Stack, Container } from './components';
import './index.css';

function App() {
  return (
    <Container maxWidth="md" padding="md">
      <Stack direction="column" gap="300">
        <CheckboxField
          label="Accept terms"
          description="Please read and accept the terms"
          valueType="Checked"
          onChange={(checked) => console.log(checked)}
        />
        
        <RadioGroup
          name="shipping"
          title="Shipping Method"
          options={[
            { value: 'standard', label: 'Standard Shipping' },
            { value: 'express', label: 'Express Shipping' },
          ]}
          onChange={(value) => console.log(value)}
        />

        <ButtonGroup
          align="Justify"
          buttons={[
            { label: 'Cancel', variant: 'default' },
            { label: 'Submit', variant: 'CTA' },
          ]}
        />

        <Button variant="brand" size="Medium" onClick={() => console.log('Clicked')}>
          Primary Action
        </Button>

        <IconButton variant="Primary" aria-label="Favorite" onClick={() => console.log('Favorite')} />

        <Tabs
          tabs={[
            { value: 'tab1', label: 'Tab 1', content: <div>Content for Tab 1</div> },
            { value: 'tab2', label: 'Tab 2', content: <div>Content for Tab 2</div> },
            { value: 'tab3', label: 'Tab 3', content: <div>Content for Tab 3</div> },
          ]}
          onChange={(value) => console.log('Active tab:', value)}
        />
      </Stack>
    </Container>
  );
}
```

## Design Token Usage

All components use CSS custom properties (variables) from the design tokens. You can override these at the component level or globally:

```css
:root {
  --sds-color-background-brand-default: #0a76db;
  --sds-size-space-300: 12px;
  --sds-typography-body-size-medium: 16px;
}
```

## Component Library

A comprehensive component library showcase is available at `src/ComponentLibrary.tsx`. To view it:

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Open your browser to view the interactive component library

The component library includes:
- **Colors**: All color tokens with previews, hex values, and CSS variable names
- **Typography**: All typography styles with examples and specifications
- **Spacing**: Visual representation of all spacing tokens
- **Layout Primitives**: Interactive examples of Stack, Grid, and Container components
- **Components**: Live examples of all form inputs, buttons, and navigation components

## Notes

- All components match the Figma design specifications exactly
- No styles are invented - all values come from Figma variables
- Components are built with React and TypeScript
- CSS is used for styling (no CSS-in-JS or Tailwind)
- Components include proper accessibility attributes (ARIA labels, roles, etc.)
