import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils'; // Assuming you use shadcn/ui utils for class names

// Helper function to render pagination buttons
function PaginationLink({ active, label, url, className }) {
  if (!url) {
    return (
      <span
        className={cn(
          "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-400 dark:text-gray-600 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 cursor-default",
          className // Allow overriding classes
        )}
        dangerouslySetInnerHTML={{ __html: label }} // For Previous/Next arrows
      />
    );
  }
  return (
    <Link
      href={url}
      className={cn(
        "relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 focus:z-20 focus:outline-offset-0",
        active ? "z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500" : "text-gray-900 dark:text-gray-100",
        className // Allow overriding classes
      )}
      dangerouslySetInnerHTML={{ __html: label }}
      preserveScroll // Keep scroll position on page change
      preserveState // Keep component state on page change
    />
  );
}


// The main Pagination component
export default function Pagination({ links = [], className = '' }) {
  // If no links or only prev/next (less than 3 links), don't render pagination
  if (!links || links.length < 3) {
    return null;
  }

  return (
    <nav className={cn("flex items-center justify-between", className)} aria-label="Pagination">
      <div className="flex flex-1 justify-between sm:justify-end">
        <div className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
          {links.map((link, index) => (
            <PaginationLink
              key={index}
              active={link.active}
              label={link.label}
              url={link.url}
              className={cn(
                index === 0 ? "rounded-l-md" : "", // First link (Previous)
                index === links.length - 1 ? "rounded-r-md" : "" // Last link (Next)
              )}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}