import type { DocumentRecord, UploadOptions } from "./types";
import type { HttpClient } from "./client";

export class DocumentsAPI {
  constructor(private readonly client: HttpClient) {}

  async upload(claimId: string, file: File | Blob, opts: UploadOptions): Promise<DocumentRecord> {
    const { onProgress } = opts;

    // Fake progress: fire at 0 → 30 → 60 → 90 before the request, then 100 after
    const progressSteps = [0, 30, 60, 90];
    let stepIdx = 0;

    const progressInterval = onProgress
      ? setInterval(() => {
          if (stepIdx < progressSteps.length) {
            onProgress(progressSteps[stepIdx++]);
          }
        }, 100)
      : null;

    let data: ArrayBuffer;
    try {
      data = await file.arrayBuffer();
    } finally {
      if (progressInterval) clearInterval(progressInterval);
    }

    const base64 = Buffer.from(data).toString("base64");
    const filename = file instanceof File ? file.name : "upload.bin";

    const result = await this.client.request<DocumentRecord>(
      "POST",
      `/claims/${claimId}/documents`,
      {
        type: opts.type,
        filename,
        size: file.size,
        data: base64,
      },
    );

    onProgress?.(100);
    return result;
  }

  async list(claimId: string): Promise<DocumentRecord[]> {
    return this.client.request<DocumentRecord[]>("GET", `/claims/${claimId}/documents`);
  }
}
