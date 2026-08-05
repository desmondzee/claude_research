/*
  Two hairline marks, drawn from the site's own vocabulary. Half-pixel coordinates keep the
  1px strokes crisp at 1× instead of blurring across two device pixels.
*/

/** Three spines of differing heights standing on a shelf. */
export function ShelfMark() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden
    >
      <path d="M3 16.5h14" />
      <path d="M6.5 16.5V7" />
      <path d="M10.5 16.5V3.5" />
      <path d="M14.5 16.5V9" />
    </svg>
  );
}

/** Lines of text narrowing to a result. */
export function NarrowMark() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden
    >
      <path d="M0.5 3.5h13" />
      <path d="M2.5 7.5h9" />
      <path d="M4.5 11.5h5" />
    </svg>
  );
}
