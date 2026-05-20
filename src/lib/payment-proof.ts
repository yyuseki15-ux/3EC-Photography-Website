import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const PAYMENT_PROOF_BUCKET = "payment-proofs";
export const PAYMENT_PROOF_MAX_BYTES = 10 * 1024 * 1024;
export const paymentProofMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
] as const;

const paymentProofMimeTypeSet = new Set<string>(paymentProofMimeTypes);

export function isValidPaymentProofMimeType(value: string) {
  return paymentProofMimeTypeSet.has(value);
}

export function sanitizePaymentProofFileName(value: string) {
  const trimmed = value.trim().toLowerCase();
  const normalized = trimmed.replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-");
  return normalized.length > 0 ? normalized : "proof";
}

export async function ensurePaymentProofBucket() {
  const supabase = createSupabaseAdminClient();
  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    throw new Error(error.message);
  }

  if (buckets.some((bucket) => bucket.name === PAYMENT_PROOF_BUCKET)) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(PAYMENT_PROOF_BUCKET, {
    public: false,
    fileSizeLimit: PAYMENT_PROOF_MAX_BYTES,
    allowedMimeTypes: [...paymentProofMimeTypes]
  });

  if (createError && !createError.message.toLowerCase().includes("already")) {
    throw new Error(createError.message);
  }
}

export async function createSignedPaymentProofUrl(path: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(PAYMENT_PROOF_BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error) {
    console.error("Payment proof signed URL failed:", error);
    return null;
  }

  return data.signedUrl;
}
