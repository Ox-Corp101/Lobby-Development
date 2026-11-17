/**
 * Lobby logo: an original road-curve mark plus the LOBBY wordmark.
 * The mark is a single bold amber curve on a rounded square, so it stays
 * recognisable down to favicon size (16px). Decorative only — the wordmark
 * (or the surrounding link's label) provides the accessible name.
 */
const ROAD_PATH = 'M10 27 C10 17 22 15 22 5';

function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" className="fill-mark" />
      <path
        d={ROAD_PATH}
        fill="none"
        className="stroke-accent"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d={ROAD_PATH}
        fill="none"
        stroke="#17181a"
        strokeOpacity="0.55"
        strokeWidth="1"
        strokeDasharray="2.5 2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="text-lg font-extrabold tracking-[0.2em] text-ink uppercase">Lobby</span>
    </span>
  );
}
