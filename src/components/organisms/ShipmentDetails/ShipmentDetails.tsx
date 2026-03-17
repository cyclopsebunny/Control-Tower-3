import React, { useState } from 'react';
import { RadioGroup } from '../../molecules';
import { Stack } from '../../layout';
import './ShipmentDetails.css';

export type ShipmentDetailsProps = {
  className?: string;
  loadType?: 'Live' | 'Drop' | 'Preload' | 'Pickup';
  shipmentType?: 'Inbound' | 'Outbound';
  standard?: boolean;
  onShipmentTypeChange?: (type: 'Inbound' | 'Outbound') => void;
  onLoadTypeChange?: (type: 'Live' | 'Drop' | 'Preload' | 'Pickup') => void;
  onStandardChange?: (standard: boolean) => void;
};

export const ShipmentDetails: React.FC<ShipmentDetailsProps> = ({
  className = '',
  loadType: controlledLoadType,
  shipmentType: controlledShipmentType,
  standard: controlledStandard,
  onShipmentTypeChange,
  onLoadTypeChange,
  onStandardChange,
}) => {
  const [internalShipmentType, setInternalShipmentType] = useState<'Inbound' | 'Outbound'>('Inbound');
  const [internalLoadType, setInternalLoadType] = useState<'Live' | 'Drop' | 'Preload' | 'Pickup'>('Live');
  const [internalStandard, setInternalStandard] = useState(false);

  const shipmentType = controlledShipmentType !== undefined ? controlledShipmentType : internalShipmentType;
  const loadType = controlledLoadType !== undefined ? controlledLoadType : internalLoadType;
  const standard = controlledStandard !== undefined ? controlledStandard : internalStandard;

  const handleShipmentTypeChange = (value: string) => {
    const newType = value as 'Inbound' | 'Outbound';
    if (controlledShipmentType === undefined) {
      setInternalShipmentType(newType);
    }
    onShipmentTypeChange?.(newType);
  };

  const handleLoadTypeChange = (value: string) => {
    const newType = value as 'Live' | 'Drop' | 'Preload' | 'Pickup';
    if (controlledLoadType === undefined) {
      setInternalLoadType(newType);
    }
    onLoadTypeChange?.(newType);
  };

  const handleStandardChange = (value: string) => {
    const newStandard = value === 'Non Standard';
    if (controlledStandard === undefined) {
      setInternalStandard(newStandard);
    }
    onStandardChange?.(newStandard);
  };

  const getLoadTypeOptions = () => {
    if (shipmentType === 'Inbound') {
      return [
        { value: 'Live', label: 'Live' },
        { value: 'Drop', label: 'Drop' },
      ];
    } else {
      return [
        { value: 'Live', label: 'Live' },
        { value: 'Preload', label: 'Preload' },
        { value: 'Pickup', label: 'Pickup' },
      ];
    }
  };

  return (
    <div className={`shipment-details ${className}`} data-node-id="3193:1143">
      <Stack direction="column" gap="200" className="shipment-details__content">
        <RadioGroup
          name="shipment-type"
          title="Shipment Type"
          options={[
            { value: 'Inbound', label: 'Inbound' },
            { value: 'Outbound', label: 'Outbound' },
          ]}
          value={shipmentType}
          onChange={handleShipmentTypeChange}
          direction="horizontal"
          gap="400"
        />

        <RadioGroup
          name="load-type"
          title="Load Type"
          options={getLoadTypeOptions()}
          value={loadType}
          onChange={handleLoadTypeChange}
          direction="horizontal"
          gap="400"
        />

        <RadioGroup
          name="product-type"
          title="Product Type"
          options={[
            { value: 'Standard', label: 'Standard' },
            { value: 'Non Standard', label: 'Non Standard' },
          ]}
          value={standard ? 'Non Standard' : 'Standard'}
          onChange={handleStandardChange}
          direction="horizontal"
          gap="400"
        />
      </Stack>
    </div>
  );
};
