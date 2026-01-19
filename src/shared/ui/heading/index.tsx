import React, { forwardRef, memo } from 'react';
import { Text, type TextProps } from 'react-native';
import { headingStyle } from './styles';
import type { VariantProps } from '@gluestack-ui/nativewind-utils';

type IHeadingProps = VariantProps<typeof headingStyle> &
  TextProps & {
    as?: React.ElementType;
  };

const MappedHeading = memo(
  forwardRef<Text, IHeadingProps>(function MappedHeading(
    {
      size,
      className,
      isTruncated,
      bold,
      underline,
      strikeThrough,
      sub,
      italic,
      highlight,
      ...props
    },
    ref,
  ) {
    return (
      <Text
        className={headingStyle({
          size,
          isTruncated,
          bold,
          underline,
          strikeThrough,
          sub,
          italic,
          highlight,
          class: className,
        })}
        {...props}
        ref={ref}
      />
    );
  }),
);

const Heading = memo(
  forwardRef<Text, IHeadingProps>(function Heading(
    { className, size = 'lg', as: AsComp, ...props },
    ref,
  ) {
    const { isTruncated, bold, underline, strikeThrough, sub, italic, highlight } = props;

    if (AsComp) {
      return (
        <AsComp
          className={headingStyle({
            size,
            isTruncated,
            bold,
            underline,
            strikeThrough,
            sub,
            italic,
            highlight,
            class: className,
          })}
          {...props}
        />
      );
    }

    return <MappedHeading className={className} size={size} ref={ref} {...props} />;
  }),
);

Heading.displayName = 'Heading';

export { Heading };
