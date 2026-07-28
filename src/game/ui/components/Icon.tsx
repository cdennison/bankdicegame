export type IconName = 'back' | 'plus' | 'trash' | 'die' | 'scan';

interface IconProps {
  readonly name: IconName;
  readonly className?: string;
}

export function Icon({ name, className }: IconProps) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
    focusable: false,
  } as const;

  if (name === 'back') {
    return <svg {...common}><path d="m15 18-6-6 6-6" /></svg>;
  }
  if (name === 'plus') {
    return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  }
  if (name === 'trash') {
    return <svg {...common}><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>;
  }
  if (name === 'scan') {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="16" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
