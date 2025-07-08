import { v } from "convex/values";
import { mutation, query, action, internalQuery, internalMutation } from "./_generated/server";
import { internal, api } from "./_generated/api";

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

export const getPhoto = query({
    args: { id: v.id("photos") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
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
  args: { photoId: v.id("photos") }, // Assuming we enhance one photo at a time
  handler: async (ctx, args) => {
    // 1. Get the URL of the original image from Convex storage
    const photo = await ctx.runQuery(api.photos.getPhoto, { id: args.photoId });
    if (!photo ||!photo.storageId) {
      throw new Error("Photo not found or has no storage ID");
    }
    const imageUrl = await ctx.storage.getUrl(photo.storageId);
    if (!imageUrl) {
      throw new Error("Could not get image URL");
    }

    // 2. Call the Claid.ai API
    const claidApiKey = process.env.CLAID_API_KEY;
    if (!claidApiKey) {
      throw new Error("Claid.ai API key is not set in environment variables.");
    }

    const response = await fetch("https://api.claid.ai/v1-beta1/image/edit", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${claidApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "input": imageUrl,
        "operations": {
          "adjustments": {
            "hdr": {}
          }
        },
        "output": {
          "format": "jpeg"
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claid.ai API failed: ${errorText}`);
    }

    const enhancementResult = await response.json();
    const enhancedImageUrl = enhancementResult.data.output.tmp_url;

    // 3. Fetch the new enhanced image and store it back in Convex
    const enhancedImageResponse = await fetch(enhancedImageUrl);
    const enhancedImageBlob = await enhancedImageResponse.blob();
    const newStorageId = await ctx.storage.store(enhancedImageBlob);

    // 4. Update the photo document with the new storage ID and status
    await ctx.runMutation(api.photos.updateEnhancedPhoto, {
      photoId: args.photoId,
      storageId: newStorageId,
    });

    return { success: true };
  },
});

export const updateEnhancedPhoto = mutation({
    args: {
        photoId: v.id("photos"),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.photoId, {
        storageId: args.storageId, // Replace the original storageId with the enhanced one
        isEnhanced: true, // Add a flag to indicate enhancement
        });
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

export const deletePhoto = mutation({
  args: {
    photoId: v.id("photos"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
    await ctx.db.delete(args.photoId);
  },
});
