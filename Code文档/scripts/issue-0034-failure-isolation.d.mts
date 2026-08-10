export function summarizeCsp(value: string | null | undefined): {
  directives: string[];
  hasNonce: boolean;
  unsafeInline: boolean;
  unsafeEval: boolean;
};

export function createOutputClassifier(suite?: string): {
  push(chunk: string | Uint8Array): void;
  finish(): {
    classes: string[];
    chunkCount: number;
    failureDetails?: Array<{
      suite: string;
      testName: string;
      testHash: string;
      failureCategory: string;
      candidatePath: string;
      selector: string;
      assertionClass: string;
      processPhase: string;
    }>;
  };
};

export function scanEvidenceArtifact(value: unknown): {
  ruleVersion: string;
  result: "pass";
  checkedFields: number;
};

export function buildStructuredEvidence<T extends Record<string, unknown>>(
  input: T
): T & { sensitiveScan: ReturnType<typeof scanEvidenceArtifact> };

export function summarizeStaticHtml(pathname: string, html: string): {
  htmlNonEmpty: boolean;
  targetPresent: boolean;
  htmlLength: number;
  scriptCount: number;
  bodyTextLength: number;
  inlineScriptCount: number;
};

export function inspectDependencyClosure(targetRoot: string): {
  reparsePointCount: number;
  pathEscape: boolean;
  nextEntryRegular: boolean;
  vitestEntryRegular: boolean;
};
