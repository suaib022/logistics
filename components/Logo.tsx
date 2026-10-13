import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  height?: number | string;
  width?: number | string;
  iconOnly?: boolean;
}

const ICON_PATH =
  "M6,0h15v1h-15zM5,1h17v1h-17zM3,2h19v1h-19zM30,2h1v1h-1zM1,3h22v1h-22zM30,3h2v1h-2zM0,4h9v1h-9zM17,4h16v1h-16zM17,5h17v1h-17zM16,6h5v1h-5zM22,6h13v1h-13zM16,7h19v1h-19zM9,8h2v1h-2zM15,8h5v1h-5zM21,8h12v1h-12zM7,9h18v1h-18zM29,9h2v1h-2zM5,10h19v1h-19zM28,10h2v1h-2zM6,11h12v1h-12zM19,11h5v1h-5zM6,12h17v1h-17zM7,13h16v1h-16zM31,13h9v1h-9zM8,14h2v1h-2zM17,14h22v1h-22zM9,15h1v1h-1zM18,15h20v1h-20zM18,16h18v1h-18zM19,17h15v1h-15z";

const TEXT_PATH =
  "M46,2h5v1h-5zM55,2h3v1h-3zM59,2h3v1h-3zM44,3h8v1h-8zM55,3h3v1h-3zM59,3h3v1h-3zM79,3h3v1h-3zM43,4h10v1h-10zM56,4h1v1h-1zM59,4h3v1h-3zM79,4h3v1h-3zM42,5h4v1h-4zM50,5h4v1h-4zM55,5h2v1h-2zM59,5h3v1h-3zM65,5h3v1h-3zM72,5h1v1h-1zM77,5h6v1h-6zM88,5h1v1h-1zM42,6h3v1h-3zM51,6h3v1h-3zM55,6h3v1h-3zM59,6h3v1h-3zM64,6h4v1h-4zM70,6h6v1h-6zM77,6h7v1h-7zM86,6h6v1h-6zM42,7h3v1h-3zM55,7h3v1h-3zM59,7h3v1h-3zM63,7h4v1h-4zM69,7h15v1h-15zM85,7h8v1h-8zM42,8h3v1h-3zM55,8h3v1h-3zM59,8h7v1h-7zM68,8h3v1h-3zM74,8h3v1h-3zM79,8h3v1h-3zM84,8h4v1h-4zM90,8h4v1h-4zM42,9h3v1h-3zM55,9h3v1h-3zM59,9h6v1h-6zM68,9h3v1h-3zM74,9h3v1h-3zM79,9h3v1h-3zM84,9h3v1h-3zM91,9h3v1h-3zM42,10h3v1h-3zM55,10h3v1h-3zM59,10h6v1h-6zM68,10h10v1h-10zM79,10h3v1h-3zM84,10h3v1h-3zM91,10h3v1h-3zM42,11h3v1h-3zM51,11h3v1h-3zM55,11h3v1h-3zM59,11h6v1h-6zM68,11h9v1h-9zM79,11h3v1h-3zM84,11h3v1h-3zM91,11h3v1h-3zM42,12h4v1h-4zM51,12h3v1h-3zM55,12h3v1h-3zM59,12h7v1h-7zM68,12h3v1h-3zM79,12h3v1h-3zM84,12h3v1h-3zM91,12h3v1h-3zM43,13h5v1h-5zM49,13h4v1h-4zM55,13h3v1h-3zM59,13h3v1h-3zM63,13h4v1h-4zM68,13h3v1h-3zM74,13h3v1h-3zM79,13h3v1h-3zM84,13h4v1h-4zM90,13h4v1h-4zM44,14h9v1h-9zM55,14h3v1h-3zM59,14h3v1h-3zM64,14h4v1h-4zM69,14h8v1h-8zM79,14h5v1h-5zM85,14h8v1h-8zM45,15h7v1h-7zM55,15h3v1h-3zM59,15h3v1h-3zM65,15h3v1h-3zM70,15h6v1h-6zM80,15h4v1h-4zM86,15h6v1h-6zM48,16h1v1h-1z";

export function Logo({
  className = "h-6 w-auto text-[var(--text)]",
  iconOnly = false,
  ...props
}: LogoProps) {
  if (iconOnly) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 36 18"
        fill="currentColor"
        className={className}
        aria-label="Ciketo"
        {...props}
      >
        <path d={ICON_PATH} />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 94 18"
      fill="currentColor"
      className={className}
      aria-label="Ciketo"
      {...props}
    >
      <path d={ICON_PATH} />
      <path d={TEXT_PATH} />
    </svg>
  );
}

export function LogoIcon({
  className = "h-5 w-auto text-[var(--text)]",
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 36 18"
      fill="currentColor"
      className={className}
      aria-label="Ciketo"
      {...props}
    >
      <path d={ICON_PATH} />
    </svg>
  );
}
