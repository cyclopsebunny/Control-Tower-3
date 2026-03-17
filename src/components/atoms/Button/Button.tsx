import React from 'react';
import { cn } from '../../../utils/cn';

export type ButtonProps = {
  className?: string;
  children?: React.ReactNode;
  label?: string;
  variant?: 'CTA' | 'brand' | 'default' | 'Subtle';
  size?: 'Medium' | 'Small';
  state?: 'Default' | 'Hover' | 'Pressed' | 'Disabled' | 'Active';
  hasIconStart?: boolean;
  hasIconEnd?: boolean;
  iconStart?: React.ReactNode;
  iconEnd?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
};

export const Button: React.FC<ButtonProps> = ({
  className = '',
  children,
  label = 'Button',
  variant = 'CTA',
  size = 'Medium',
  state = 'Default',
  hasIconStart = true,
  hasIconEnd = true,
  iconStart,
  iconEnd,
  onClick,
  type = 'button',
  disabled,
}) => {
  const isDisabled = disabled || state === 'Disabled';
  const displayLabel = children || label;
  const isSmall = size === 'Small';
  const isSubtle = variant === 'Subtle';

  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick();
    }
  };

  // Base classes
  const baseClasses = 'flex items-center justify-center overflow-clip relative shrink-0 cursor-pointer transition-all outline-none';
  
  // Size classes
  const sizeClasses = isSmall
    ? 'px-[var(--nexus/spacing/3,12px)] py-[var(--nexus/spacing/1,4px)] gap-[var(--nexus/spacing/content/gap/sm,8px)]'
    : 'px-[var(--nexus/spacing/4,16px)] py-[var(--nexus/spacing/2,8px)] gap-[var(--nexus/spacing/content/gap/md,16px)]';

  // Border radius
  const radiusClass = isSubtle 
    ? 'rounded-[var(--sds-size-radius-200,8px)]'
    : 'rounded-[var(--nexus/shape/borderRadius/xs,8px)]';

  // Variant and state classes
  const getVariantStateClasses = () => {
    const variantLower = variant.toLowerCase();
    const stateLower = state.toLowerCase();
    
    // Handle disabled state first
    if (stateLower === 'disabled') {
      if (isSubtle) {
        return 'bg-transparent border-none text-[var(--button/subtle/disabled/text,#b2b2b2)]';
      }
      return `bg-[var(--button/${variantLower}/disabled/background,#f7f7f7)] border-[var(--button/${variantLower}/disabled/stroke,#babfcc)] border-[var(--sds-size-stroke-border,1px)] border-solid text-[var(--button/${variantLower}/disabled/text,#b2b2b2)]`;
    }

    // Handle active state
    if (stateLower === 'active') {
      if (isSubtle) {
        return 'bg-[var(--button/subtle/active/background,#e0eeff)] text-[var(--button/subtle/active/text,#0a76db)]';
      }
      return `bg-[var(--button/${variantLower}/active/background)] border-[var(--button/${variantLower}/active/stroke)] border-[var(--sds-size-stroke-border,1px)] border-solid text-[var(--button/${variantLower}/active/text)]`;
    }

    // Handle pressed state
    if (stateLower === 'pressed') {
      if (isSubtle) {
        return 'bg-[var(--button/subtle/pressed/background,#cae0fc)] text-[var(--button/subtle/pressed/text,#0a76db)]';
      }
      return `bg-[var(--button/${variantLower}/pressed/background)] border-[var(--button/${variantLower}/pressed/stroke)] border-[var(--sds-size-stroke-border,1px)] border-solid text-[var(--button/${variantLower}/pressed/text)]`;
    }

    // Handle hover state
    if (stateLower === 'hover') {
      if (isSubtle) {
        return 'bg-[var(--button/subtle/hover/background,#e0eeff)] text-[var(--button/subtle/hover/text,#0a76db)]';
      }
      return `bg-[var(--button/${variantLower}/hover/background)] border-[var(--button/${variantLower}/hover/stroke)] border-[var(--sds-size-stroke-border,1px)] border-solid text-[var(--button/${variantLower}/hover/text)]`;
    }

    // Default state
    if (isSubtle) {
      return 'bg-transparent border-none text-[var(--button/subtle/enabled/text,#0a76db)]';
    }
    return `bg-[var(--button/${variantLower}/enabled/background)] border-[var(--button/${variantLower}/enabled/stroke)] border-[var(--sds-size-stroke-border,1px)] border-solid text-[var(--button/${variantLower}/enabled/text)]`;
  };

  // Text color classes
  const getTextColorClass = () => {
    const variantLower = variant.toLowerCase();
    const stateLower = state.toLowerCase();
    
    if (stateLower === 'disabled') {
      return isSubtle 
        ? 'text-[var(--button/subtle/disabled/text,#b2b2b2)]'
        : `text-[var(--button/${variantLower}/disabled/text,#b2b2b2)]`;
    }
    if (stateLower === 'active') {
      return `text-[var(--button/${variantLower}/active/text)]`;
    }
    if (stateLower === 'pressed') {
      return `text-[var(--button/${variantLower}/pressed/text)]`;
    }
    if (stateLower === 'hover') {
      return `text-[var(--button/${variantLower}/hover/text)]`;
    }
    return `text-[var(--button/${variantLower}/enabled/text)]`;
  };

  // Icon color classes - icons have their own color variables
  const getIconColorClass = () => {
    const variantLower = variant.toLowerCase();
    const stateLower = state.toLowerCase();
    
    if (stateLower === 'disabled') {
      return isSubtle 
        ? 'text-[var(--button/subtle/disabled/icon,#b2b2b2)]'
        : `text-[var(--button/${variantLower}/disabled/icon,#b2b2b2)]`;
    }
    if (stateLower === 'active') {
      return `text-[var(--button/${variantLower}/active/icon)]`;
    }
    if (stateLower === 'pressed') {
      return `text-[var(--button/${variantLower}/pressed/icon)]`;
    }
    if (stateLower === 'hover') {
      return `text-[var(--button/${variantLower}/hover/icon)]`;
    }
    return `text-[var(--button/${variantLower}/enabled/icon)]`;
  };

  // Default Star icon component
  const DefaultStarIcon = () => {
    const iconSize = isSmall ? 16 : 24;
    return (
      <div 
        className={cn('overflow-clip relative shrink-0', getIconColorClass())}
        style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
        data-name="Star" 
        data-node-id="4185:3780"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    );
  };

  // Default Close icon component
  const DefaultCloseIcon = () => (
    <div 
      className={cn('relative shrink-0', getIconColorClass())}
      style={{ width: '20px', height: '20px' }}
      data-name="close" 
      data-node-id="4185:3782"
    >
      <div className="absolute flex inset-[2.17px] items-center justify-center">
        <div className="flex-none rotate-[45deg] size-[13.906px]">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <path
              d="M15 5L5 15M5 5L15 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );

  // Typography classes
  const textSizeClass = isSubtle 
    ? 'text-[length:var(--sds-typography-body-size-small,14px)]'
    : 'text-[length:var(--sds-typography-body-size-medium,16px)]';

  return (
    <button
      type={type}
      className={cn(
        baseClasses,
        sizeClasses,
        radiusClass,
        getVariantStateClasses(),
        isDisabled && 'cursor-not-allowed',
        className
      )}
      onClick={handleClick}
      disabled={isDisabled}
      data-node-id="4185:3779"
    >
      {hasIconStart && (iconStart ? (
        <span 
          className={cn('overflow-clip relative shrink-0', getIconColorClass())}
          style={{ width: isSmall ? '16px' : '24px', height: isSmall ? '16px' : '24px' }}
          data-name="Star" 
          data-node-id="4185:3780"
        >
          {iconStart}
        </span>
      ) : (
        <DefaultStarIcon />
      ))}
      {displayLabel && (
        <p 
          className={cn(
            'font-[family-name:var(--sds-typography-body-font-family,"Inter",sans-serif)] font-[var(--sds-typography-body-font-weight-regular,400)] leading-[1.4] not-italic relative shrink-0 whitespace-nowrap',
            textSizeClass,
            getTextColorClass()
          )}
          data-node-id="4185:3781"
        >
          {displayLabel}
        </p>
      )}
      {hasIconEnd && (iconEnd ? (
        <span 
          className={cn('relative shrink-0', getIconColorClass())}
          style={{ width: '20px', height: '20px' }}
          data-name="close" 
          data-node-id="4185:3782"
        >
          {iconEnd}
        </span>
      ) : (
        <DefaultCloseIcon />
      ))}
    </button>
  );
};
