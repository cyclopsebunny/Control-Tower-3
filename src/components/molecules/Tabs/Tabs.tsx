import React, { useState } from 'react';
import { Tab, TabProps } from '../../atoms';
import './Tabs.css';

export type TabsOption = Omit<TabProps, 'active' | 'onClick'> & {
  value: string;
  content?: React.ReactNode;
};

export type TabsProps = {
  className?: string;
  tabs: TabsOption[];
  defaultActiveTab?: string;
  activeTab?: string;
  onChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
};

export const Tabs: React.FC<TabsProps> = ({
  className = '',
  tabs,
  defaultActiveTab,
  activeTab: controlledActiveTab,
  onChange,
  orientation = 'horizontal',
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<string | undefined>(
    defaultActiveTab || tabs[0]?.value
  );

  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const handleTabClick = (value: string) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(value);
    }
    if (onChange) {
      onChange(value);
    }
  };

  const activeTabContent = tabs.find((tab) => tab.value === activeTab)?.content;

  return (
    <div className={`tabs tabs--orientation-${orientation} ${className}`} data-name="Tabs" data-node-id="3729:13362">
      <div className="tabs__list" role="tablist">
        {tabs.map((tab) => (
          <Tab
            key={tab.value}
            {...tab}
            active={activeTab === tab.value}
            onClick={() => handleTabClick(tab.value)}
            aria-controls={`tabpanel-${tab.value}`}
            id={`tab-${tab.value}`}
          />
        ))}
      </div>
      {activeTabContent && (
        <div
          className="tabs__content"
          id={`tabpanel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeTabContent}
        </div>
      )}
    </div>
  );
};
