import type { IconName, PixelIconDefinition } from '@streamlink/ui';
import { pixelIconDefinitions, theme } from '@streamlink/ui';
import type { SVGProps } from 'react';

export type PixelIconProps = {
  name: IconName;
  size?: number | keyof typeof theme.iconSizes;
  color?: string;
  title?: string;
} & Omit<SVGProps<SVGSVGElement>, 'color' | 'ref'>;

export function PixelIcon({
  name,
  size = 'md',
  color = 'currentColor',
  title,
  className,
  style,
  ...rest
}: PixelIconProps) {
  const definition: PixelIconDefinition | undefined = pixelIconDefinitions[name];

  if (!definition) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`PixelIcon: unknown name "${name}" supplied.`);
    }

    return null;
  }

  const resolvedSize =
    typeof size === 'number' ? size : theme.iconSizes[size] ?? theme.iconSizes.md;

  return (
    <svg
      className={['icon-pixel', className].filter(Boolean).join(' ')}
      width={resolvedSize}
      height={resolvedSize}
      viewBox={definition.viewBox}
      focusable="false"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style
      }}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {definition.paths.map((pathProps: PixelIconDefinition['paths'][number], index: number) => (
        <path
          key={index}
          d={pathProps.d}
          fill={pathProps.stroke ? 'none' : pathProps.fill ?? color}
          stroke={pathProps.stroke ? color : undefined}
          strokeWidth={pathProps.strokeWidth}
        />
      ))}
    </svg>
  );
}
