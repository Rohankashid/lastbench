export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl bg-gray-200 p-8 shadow-lg h-40 flex flex-col justify-between">
      <div className="h-6 bg-gray-300 rounded w-2/3 mb-4"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/3"></div>
    </div>
  );
} 