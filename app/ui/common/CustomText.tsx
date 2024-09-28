import { Text, TextProps } from "react-native";
import { globalStyles } from "../../../globalStyles";
import { JSX } from "react";

export const CustomText = (
  props: JSX.IntrinsicAttributes &
    JSX.IntrinsicClassAttributes<Text> &
    Readonly<TextProps>
) => <Text {...props} style={[globalStyles.text, props.style]} />;
