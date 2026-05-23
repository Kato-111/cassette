import { RetryButton } from "@/app/~offline/_components/retry-button";

export const dynamic = "force-static";

const OfflinePage = () => (
  <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-16 text-center">
    <p className="font-ephesis text-4xl text-foreground">Cassette</p>
    <div className="max-w-sm space-y-2">
      <h1 className="text-lg font-medium text-foreground">You&apos;re offline</h1>
      <p className="text-sm text-muted-foreground">
        Playback and library sync need an internet connection. Reconnect and try
        again.
      </p>
    </div>
    <RetryButton />
  </div>
);

export default OfflinePage;
