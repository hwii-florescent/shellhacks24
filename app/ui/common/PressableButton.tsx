import { GestureResponderEvent, Pressable } from "react-native";
import { CustomText } from "./CustomText";

type PressEvent = ((event: GestureResponderEvent) => void) | null | undefined;

interface IPressableButton {
  className?: string;
  children: string;
  onPress: PressEvent;
  disabled?: boolean;
}

const defaultButtonClassnames =
  "bg-blue-700 border border-blue-500 shadow-md w-full items-center px-2 py-2 rounded-lg my-2";

const defaultTextClassnames = "text-blue-100 font-semibold text-lg";

export const PressableButton = (props: IPressableButton) => (
  <Pressable
    className={props.className || defaultButtonClassnames}
    disabled={props.disabled}
    onPress={props.onPress}
  >
    <CustomText className={defaultTextClassnames}>{props.children}</CustomText>
  </Pressable>
);
