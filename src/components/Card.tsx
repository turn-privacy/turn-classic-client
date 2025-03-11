import { styles } from "../styles";
import { CardProps } from "../types/props";

export const Card: React.FC<CardProps> = ({ title, children, error, style = {} }) => (
  <div style={{ ...styles.card, ...(error ? styles.errorCard : {}), ...style }}>
    {title && <h4 style={{ margin: "0 0 1rem 0", color: error ? "#ff4444" : "#00aaff" }}>{title}</h4>}
    {children}
  </div>
);