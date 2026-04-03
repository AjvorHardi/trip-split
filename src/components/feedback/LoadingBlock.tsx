type LoadingBlockProps = {
  title: string;
  message: string;
  fullScreen?: boolean;
};

export function LoadingBlock({
  title,
  message,
  fullScreen = false,
}: LoadingBlockProps) {
  return (
    <div
      className={[
        "flex items-center justify-center px-6",
        fullScreen ? "min-h-screen" : "min-h-[16rem]",
      ].join(" ")}
    >
      <div className="ts-panel-light w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-5 h-12 w-12 animate-spin border-4 border-black/15 border-t-[var(--ts-cyan)]" />
        <h1 className="ts-display text-3xl text-[var(--ts-ink)]">{title}</h1>
        <p className="ts-copy mt-3 text-sm">{message}</p>
      </div>
    </div>
  );
}
