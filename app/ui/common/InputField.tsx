import { TextInput } from "react-native";

interface IInputFieldProps {
  placeholder: string;
  value?: string | undefined;
  secureTextEntry?: boolean;
  onChangeText?: ((text: string) => void) | undefined;
}

const defaultInputFieldClassNames =
  "border-2 border-red-600 font-inter w-full px-3 py-3 mb-3 rounded-xl text-red-800 placeholder:font-semibold placeholder:font-inter focus:border-red-400";

export const InputField = (props: IInputFieldProps) => (
  <TextInput
    className={defaultInputFieldClassNames}
    placeholder={props.placeholder}
    value={props.value}
    secureTextEntry={props.secureTextEntry}
    onChangeText={props.onChangeText}
  />
);
