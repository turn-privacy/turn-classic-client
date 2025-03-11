import { theme } from "./config/theme";

export const styles = {
  container: {
    minHeight: "100vh",
    background: theme.gradients.background,
  },
  main: {
    padding: "2rem",
    maxWidth: "1200px",
    margin: "0 auto"
  },
  card: {
    color: "white",
    border: "2px solid #00aaff",
    borderRadius: "8px",
    padding: "1.5rem",
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    marginBottom: "1rem"
  },
  errorCard: {
    border: "2px solid #ff4444",
    backgroundColor: "rgba(255, 0, 0, 0.1)",
  },
  button: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#00aaff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
  },
  disabledButton: {
    backgroundColor: "#666",
    cursor: "not-allowed",
    opacity: 0.7
  }
};