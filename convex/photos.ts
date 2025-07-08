import { v } from "convex/values";
import { mutation, query, action, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const savePhoto = mutation({
  args: {
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("photos", {
      storageId: args.storageId,
      filename: args.filename,
      contentType: args.contentType,
      size: args.size,
      uploadedAt: Date.now(),
    });
  },
});

export const getAllPhotos = query({
  args: {},
  handler: async (ctx) => {
    const photos = await ctx.db
      .query("photos")
      .withIndex("by_upload_time")
      .order("desc")
      .collect();

    return Promise.all(
      photos.map(async (photo) => ({
        ...photo,
        url: await ctx.storage.getUrl(photo.storageId),
      }))
    );
  },
});

export const cullPhotos = action({
  args: {},
  handler: async (ctx): Promise<{ rejectedCount: number }> => {
    const photos: Array<any> = await ctx.runQuery(internal.photos.getAllPhotosInternal);
    
    // Randomly select about 30% of photos to reject
    const photosToReject: Array<any> = photos
      .filter((photo: any) => photo.status !== "rejected")
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(photos.length * 0.3));

    for (const photo of photosToReject) {
      await ctx.runMutation(internal.photos.updatePhotoStatus, {
        photoId: photo._id,
        status: "rejected",
      });
    }

    return { rejectedCount: photosToReject.length };
  },
});

export const enhancePhotos = action({
  args: {},
  handler: async (ctx): Promise<{ enhancedCount: number }> => {
    const photos: Array<any> = await ctx.runQuery(internal.photos.getAllPhotosInternal);
    
    // Enhance all photos that are not rejected
    const photosToEnhance: Array<any> = photos.filter((photo: any) => photo.status !== "rejected");
    let enhancedCount = 0;

    for (const photo of photosToEnhance) {
      try {
        // Get the original image URL
        const originalUrl = await ctx.storage.getUrl(photo.storageId);
        if (!originalUrl) {
          console.error(`Could not get URL for photo ${photo._id}`);
          continue;
        }

        // Call external enhancement API
        const enhanceResponse = await fetch("https://api.example.com/enhance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageUrl: originalUrl,
            enhancementLevel: "high",
          }),
        });

        if (!enhanceResponse.ok) {
          console.error(`Enhancement API failed for photo ${photo._id}: ${enhanceResponse.status}`);
          continue;
        }

        // Get the enhanced image as a blob
        const enhancedImageBlob = await enhanceResponse.blob();

        // Store the enhanced image in Convex storage
        const enhancedStorageId = await ctx.storage.store(enhancedImageBlob);

        // Update the photo document with the new enhanced storage ID
        await ctx.runMutation(internal.photos.updatePhotoEnhancement, {
          photoId: photo._id,
          enhancedStorageId: enhancedStorageId,
          isEnhanced: true,
        });

        // Generate a random quality score between 7.5 and 9.5 for enhanced photos
        const qualityScore = Math.random() * 2 + 7.5;
        await ctx.runMutation(internal.photos.updateQualityScoreInternal, {
          photoId: photo._id,
          qualityScore: Math.round(qualityScore * 10) / 10,
        });

        enhancedCount++;
      } catch (error) {
        console.error(`Error enhancing photo ${photo._id}:`, error);
        // Continue with next photo even if this one fails
      }
    }

    return { enhancedCount };
  },
});

export const getAllPhotosInternal = internalQuery({
  args: {},
  handler: async (ctx): Promise<Array<any>> => {
    return await ctx.db
      .query("photos")
      .withIndex("by_upload_time")
      .order("desc")
      .collect();
  },
});

export const updatePhotoStatus = internalMutation({
  args: {
    photoId: v.id("photos"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.photoId, {
      status: args.status,
    });
  },
});

export const updatePhotoEnhancement = internalMutation({
  args: {
    photoId: v.id("photos"),
    enhancedStorageId: v.optional(v.id("_storage")),
    isEnhanced: v.boolean(),
  },
  handler: async (ctx, args) => {
    const updateData: any = {
      isEnhanced: args.isEnhanced,
    };
    
    if (args.enhancedStorageId) {
      updateData.enhancedStorageId = args.enhancedStorageId;
    }

    await ctx.db.patch(args.photoId, updateData);
  },
});

export const updateQualityScore = mutation({
  args: {
    photoId: v.id("photos"),
    qualityScore: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.photoId, {
      qualityScore: args.qualityScore,
    });
  },
});

export const updateQualityScoreInternal = internalMutation({
  args: {
    photoId: v.id("photos"),
    qualityScore: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.photoId, {
      qualityScore: args.qualityScore,
    });
  },
});
