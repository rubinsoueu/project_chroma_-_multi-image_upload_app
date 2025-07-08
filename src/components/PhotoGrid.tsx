import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

export function PhotoGrid() {
  const photos = useQuery(api.photos.getAllPhotos);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<Id<"photos">>>(new Set());

  if (photos === undefined) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const togglePhotoSelection = (photoId: Id<"photos">) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photos.map(photo => photo._id)));
    }
  };

  if (photos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No photos yet</h3>
        <p className="text-gray-500">Upload your first photos to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Header with selection controls */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Your Photos ({photos.length})</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {selectedPhotos.size} of {photos.length} selected
          </span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedPhotos.size === photos.length && photos.length > 0}
              onChange={toggleSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium">Select All</span>
          </label>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => {
          const isSelected = selectedPhotos.has(photo._id);
          const isRejected = photo.status === "rejected";
          const isEnhanced = photo.isEnhanced === true;
          
          return (
            <div 
              key={photo._id} 
              className={`group relative aspect-square overflow-hidden rounded-lg bg-gray-100 ${
                isRejected ? 'opacity-60 border-2 border-red-400' : ''
              }`}
            >
              {/* Selection checkbox */}
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => togglePhotoSelection(photo._id)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                />
              </div>

              {/* Status indicators */}
              <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
                {isRejected && (
                  <span className="px-2 py-1 text-xs bg-red-500 text-white rounded">
                    Rejected
                  </span>
                )}
                {isEnhanced && !isRejected && (
                  <span className="px-2 py-1 text-xs bg-green-500 text-white rounded">
                    Enhanced
                  </span>
                )}
                {photo.qualityScore && (
                  <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded">
                    {photo.qualityScore}/10
                  </span>
                )}
              </div>

              {photo.url && (
                <img
                  src={photo.url}
                  alt={photo.filename}
                  className={`h-full w-full object-cover transition-transform group-hover:scale-105 ${
                    isEnhanced && !isRejected ? 'brightness-110 contrast-110' : ''
                  }`}
                />
              )}
              
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-sm truncate">{photo.filename}</p>
                <div className="flex justify-between items-center">
                  <p className="text-white/80 text-xs">
                    {new Date(photo.uploadedAt).toLocaleDateString()}
                  </p>
                  {photo.qualityScore && (
                    <p className="text-white/80 text-xs">
                      Quality: {photo.qualityScore}/10
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
