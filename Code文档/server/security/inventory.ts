import { createHash } from "node:crypto";

export type SecurityInventoryReport = {
  dependencies: string[];
  schemaVersion: 1;
  sqlSinks: string[];
  ssrfSinks: string[];
  evidence?: { files: string[]; sha256: string };
};

export function createSecurityInventoryReport({
  dependencies,
  sqlSinks,
  ssrfSinks
}: {
  dependencies: string[];
  sqlSinks: string[];
  ssrfSinks: string[];
}): SecurityInventoryReport {
  return {
    dependencies: [...new Set(dependencies.map((value) => value.trim()).filter(Boolean))].sort(),
    schemaVersion: 1,
    sqlSinks: [...new Set(sqlSinks.map((value) => value.trim()).filter(Boolean))].sort(),
    ssrfSinks: [...new Set(ssrfSinks.map((value) => value.trim()).filter(Boolean))].sort()
  };
}

export function createSecurityInventoryFromEvidence({
  packageJson,
  sourceFiles
}: {
  packageJson: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  sourceFiles: Array<{ path: string; text: string }>;
}) {
  const dependencies = [
    ...Object.entries(packageJson.dependencies ?? {}).map(([name, version]) => `${name}@${version}`),
    ...Object.entries(packageJson.devDependencies ?? {}).map(([name, version]) => `${name}@${version}`)
  ];
  const sqlSinks: string[] = [];
  const ssrfSinks: string[] = [];
  for (const file of sourceFiles) {
    if (/\b(mysql|postgres|pg|prisma|sequelize|knex)\b/i.test(file.text)) sqlSinks.push(file.path);
    if (/\b(fetch|axios|http\.request|https\.request)\b/i.test(file.text)) ssrfSinks.push(file.path);
  }
  const evidence = sourceFiles
    .map((file) => `${file.path}\n${file.text}`)
    .sort()
    .join("\n");
  return {
    ...createSecurityInventoryReport({ dependencies, sqlSinks, ssrfSinks }),
    evidence: {
      files: sourceFiles.map((file) => file.path).sort(),
      sha256: createHash("sha256").update(evidence).digest("hex")
    }
  };
}
