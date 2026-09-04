export interface ArtifactStorage {
  uploadJson(path: string, data: unknown): Promise<{ path: string }>;
  downloadJson<T = unknown>(path: string): Promise<T>;
}
