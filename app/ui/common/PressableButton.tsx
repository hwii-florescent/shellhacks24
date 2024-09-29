import { GestureResponderEvent, Pressable, View, Text } from "react-native";
import { CustomText } from "./CustomText";

type PressEvent = ((event: GestureResponderEvent) => void) | null | undefined;
type PressableButtonVariant = "primary" | "secondary" | "tertiary";

interface IPressableButton {
  children: string | JSX.Element;
  className?: string;
  onPress: PressEvent;
  disabled?: boolean;
  icon?: any;
  variant?: PressableButtonVariant;
}

const defaultButtonClassnames = {
  primary:
    "bg-red-600 shadow-lg w-full items-center px-2 py-2.5 rounded-xl my-2",
  secondary: "bg-red-400/60 w-full items-center px-2 py-2.5 rounded-xl my-2",
  tertiary: "w-full items-center px-2 py-2.5 rounded-xl my-2",
};

const defaultTextClassnames = {
  primary: "text-red-100 font-semibold text-lg",
  secondary: "text-red-800 font-semibold text-lg",
  tertiary: "text-black font-semibold text-lg",
};

export const PressableButton = (props: IPressableButton) => (
  <Pressable
    className={
      props.className || defaultButtonClassnames[(props.variant ??= "primary")]
    }
    disabled={props.disabled}
    onPress={props.onPress}
  >
    <View className="flex-row items-center">
      {props.icon && (
        <View className="pr-2">
          <Text>{props.icon}</Text>
        </View>
      )}
      <CustomText
        className={defaultTextClassnames[(props.variant ??= "primary")]}
      >
        {props.children}
      </CustomText>
    </View>
  </Pressable>
);
