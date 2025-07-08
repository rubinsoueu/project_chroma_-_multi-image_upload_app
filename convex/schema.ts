import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  photos: defineTable({
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.string(),
    size: v.number(),
    uploadedAt: v.number(),
    status: v.optional(v.string()),
    isEnhanced: v.optional(v.boolean()),
    enhancedStorageId: v.optional(v.id("_storage")),
    qualityScore: v.optional(v.number()),
  }).index("by_upload_time", ["uploadedAt"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
