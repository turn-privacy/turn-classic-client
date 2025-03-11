import { styles } from "../styles";
import { ButtonProps } from "../types/props";


export const Button: React.FC<ButtonProps> = ({ onClick, disabled, children, style = {} }) => (
  <button
    style={{
      ...styles.button,
      ...(disabled ? styles.disabledButton : {}),
      ...style
    }}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);
