export type ResponsiveToolbarProps = {
  mobile: React.ReactNode;
  desktop: React.ReactNode;
};

/** Eyni filter əməlini mobil sticky və desktop inline təqdimatına ayırır. */
export function ResponsiveToolbar({ mobile, desktop }: ResponsiveToolbarProps) {
  return (
    <div>
      <div className="sticky top-[var(--header-h)] z-[var(--z-sticky)] border-b border-line bg-paper/95 backdrop-blur lg:hidden">
        {mobile}
      </div>
      <div className="hidden lg:block">{desktop}</div>
    </div>
  );
}
