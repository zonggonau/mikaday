import { cn } from "@/lib/utils";

/** Original MIKADAY "Mountain Sunset" illustration: layered ridges, a low sun, and a river. */
export function MountainSunsetArt({ className, title = "Mountain Sunset illustration" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 800 520" role="img" aria-label={title} preserveAspectRatio="xMidYMid slice" className={cn("block h-full w-full", className)}>
      <rect width="800" height="520" fill="#F1EBE3" />
      <circle cx="540" cy="238" r="96" fill="#E87932" />
      <path d="M0 296 L118 214 L206 266 L318 176 L428 258 L536 196 L648 266 L800 204 V520 H0 Z" fill="#D9C6B2" />
      <path d="M0 356 L104 288 L196 336 L304 252 L404 326 L508 278 L612 346 L716 298 L800 324 V520 H0 Z" fill="#9A6A4C" />
      <path d="M0 418 L140 338 L252 396 L362 328 L470 404 L588 356 L700 414 L800 378 V520 H0 Z" fill="#242424" />
      <path
        d="M402 520 C 440 488, 352 470, 392 444 C 424 424, 506 432, 470 404"
        fill="none"
        stroke="#FAF7F2"
        strokeWidth="16"
        strokeLinecap="round"
      />
    </svg>
  );
}
