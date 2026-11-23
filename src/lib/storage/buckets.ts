export const BUCKETS = {
  media: {
    name: "media",
    maxBytes: 3 * 1024 * 1024,
    mimes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  },
  publicDocs: {
    name: "public-docs",
    maxBytes: 10 * 1024 * 1024,
    mimes: ["application/pdf"],
  },
  admissionDocs: {
    name: "admission-docs",
    maxBytes: 2 * 1024 * 1024,
    mimes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
  },
} as const;

export type BucketKey = keyof typeof BUCKETS;
