// Logo: masjid siluet (markaziy gumbaz, ikkita minora). Rang currentColor dan olinadi.
export function Mosque({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} fill="currentColor">
      <path d="M24 5.5c.4 0 .8.3.8.8 0 .4-.2.7-.5.8.6.2 1 .8 1 1.4a1.5 1.5 0 0 1-1.1 1.4V12h-.4V9.9a1.5 1.5 0 0 1-1.1-1.4c0-.6.4-1.2 1-1.4a.8.8 0 0 1 .3-1.6z" opacity=".95" />
      <path d="M14 29c0-7.2 4.5-12 10-12s10 4.8 10 12z" />
      <rect x="13" y="29" width="22" height="9" />
      <path d="M5 40h38v3H5z" />
      <path d="M7.2 14 9 9l1.8 5v21H7.2z" />
      <rect x="5.8" y="22" width="6.4" height="1.8" rx=".6" />
      <path d="M37.2 14 39 9l1.8 5v21h-3.6z" />
      <rect x="35.8" y="22" width="6.4" height="1.8" rx=".6" />
      <path d="M10.5 38v-4.5a1.7 1.7 0 0 1 3.4 0V38zM17.5 38v-4.5a1.7 1.7 0 0 1 3.4 0V38zM27.1 38v-4.5a1.7 1.7 0 0 1 3.4 0V38zM34.1 38v-4.5a1.7 1.7 0 0 1 3.4 0V38z" fill="#070b14" opacity=".55" />
    </svg>
  );
}
