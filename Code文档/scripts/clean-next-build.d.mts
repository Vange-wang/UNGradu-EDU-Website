export type DirectoryRemoveOptions = {
  force: boolean;
  maxRetries: number;
  recursive: boolean;
  retryDelay: number;
};

export type DirectoryRemover = (
  targetDirectory: string,
  options: DirectoryRemoveOptions
) => Promise<void>;

export type CleanBuildDirectoryOptions = {
  maxAttempts?: number;
  remove?: DirectoryRemover;
  retryDelayMs?: number;
  sleep?: (milliseconds: number) => Promise<void>;
};

export function cleanBuildDirectory(
  targetDirectory: string,
  options?: CleanBuildDirectoryOptions
): Promise<void>;
