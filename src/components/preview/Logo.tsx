// Logo component — text-only P// monogram for use inside the preview redesign.
// Mirrors the visual language of the static /icon.png file but is sized
// dynamically and renders crisp at any size. The decorative top-left dot
// echoes the registered-trademark stamp used by terminal aesthetic brands.

export function Logo({ size = 80 }: { size?: number }) {
  return (
    <div
      aria-label="P// logo"
      className="relative grid place-items-center font-mono text-white font-bold flex-shrink-0 border-[1.5px] border-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        letterSpacing: "-0.02em",
      }}
    >
      <span className="inline-flex items-center">
        P
        <span className="-ml-[2px] opacity-85">/</span>
        <span className="-ml-1 opacity-85">/</span>
      </span>
      <span
        aria-hidden="true"
        className="absolute top-1 left-1 w-1 h-1 bg-white"
      />
    </div>
  );
}
