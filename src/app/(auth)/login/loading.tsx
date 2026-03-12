export default function LoginLoading() {
  return (
    <div className="w-full max-w-md px-4">
      <div className="animate-pulse rounded-xl border border-[#252538] bg-[#141422] p-8">
        {/* Logo skeleton */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="h-10 w-20 rounded bg-[#252538]" />
          <div className="h-5 w-24 rounded bg-[#252538]" />
          <div className="mt-1 h-4 w-44 rounded bg-[#252538]" />
        </div>

        {/* Email field skeleton */}
        <div className="mb-5">
          <div className="mb-1.5 h-4 w-12 rounded bg-[#252538]" />
          <div className="h-10 w-full rounded-lg bg-[#0f0f1a]" />
        </div>

        {/* Password field skeleton */}
        <div className="mb-5">
          <div className="mb-1.5 h-4 w-16 rounded bg-[#252538]" />
          <div className="h-10 w-full rounded-lg bg-[#0f0f1a]" />
        </div>

        {/* Button skeleton */}
        <div className="h-10 w-full rounded-lg bg-[#252538]" />

        {/* Footer skeleton */}
        <div className="mt-8 flex justify-center">
          <div className="h-3 w-48 rounded bg-[#252538]" />
        </div>
      </div>
    </div>
  );
}
