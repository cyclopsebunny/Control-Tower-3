import React, { useState } from 'react';
import {
  // Atoms
  CheckboxField,
  SwitchField,
  InputField,
  TextareaField,
  Search,
  SliderField,
  SelectField,
  Button,
  IconButton,
  ButtonDanger,
  // Molecules
  RadioGroup,
  ButtonGroup,
  Tabs,
  // Layout
  Stack,
  Container,
  Grid,
  GridItem,
} from './components';
import './ComponentLibrary.css';

export const ComponentLibrary: React.FC = () => {
  const [checkboxValues, setCheckboxValues] = useState<string[]>(['option1']);
  const [radioValue, setRadioValue] = useState('option1');
  const [switchChecked, setSwitchChecked] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [sliderValue, setSliderValue] = useState<[number, number]>([25, 75]);
  const [selectValue, setSelectValue] = useState('');
  const [activeTab, setActiveTab] = useState('tab1');

  return (
    <div className="component-library">
      <Container maxWidth="xl" padding="lg">
        <Stack direction="column" gap="400">
          <header className="component-library__header">
            <h1 className="component-library__title">Design System Component Library</h1>
            <p className="component-library__subtitle">
              A comprehensive showcase of all design tokens, layout primitives, and components
            </p>
          </header>

          {/* Colors Section */}
          <section className="component-library__section">
            <h2 className="component-library__section-title">Colors</h2>
            
            <div className="color-grid">
              <div className="color-category">
                <h3 className="color-category__title">Background Colors</h3>
                <div className="color-swatches">
                  <div className="color-swatch">
                    <div className="color-swatch__preview" style={{ backgroundColor: 'var(--sds-color-background-default-default)' }} />
                    <div className="color-swatch__info">
                      <div className="color-swatch__name">Default</div>
                      <div className="color-swatch__value">#ffffff</div>
                      <div className="color-swatch__var">--sds-color-background-default-default</div>
                    </div>
                  </div>
                  <div className="color-swatch">
                    <div className="color-swatch__preview" style={{ backgroundColor: 'var(--sds-color-background-default-secondary)' }} />
                    <div className="color-swatch__info">
                      <div className="color-swatch__name">Secondary</div>
                      <div className="color-swatch__value">#f7f7f7</div>
                      <div className="color-swatch__var">--sds-color-background-default-secondary</div>
                    </div>
                  </div>
                  <div className="color-swatch">
                    <div className="color-swatch__preview" style={{ backgroundColor: 'var(--sds-color-background-disabled-default)' }} />
                    <div className="color-swatch__info">
                      <div className="color-swatch__name">Disabled</div>
                      <div className="color-swatch__value">#f7f7f7</div>
                      <div className="color-swatch__var">--sds-color-background-disabled-default</div>
                    </div>
                  </div>
                  <div className="color-swatch">
                    <div className="color-swatch__preview" style={{ backgroundColor: 'var(--sds-color-background-brand-default)' }} />
                    <div className="color-swatch__info">
                      <div className="color-swatch__name">Brand</div>
                      <div className="color-swatch__value">#0a76db</div>
                      <div className="color-swatch__var">--sds-color-background-brand-default</div>
                    </div>
                  </div>
                  <div className="color-swatch">
                    <div className="color-swatch__preview" style={{ backgroundColor: 'var(--sds-color-background-brand-secondary)' }} />
                    <div className="color-swatch__info">
                      <div className="color-swatch__name">Brand Secondary</div>
                      <div className="color-swatch__value">#e0eeff</div>
                      <div className="color-swatch__var">--sds-color-background-brand-secondary</div>
                    </div>
                  </div>
                  <div className="color-swatch">
                    <div className="color-swatch__preview" style={{ backgroundColor: 'var(--sds-color-background-neutral-default)' }} />
                    <div className="color-swatch__info">
                      <div className="color-swatch__name">Neutral</div>
                      <div className="color-swatch__value">#434343</div>
                      <div className="color-swatch__var">--sds-color-background-neutral-default</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="color-category">
                <h3 className="color-category__title">Text Colors</h3>
                <div className="color-swatches">
                  <div className="color-swatch">
                    <div className="color-swatch__preview" style={{ backgroundColor: 'var(--sds-color-text-default-default)' }} />
                    <div className="color-swatch__info">
                      <div className="color-swatch__name">Default</div>
                      <div className="color-swatch__value">#17191c</div>
                      <div className="color-swatch__var">--sds-color-text-default-default</div>
                    </div>
                  </div>
                  <div className="color-swatch">
                    <div className="color-swatch__preview" style={{ backgroundColor: 'var(--sds-color-text-default-secondary)' }} />
                    <div className="color-swatch__info">
                      <div className="color-swatch__name">Secondary</div>
                      <div className="color-swatch__value">#8a909e</div>
                      <div className="color-swatch__var">--sds-color-text-default-secondary</div>
                    </div>
                  </div>
                  <div className="color-swatch">
                    <div className="color-swatch__preview" style={{ backgroundColor: 'var(--sds-color-text-disabled-default)' }} />
                    <div className="color-swatch__info">
                      <div className="color-swatch__name">Disabled</div>
                      <div className="color-swatch__value">#b2b2b2</div>
                      <div className="color-swatch__var">--sds-color-text-disabled-default</div>
                    </div>
                  </div>
                  <div className="color-swatch">
                    <div className="color-swatch__preview" style={{ backgroundColor: 'var(--sds-color-text-danger-default)' }} />
                    <div className="color-swatch__info">
                      <div className="color-swatch__name">Danger</div>
                      <div className="color-swatch__value">#c61735</div>
                      <div className="color-swatch__var">--sds-color-text-danger-default</div>
                    </div>
                  </div>
                  <div className="color-swatch">
                    <div className="color-swatch__preview" style={{ backgroundColor: 'var(--sds-color-text-neutral-secondary)' }} />
                    <div className="color-swatch__info">
                      <div className="color-swatch__name">Neutral Secondary</div>
                      <div className="color-swatch__value">#575d69</div>
                      <div className="color-swatch__var">--sds-color-text-neutral-secondary</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="color-category">
                <h3 className="color-category__title">Border Colors</h3>
                <div className="color-swatches">
                  <div className="color-swatch">
                    <div className="color-swatch__preview" style={{ backgroundColor: 'var(--sds-color-border-default-default)' }} />
                    <div className="color-swatch__info">
                      <div className="color-swatch__name">Default</div>
                      <div className="color-swatch__value">#babfcc</div>
                      <div className="color-swatch__var">--sds-color-border-default-default</div>
                    </div>
                  </div>
                  <div className="color-swatch">
                    <div className="color-swatch__preview" style={{ backgroundColor: 'var(--sds-color-border-brand-tertiary)' }} />
                    <div className="color-swatch__info">
                      <div className="color-swatch__name">Brand Tertiary</div>
                      <div className="color-swatch__value">#4f95e8</div>
                      <div className="color-swatch__var">--sds-color-border-brand-tertiary</div>
                    </div>
                  </div>
                  <div className="color-swatch">
                    <div className="color-swatch__preview" style={{ backgroundColor: 'var(--sds-color-border-neutral-default)' }} />
                    <div className="color-swatch__info">
                      <div className="color-swatch__name">Neutral</div>
                      <div className="color-swatch__value">#d1d7e3</div>
                      <div className="color-swatch__var">--sds-color-border-neutral-default</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Typography Section */}
          <section className="component-library__section">
            <h2 className="component-library__section-title">Typography</h2>
            
            <div className="typography-showcase">
              <div className="typography-item">
                <div className="typography-item__label">Body Small</div>
                <div className="typography-item__preview" style={{ fontSize: 'var(--sds-typography-body-size-small)', fontFamily: 'var(--sds-typography-body-font-family)', fontWeight: 'var(--sds-typography-body-font-weight-regular)' }}>
                  The quick brown fox jumps over the lazy dog
                </div>
                <div className="typography-item__specs">
                  <span>14px / Regular / Inter</span>
                </div>
              </div>
              
              <div className="typography-item">
                <div className="typography-item__label">Body Medium</div>
                <div className="typography-item__preview" style={{ fontSize: 'var(--sds-typography-body-size-medium)', fontFamily: 'var(--sds-typography-body-font-family)', fontWeight: 'var(--sds-typography-body-font-weight-regular)' }}>
                  The quick brown fox jumps over the lazy dog
                </div>
                <div className="typography-item__specs">
                  <span>16px / Regular / Inter</span>
                </div>
              </div>
              
              <div className="typography-item">
                <div className="typography-item__label">Body Strong</div>
                <div className="typography-item__preview" style={{ fontSize: 'var(--sds-typography-body-size-medium)', fontFamily: 'var(--sds-typography-body-font-family)', fontWeight: 'var(--sds-typography-body-font-weight-strong)' }}>
                  The quick brown fox jumps over the lazy dog
                </div>
                <div className="typography-item__specs">
                  <span>16px / Semi Bold (600) / Inter</span>
                </div>
              </div>
              
              <div className="typography-item">
                <div className="typography-item__label">Subheading</div>
                <div className="typography-item__preview" style={{ fontSize: 'var(--sds-typography-subheading-size-medium)', fontFamily: 'var(--sds-typography-subheading-font-family)', fontWeight: 'var(--sds-typography-subheading-font-weight)' }}>
                  The quick brown fox jumps over the lazy dog
                </div>
                <div className="typography-item__specs">
                  <span>20px / Regular / Inter</span>
                </div>
              </div>
            </div>
          </section>

          {/* Spacing Section */}
          <section className="component-library__section">
            <h2 className="component-library__section-title">Spacing</h2>
            
            <div className="spacing-showcase">
              {[
                { name: '050', value: '2px', var: '--sds-size-space-050' },
                { name: '100', value: '4px', var: '--sds-size-space-100' },
                { name: '150', value: '6px', var: '--sds-size-space-150' },
                { name: '200', value: '8px', var: '--sds-size-space-200' },
                { name: '300', value: '12px', var: '--sds-size-space-300' },
                { name: '400', value: '16px', var: '--sds-size-space-400' },
                { name: '600', value: '24px', var: '--sds-size-space-600' },
              ].map((spacing) => (
                <div key={spacing.name} className="spacing-item">
                  <div className="spacing-item__visual" style={{ width: `var(${spacing.var})`, height: `var(${spacing.var})`, backgroundColor: 'var(--sds-color-background-brand-default)' }} />
                  <div className="spacing-item__info">
                    <div className="spacing-item__name">{spacing.name}</div>
                    <div className="spacing-item__value">{spacing.value}</div>
                    <div className="spacing-item__var">{spacing.var}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Layout Section */}
          <section className="component-library__section">
            <h2 className="component-library__section-title">Layout Primitives</h2>
            
            <div className="layout-showcase">
              <div className="layout-example">
                <h3 className="layout-example__title">Stack (Row)</h3>
                <Stack direction="row" gap="200" align="center">
                  <div className="demo-box">Item 1</div>
                  <div className="demo-box">Item 2</div>
                  <div className="demo-box">Item 3</div>
                </Stack>
              </div>
              
              <div className="layout-example">
                <h3 className="layout-example__title">Stack (Column)</h3>
                <Stack direction="column" gap="200" align="start">
                  <div className="demo-box">Item 1</div>
                  <div className="demo-box">Item 2</div>
                  <div className="demo-box">Item 3</div>
                </Stack>
              </div>
              
              <div className="layout-example">
                <h3 className="layout-example__title">Grid (3 columns)</h3>
                <Grid columns={3} gap="200">
                  <GridItem span={1}><div className="demo-box">1</div></GridItem>
                  <GridItem span={1}><div className="demo-box">2</div></GridItem>
                  <GridItem span={1}><div className="demo-box">3</div></GridItem>
                  <GridItem span={1}><div className="demo-box">4</div></GridItem>
                  <GridItem span={1}><div className="demo-box">5</div></GridItem>
                  <GridItem span={1}><div className="demo-box">6</div></GridItem>
                </Grid>
              </div>
            </div>
          </section>

          {/* Components Section */}
          <section className="component-library__section">
            <h2 className="component-library__section-title">Components</h2>
            
            <div className="components-showcase">
              {/* Form Inputs */}
              <div className="component-category">
                <h3 className="component-category__title">Form Inputs</h3>
                
                <div className="component-group">
                  <h4 className="component-group__title">Checkbox Field</h4>
                  <CheckboxField
                    label="Checkbox Label"
                    description="This is a checkbox description"
                    valueType={checkboxValues.includes('checkbox1') ? 'Checked' : 'Unchecked'}
                    onChange={(checked) => {
                      if (checked) {
                        setCheckboxValues([...checkboxValues, 'checkbox1']);
                      } else {
                        setCheckboxValues(checkboxValues.filter(v => v !== 'checkbox1'));
                      }
                    }}
                  />
                </div>
                
                <div className="component-group">
                  <h4 className="component-group__title">Radio Field</h4>
                  <RadioGroup
                    name="radio-demo"
                    title="Radio Group"
                    options={[
                      { value: 'option1', label: 'Option 1' },
                      { value: 'option2', label: 'Option 2' },
                      { value: 'option3', label: 'Option 3' },
                    ]}
                    value={radioValue}
                    onChange={setRadioValue}
                  />
                </div>
                
                <div className="component-group">
                  <h4 className="component-group__title">Switch Field</h4>
                  <SwitchField
                    label="Switch Label"
                    description="This is a switch description"
                    checked={switchChecked}
                    onChange={setSwitchChecked}
                  />
                </div>
                
                <div className="component-group">
                  <h4 className="component-group__title">Input Field</h4>
                  <InputField
                    label="Input Label"
                    description="This is an input description"
                    value={inputValue}
                    onChange={setInputValue}
                    placeholder="Enter text..."
                  />
                </div>
                
                <div className="component-group">
                  <h4 className="component-group__title">Textarea Field</h4>
                  <TextareaField
                    label="Textarea Label"
                    description="This is a textarea description"
                    value={textareaValue}
                    onChange={setTextareaValue}
                    placeholder="Enter multiple lines..."
                  />
                </div>
                
                <div className="component-group">
                  <h4 className="component-group__title">Search</h4>
                  <Search
                    value={searchValue}
                    onChange={setSearchValue}
                    placeholder="Search..."
                    onClear={() => setSearchValue('')}
                  />
                </div>
                
                <div className="component-group">
                  <h4 className="component-group__title">Select Field</h4>
                  <SelectField
                    label="Select Label"
                    placeholder="Choose an option..."
                    value={selectValue}
                    options={[
                      { value: 'opt1', label: 'Option 1' },
                      { value: 'opt2', label: 'Option 2' },
                      { value: 'opt3', label: 'Option 3' },
                    ]}
                    onChange={setSelectValue}
                  />
                </div>
                
                <div className="component-group">
                  <h4 className="component-group__title">Slider Field</h4>
                  <SliderField
                    label="Slider Label"
                    description="This is a slider description"
                    value={sliderValue}
                    onChange={setSliderValue}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="component-category">
                <h3 className="component-category__title">Buttons</h3>
                
                <div className="component-group">
                  <h4 className="component-group__title">Button Variants</h4>
                  <Stack direction="row" gap="200" align="center">
                    <Button variant="CTA" size="Medium">Button</Button>
                    <Button variant="brand" size="Medium">Button</Button>
                    <Button variant="default" size="Medium">Button</Button>
                    <Button variant="Subtle" size="Medium">Button</Button>
                  </Stack>
                </div>
                
                <div className="component-group">
                  <h4 className="component-group__title">Button Sizes</h4>
                  <Stack direction="row" gap="200" align="center">
                    <Button variant="brand" size="Small">Button</Button>
                    <Button variant="brand" size="Medium">Button</Button>
                  </Stack>
                </div>
                
                <div className="component-group">
                  <h4 className="component-group__title">Button States</h4>
                  <Stack direction="row" gap="200" align="center">
                    <Button variant="brand" state="Default">Button</Button>
                    <Button variant="brand" state="Hover">Button</Button>
                    <Button variant="brand" state="Active">Button</Button>
                    <Button variant="brand" state="Disabled">Button</Button>
                  </Stack>
                </div>
                
                <div className="component-group">
                  <h4 className="component-group__title">Buttons Without Icons</h4>
                  <Stack direction="row" gap="200" align="center">
                    <Button variant="CTA" size="Medium" hasIconStart={false} hasIconEnd={false}>CTA Button</Button>
                    <Button variant="brand" size="Medium" hasIconStart={false} hasIconEnd={false}>Brand Button</Button>
                    <Button variant="default" size="Medium" hasIconStart={false} hasIconEnd={false}>Default Button</Button>
                    <Button variant="Subtle" size="Medium" hasIconStart={false} hasIconEnd={false}>Subtle Button</Button>
                  </Stack>
                </div>
                
                <div className="component-group">
                  <h4 className="component-group__title">Icon Button</h4>
                  <Stack direction="row" gap="200" align="center">
                    <IconButton variant="Primary" aria-label="Primary icon" />
                    <IconButton variant="Neutral" aria-label="Neutral icon" />
                    <IconButton variant="Subtle" aria-label="Subtle icon" />
                  </Stack>
                </div>
                
                <div className="component-group">
                  <h4 className="component-group__title">Button Danger</h4>
                  <Stack direction="row" gap="200" align="center">
                    <ButtonDanger variant="Primary">Delete</ButtonDanger>
                    <ButtonDanger variant="Subtle">Remove</ButtonDanger>
                  </Stack>
                </div>
                
                <div className="component-group">
                  <h4 className="component-group__title">Button Group</h4>
                  <ButtonGroup
                    align="Justify"
                    buttons={[
                      { label: 'Cancel', variant: 'default' },
                      { label: 'Save', variant: 'CTA' },
                    ]}
                  />
                </div>
              </div>

              {/* Navigation */}
              <div className="component-category">
                <h3 className="component-category__title">Navigation</h3>
                
                <div className="component-group">
                  <h4 className="component-group__title">Tabs</h4>
                  <Tabs
                    tabs={[
                      { value: 'tab1', label: 'Tab 1', content: <div className="tab-content">Content for Tab 1</div> },
                      { value: 'tab2', label: 'Tab 2', content: <div className="tab-content">Content for Tab 2</div> },
                      { value: 'tab3', label: 'Tab 3', content: <div className="tab-content">Content for Tab 3</div> },
                    ]}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                  />
                </div>
              </div>
            </div>
          </section>
        </Stack>
      </Container>
    </div>
  );
};
