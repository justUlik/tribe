type Props = {
  children: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
  disabled?: boolean;
};

export function ButtonCard({ children, onClick, type = 'button', className = '', disabled }: Props) {
  return (
    <button type={type} className={`btn-card ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
