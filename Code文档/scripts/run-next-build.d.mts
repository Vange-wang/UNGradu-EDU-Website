import type { EventEmitter } from "node:events";

export interface AcquireBuildLockOptions {
  isProcessAlive?: (pid: number) => boolean;
  maxWaitMs?: number;
  pollIntervalMs?: number;
  sleep?: (milliseconds: number) => Promise<void>;
}

export interface RunNextBuildOptions {
  cwd?: string;
  lockPath?: string;
  nextCliPath?: string;
  runtimePath?: string;
  spawnProcess?: (
    command: string,
    args: string[],
    options: {
      cwd: string;
      env: NodeJS.ProcessEnv;
      shell: false;
      stdio: "inherit";
      windowsHide: true;
    }
  ) => Pick<EventEmitter, "once">;
}

export function acquireBuildLock(
  lockPath: string,
  options?: AcquireBuildLockOptions
): Promise<() => Promise<void>>;

export function runNextBuild(options?: RunNextBuildOptions): Promise<void>;
