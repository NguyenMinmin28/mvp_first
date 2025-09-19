export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="h-24 w-full animate-pulse rounded-md bg-gray-100" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
        <div className="h-10 w-48 animate-pulse rounded-md bg-gray-100" />
        <div className="h-10 w-48 animate-pulse rounded-md bg-gray-100" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <div className="h-80 w-full animate-pulse rounded-md bg-gray-100" />
        <div className="space-y-4 w-full">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-36 w-full animate-pulse rounded-md bg-gray-100" />
            <div className="h-36 w-full animate-pulse rounded-md bg-gray-100" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-36 w-full animate-pulse rounded-md bg-gray-100" />
            <div className="h-36 w-full animate-pulse rounded-md bg-gray-100" />
          </div>
          <div className="h-36 w-full animate-pulse rounded-md bg-gray-100" />
        </div>
      </div>
      <div className="h-32 w-full animate-pulse rounded-md bg-gray-100" />
      <div className="h-24 w-full animate-pulse rounded-md bg-gray-100" />
      <div className="h-24 w-full animate-pulse rounded-md bg-gray-100" />
      <div className="h-24 w-full animate-pulse rounded-md bg-gray-100" />
    </div>
  );
}


