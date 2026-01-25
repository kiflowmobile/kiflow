import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from "react-native";

type TypographyVariant = "titleLarge" | "title1" | "title2" | "title3" | "body1" | "body2" | "captionBold";

interface TypographyProps extends TextProps {
  children: React.ReactNode;
  variant?: TypographyVariant;
}

export const Typography = ({ variant = "body2", children, style, ...rest }: TypographyProps) => {
  const textStyles = [styles.shared, styles[variant], style] as StyleProp<TextStyle>;

  return (
    <Text style={textStyles} {...rest}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  shared: {
    color: "#0A0A0A",
  },
  titleLarge: {
    fontSize: 32,
    fontWeight: "600",
    fontFamily: "RobotoCondensed",
  },
  title1: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "RobotoCondensed",
  },
  title2: {
    fontSize: 18,
    fontWeight: "500",
    fontFamily: "RobotoCondensed",
  },
  title3: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "RobotoCondensed",
  },
  body1: {
    fontSize: 16,
    fontWeight: "400",
    fontFamily: "Inter",
  },
  body2: {
    fontSize: 14,
    fontWeight: "400",
    fontFamily: "Inter",
  },
  captionBold: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "RobotoCondensed",
  },
});
