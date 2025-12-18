import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import type { IconName } from '../iconNames';
import { pixelIconDefinitions, type PixelIconDefinition } from '../pixelIconPaths';
import { theme } from '../theme';

type IconScale = keyof typeof theme.iconSizes;

export interface IconProps {
  name: IconName;
  label?: string;
  size?: IconScale | number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export const Icon: React.FC<IconProps> = ({
  name,
  label,
  size = 'md',
  color = theme.colors.textPrimary,
  style
}) => {
  const definition: PixelIconDefinition | undefined = pixelIconDefinitions[name];

  if (!definition) {
    if (__DEV__) {
      console.warn(`@streamlink/ui Icon: unknown icon name "${name}"`);
    }
    return null;
  }

  const resolvedSize = typeof size === 'number' ? size : theme.iconSizes[size];
  const isDecorative = !label;

  return (
    <View
      style={[styles.container, style, { width: resolvedSize, height: resolvedSize }]}
      accessible={!isDecorative}
      accessibilityRole={isDecorative ? undefined : 'image'}
      accessibilityLabel={isDecorative ? undefined : label}
      accessibilityElementsHidden={isDecorative}
      importantForAccessibility={isDecorative ? 'no-hide-descendants' : 'auto'}
    >
      <Svg
        width={resolvedSize}
        height={resolvedSize}
        viewBox={definition.viewBox}
        fill="none"
      >
        {definition.paths.map((pathProps, index) => (
          <Path
            key={index}
            d={pathProps.d}
            fill={pathProps.stroke ? 'none' : pathProps.fill ?? color}
            stroke={pathProps.stroke ? color : undefined}
            strokeWidth={pathProps.strokeWidth}
          />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center'
  }
});
