import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";

export function PhotoToolbar() {
  const [isProcessing, setIsProcessing] = useState(false);
  const cullPhotos = useAction(api.photos.cullPhotos);

  const handleCullPhotos = async () => {
    setIsProcessing(true);
    try {
      const result = await cullPhotos();
      toast.success(`Culled ${result.rejectedCount} photos`);
    } catch (error) {
      console.error("Error culling photos:", error);
      toast.error("Failed to cull photos");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex gap-4">
        <button
          onClick={handleCullPhotos}
          disabled={isProcessing}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? "Processing..." : "Cull Photos"}
        </button>
      </div>
    </div>
  );
}
