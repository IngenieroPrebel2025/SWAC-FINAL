/** Brand colour-bar shown at the very bottom of every page. */
export function BrandBar() {
  return (
    <div className="flex h-[5px] w-full">
      <div className="flex-1" style={{ background: "var(--ft-bar-1)" }} />
      <div className="flex-1" style={{ background: "var(--ft-bar-2)" }} />
      <div className="flex-1" style={{ background: "var(--ft-bar-3)" }} />
      <div className="flex-1" style={{ background: "var(--ft-bar-4)" }} />
    </div>
  );
}
