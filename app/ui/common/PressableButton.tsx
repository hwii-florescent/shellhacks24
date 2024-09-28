import { GestureResponderEvent, Pressable, View, Text } from "react-native";
import { CustomText } from "./CustomText";

type PressEvent = ((event: GestureResponderEvent) => void) | null | undefined;

interface IPressableButton {
  className?: string;
  children: string;
  onPress: PressEvent;
  disabled?: boolean;
  icon?: any;
}

const defaultButtonClassnames =
  "bg-red-600 shadow-lg w-full items-center px-2 py-2.5 rounded-xl my-2";

const defaultTextClassnames = "text-red-100 font-semibold text-lg";

export const PressableButton = (props: IPressableButton) => (
  <Pressable
    className={props.className || defaultButtonClassnames}
    disabled={props.disabled}
    onPress={props.onPress}
  >
    <View className="flex-row items-center">
      {props.icon && (
        <View className="pr-2">
          <Text>{props.icon}</Text>
        </View>
      )}
      <CustomText className={defaultTextClassnames}>
        {props.children}
      </CustomText>
    </View>
  </Pressable>
);
