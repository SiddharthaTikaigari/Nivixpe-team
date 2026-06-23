import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const MAX_UPLOAD_BYTES = Math.floor(1.5 * 1024 * 1024);

const driveFolderValidator = v.union(
  v.literal("Marketing"),
  v.literal("Business"),
  v.literal("Legal"),
  v.literal("Technical"),
  v.literal("Other"),
);

type DriveFolder = "Marketing" | "Business" | "Legal" | "Technical" | "Other";

function resolveUserFolder(team?: string): DriveFolder {
  if (team === "Marketing") return "Marketing";
  if (team === "Business") return "Business";
  if (team === "Legal") return "Legal";
  if (team === "Technical") return "Technical";
  return "Other";
}

function canAccessAllFolders(role: string, isSuperAdmin?: boolean): boolean {
  return isSuperAdmin === true || role === "CTO" || role === "COO";
}

function canAccessFolder(
  folder: DriveFolder,
  userRole: string,
  userTeam: string | undefined,
  isSuperAdmin?: boolean,
): boolean {
  if (canAccessAllFolders(userRole, isSuperAdmin)) return true;
  // Business team members can also read the Legal folder
  if (folder === "Legal" && userTeam === "Business") return true;
  return resolveUserFolder(userTeam) === folder;
}

async function assertFileSizeLimit(
  ctx: { storage: { getMetadata: (id: any) => Promise<{ size: number } | null> } },
  storageId: any,
) {
  const metadata = await ctx.storage.getMetadata(storageId);
  if (metadata && metadata.size > MAX_UPLOAD_BYTES) {
    throw new Error("File exceeds the 1.5 MB limit per document.");
  }
}

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("driveDocuments").order("desc").collect();
  },
});

export const getAllAccessible = query({
  args: {
    userRole: v.string(),
    userTeam: v.optional(v.string()),
    isSuperAdmin: v.optional(v.boolean()),
    accessibleFolders: v.array(driveFolderValidator),
  },
  handler: async (ctx, args) => {
    const allDocs = await ctx.db.query("driveDocuments").order("desc").collect();
    return allDocs.filter((doc) =>
      canAccessFolder(doc.teamFolder as DriveFolder, args.userRole, args.userTeam, args.isSuperAdmin) &&
      args.accessibleFolders.includes(doc.teamFolder as DriveFolder)
    );
  },
});

export const getByFolder = query({
  args: {
    teamFolder: driveFolderValidator,
    userRole: v.string(),
    userTeam: v.optional(v.string()),
    isSuperAdmin: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (!canAccessFolder(args.teamFolder, args.userRole, args.userTeam, args.isSuperAdmin)) {
      return [];
    }

    return await ctx.db
      .query("driveDocuments")
      .withIndex("by_teamFolder", (q) => q.eq("teamFolder", args.teamFolder))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    teamFolder: driveFolderValidator,
    uploadedBy: v.string(),
    uploadedByEmail: v.string(),
    userRole: v.string(),
    userTeam: v.optional(v.string()),
    isSuperAdmin: v.optional(v.boolean()),
    fileName: v.string(),
    storageId: v.optional(v.id("_storage")),
    externalLink: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userRole, userTeam, isSuperAdmin, ...doc } = args;

    if (!canAccessFolder(doc.teamFolder, userRole, userTeam, isSuperAdmin)) {
      throw new Error("You do not have permission to upload to this folder.");
    }

    if (!doc.storageId && !doc.externalLink) {
      throw new Error("Please upload a file or provide a link.");
    }

    let fileSize = 0;
    if (doc.storageId) {
      await assertFileSizeLimit(ctx, doc.storageId);
      const metadata = await ctx.storage.getMetadata(doc.storageId);
      if (metadata) {
        fileSize = metadata.size;
      }
    }

    return await ctx.db.insert("driveDocuments", {
      teamFolder: doc.teamFolder,
      uploadedBy: doc.uploadedBy,
      uploadedByEmail: doc.uploadedByEmail,
      fileName: doc.fileName,
      storageId: doc.storageId,
      fileSize: fileSize || undefined,
      externalLink: doc.externalLink,
      description: doc.description,
      uploadedAt: new Date().toISOString(),
    });
  },
});

export const backfillFileSizes = mutation({
  args: {},
  handler: async (ctx) => {
    const allDocs = await ctx.db.query("driveDocuments").collect();
    let updatedCount = 0;
    for (const doc of allDocs) {
      if (doc.storageId && doc.fileSize === undefined) {
        const metadata = await ctx.storage.getMetadata(doc.storageId);
        if (metadata) {
          await ctx.db.patch(doc._id, { fileSize: metadata.size });
          updatedCount++;
        }
      }
    }
    return updatedCount;
  },
});

export const remove = mutation({
  args: {
    id: v.id("driveDocuments"),
    userEmail: v.string(),
    userRole: v.string(),
    isSuperAdmin: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Document not found.");

    const isOwner = doc.uploadedByEmail === args.userEmail;
    const isAdmin = canAccessAllFolders(args.userRole, args.isSuperAdmin);

    if (!isOwner && !isAdmin) {
      throw new Error("You can only delete your own documents.");
    }

    if (doc.storageId) {
      await ctx.storage.delete(doc.storageId);
    }

    await ctx.db.delete(args.id);
  },
});
