import React from 'react';
import type { TouchableOpacityProps } from 'react-native';

import Button from '@/src/components/ui/button';

/**
 * GoogleSignInButton component props
 * @interface GoogleSignInButtonProps
 * @extends {Omit<TouchableOpacityProps, 'style'>}
 * @property {string} [text] - The text to display on the button
 * @property {string} [className] - Additional class names for styling
 */
interface GoogleSignInButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  text?: string;
  style?: any;
}

/**
 * GoogleSignInButton component
 *
 * A button component for Google Sign-In functionality that follows the project's
 * established button patterns and styling.
 *
 * @param {GoogleSignInButtonProps} props - The component props
 * @returns {JSX.Element} The rendered component
 */
export default function GoogleSignInButton({
  text = 'Sign in with Google',
  style,
  ...props
}: GoogleSignInButtonProps): React.ReactElement {
  return (
    <Button
      title={text}
      variant='secondary'
      size='md'
      style={[{ marginBottom: 16, width: '100%' }, style]}
      {...props}
    />
  );
}
