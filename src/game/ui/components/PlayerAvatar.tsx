interface PlayerAvatarProps {
  readonly src: string;
  readonly alt: string;
  readonly accent: string;
}

export function PlayerAvatar({ src, alt, accent }: PlayerAvatarProps) {
  const style = { '--player-color': accent } as React.CSSProperties;
  const isToken = src.length <= 3 && !src.includes('/');

  return (
    <span className="player-avatar" style={style}>
      {isToken ? <span aria-label={alt}>{src}</span> : <img src={src} alt={alt} />}
    </span>
  );
}
