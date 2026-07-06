import { colors } from "./theme";

export const globalStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    background: ${colors.warmBeige};
    color: ${colors.text};
    min-height: 100vh;
  }
  a { color: inherit; text-decoration: none; }
  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    border-radius: 8px;
    padding: 10px 18px;
    font-weight: 500;
    transition: opacity 0.2s;
  }
  button:hover { opacity: 0.9; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  input, select, textarea {
    font-family: inherit;
    padding: 10px 14px;
    border: 1px solid ${colors.mutedBlue};
    border-radius: 8px;
    width: 100%;
    background: white;
  }
  .btn-primary {
    background: ${colors.deepNavy};
    color: white;
  }
  .btn-secondary {
    background: ${colors.softRoyalBlue};
    color: white;
  }
  .btn-danger {
    background: ${colors.danger};
    color: white;
  }
  .card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(20, 27, 77, 0.08);
  }
  .badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }
  .badge-pending { background: #fef3c7; color: #92400e; }
  .badge-paid { background: #d1fae5; color: #065f46; }
  .badge-completed { background: #dbeafe; color: #1e40af; }
  .badge-cancelled { background: #fee2e2; color: #991b1b; }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .clickable-row { cursor: pointer; transition: background 0.15s; }
  .clickable-row:hover { background: ${colors.warmBeige}; }
`;
