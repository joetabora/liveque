"use client";

interface DisplayFullscreenPromptProps {
  show: boolean;
  onActivate: () => void;
  brandColor?: string;
}

export function DisplayFullscreenPrompt({
  show,
  onActivate,
  brandColor = "#0065a6",
}: DisplayFullscreenPromptProps) {
  if (!show) return null;

  return (
    <button
      type="button"
      onClick={onActivate}
      className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-black/90 text-white cursor-pointer"
      aria-label="Enter fullscreen display mode"
    >
      <span
        className="text-6xl"
        style={{ color: brandColor }}
        aria-hidden
      >
        ⛶
      </span>
      <span className="text-2xl font-bold uppercase tracking-wider">
        Tap to enter fullscreen
      </span>
      <span className="text-sm text-gray-400 max-w-xs text-center">
        Required once to hide the browser toolbar on this display
      </span>
    </button>
  );
}
