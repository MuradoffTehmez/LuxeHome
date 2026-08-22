type MediaRecordWriter<T> = {
  createRecord(): Promise<T>;
  deleteImage(url: string): Promise<void>;
  logCleanupFailure(error: unknown): void;
};

/** D1 Media sətri yazılmazsa artıq R2 obyektini ən yaxşı cəhdlə geri silir. */
export async function createMediaRecordWithRollback<T>(
  writer: MediaRecordWriter<T>,
  url: string,
): Promise<T> {
  try {
    return await writer.createRecord();
  } catch (error) {
    await writer.deleteImage(url).catch((cleanupError: unknown) => {
      writer.logCleanupFailure(cleanupError);
    });
    throw error;
  }
}
