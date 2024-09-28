import { GestureResponderEvent, Pressable, View } from "react-native";

type PressEvent = ((event: GestureResponderEvent) => void) | null | undefined;

interface IPressableButton {
  className?: string;
  children: JSX.Element;
  onPress: PressEvent;
  disabled?: boolean;
}

const defaultClassnames = "bg-red-300";

export const PressableButton = (props: IPressableButton) => (
  <Pressable
    className={props.className || defaultClassnames}
    disabled={props.disabled}
    onPress={props.onPress}
  >
    <View>{props.children}</View>
  </Pressable>
);
