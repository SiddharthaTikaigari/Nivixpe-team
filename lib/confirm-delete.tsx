import { toast } from 'sonner';

export function confirmDelete(itemType: string, itemName?: string): Promise<boolean> {
  const target = itemName ? `${itemType} "${itemName}"` : `this ${itemType}`;
  
  return new Promise((resolve) => {
    toast.custom((t) => (
      <div className="bg-white border border-red-200 rounded-xl p-5 shadow-2xl max-w-sm w-full mx-auto animate-in fade-in zoom-in duration-200">
        <div className="flex gap-3">
          <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Confirm Deletion</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete {target}? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  toast.dismiss(t);
                  resolve(false);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t);
                  resolve(true);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
      className: 'w-full flex justify-center !bg-transparent !border-none !shadow-none'
    });
  });
}
