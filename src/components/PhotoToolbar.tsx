import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";

export function PhotoToolbar() {
  const [isProcessing, setIsProcessing] = useState(false);
  const cullPhotos = useAction(api.photos.cullPhotos);
  const enhancePhotos = useAction(api.photos.enhancePhotos);

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

  const handleEnhancePhotos = async () => {
    setIsProcessing(true);
    try {
      const result = await enhancePhotos();
      toast.success(`Enhanced ${result.enhancedCount} photos`);
    } catch (error) {
      console.error("Error enhancing photos:", error);
      toast.error("Failed to enhance photos");
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
        <button
          onClick={handleEnhancePhotos}
          disabled={isProcessing}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? "Processing..." : "Enhance Photos"}
        </button>
      </div>
    </div>
  );
}
