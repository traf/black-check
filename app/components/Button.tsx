interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  target?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  className?: string;
  disabled?: boolean;
}

export default function Button({ 
  children, 
  href, 
  target,
  onClick, 
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false
}: ButtonProps) {
  const baseClasses = "font-mono flex-center cursor-pointer text-white flex-shrink-0";
  
  const variantClasses = {
    primary: "bg-white !text-black hover:bg-neutral-200",
    secondary: "bg-neutral-900 hover:bg-neutral-800",
    ghost: "bg-transparent hover:bg-neutral-900"
  };

  const sizeClasses = {
    sm: "!text-sm px-4 py-2",
    md: "px-6 py-3"
  };

  const disabledClasses = disabled ? "opacity-60 cursor-not-allowed pointer-events-none" : "";
  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`;

  if (href && !disabled) {
    return (
      <a href={href} target={target} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
} 