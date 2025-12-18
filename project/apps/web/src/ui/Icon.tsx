import type { IconName } from '@streamlink/ui';
import { theme } from '@streamlink/ui';
import type { ForwardedRef, HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { PixelIcon } from './PixelIcon';
import { iconMap } from './icons';

type IconScale = keyof typeof theme.iconSizes;

type IconVariant = 'auto' | 'vector' | 'pixel';

export interface IconProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  name: IconName;
  label?: string;
  size?: IconScale | number;
  color?: string;
  variant?: IconVariant;
  title?: string;
}

export const Icon = forwardRef<HTMLSpanElement, IconProps>(function Icon(
  props: IconProps,
  ref: ForwardedRef<HTMLSpanElement>
) {
  const {
    name,
    label,
    size = 'md',
    className,
    title,
    style,
    color,
    variant = 'auto',
    ...rest
  } = props;
  const IconComponent = iconMap[name];
  const shouldUsePixel = variant === 'pixel' || (!IconComponent && variant === 'auto');

  if (!IconComponent && variant === 'vector') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Icon: unknown vector name "${name}" supplied.`);
    }
    return null;
  }

  const isDecorative = !label;
  const resolvedSize = typeof size === 'number' ? size : theme.iconSizes[size] ?? theme.iconSizes.md;

  const classNames = [shouldUsePixel ? 'icon-pixel' : undefined, className]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <span
      ref={ref}
      className={classNames}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        verticalAlign: 'middle',
        ...style
      }}
      role={isDecorative ? undefined : 'img'}
      aria-hidden={isDecorative}
      aria-label={isDecorative ? undefined : label}
      {...rest}
    >
      {shouldUsePixel ? (
        <PixelIcon
          name={name}
          size={resolvedSize}
          color={color}
          aria-hidden={isDecorative}
          role={isDecorative ? undefined : 'img'}
          title={title ?? label}
        />
      ) : (
        IconComponent && (
          <IconComponent
            focusable="false"
            size={resolvedSize}
            color={color}
            title={title ?? label}
            aria-hidden={isDecorative}
          />
        )
      )}
    </span>
  );
});

export type { IconName } from '@streamlink/ui';

