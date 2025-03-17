
interface CardProps {
  title?: string;
  children: React.ReactNode;
  error?: boolean;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ title, children, error, style = {} }) => (
  <div className={`card ${error ? 'error' : ''}`} style={style}>
    {title && <h4>{title}</h4>}
    {children}
  </div>
);