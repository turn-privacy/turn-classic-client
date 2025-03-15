import { styles } from "../styles";

interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

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
