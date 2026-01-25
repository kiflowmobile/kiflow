import { cn } from "@/lib/utils";
import { View, ViewProps } from "react-native";

interface LabelProps extends ViewProps {
  className?: string;
}

export const Label = ({ children, style, className, ...rest }: LabelProps) => {
  return (
    <View
      style={style}
      className={cn(
        "flex-row items-center justify-center gap-1 bg-[#FFD988] py-1.5 px-3 rounded-full",
        className
      )}
      {...rest}
    >
      {children}
    </View>
  );
};
