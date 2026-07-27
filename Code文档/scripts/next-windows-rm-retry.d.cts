interface InstallWindowsExportRmRetryOptions {
  fsPromises?: {
    rm(target: string, options?: unknown): Promise<void>;
  };
  maxAttempts?: number;
  platform?: NodeJS.Platform;
  projectRoot?: string;
  retryDelayMs?: number;
  sleep?: (milliseconds: number) => Promise<void>;
}

declare const windowsRmRetry: {
  installWindowsExportRmRetry(
    options?: InstallWindowsExportRmRetryOptions
  ): boolean;
};

export = windowsRmRetry;
