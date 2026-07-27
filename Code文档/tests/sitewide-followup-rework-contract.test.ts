import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const css = readFileSync(join(root, "app", "globals.css"), "utf8");
const customerServiceChat = readFileSync(
  join(root, "features", "customer-service", "customer-service-chat.tsx"),
  "utf8"
);
const captureScript = readFileSync(
  join(root, "scripts", "capture-sitewide-visual.mjs"),
  "utf8"
);

describe("sitewide UI follow-up rework contracts", () => {
  it("keeps login and rules interaction states readable and visibly focused", () => {
    expect(css).toMatch(
      /\.auth-page \.auth-card:focus-within > \.auth-form-shell\s*\{[^}]*color:\s*var\(--dplus-ink\)/s
    );
    expect(css).toMatch(
      /\.rules-native-static-reference \.page-back-arrow:focus-visible\s*\{[^}]*outline:/s
    );
  });

  it("shows a D+ focus ring for every real home link and button", () => {
    expect(css).toMatch(
      /\.home-refresh-page :is\(a, button\):focus-visible\s*\{[^}]*outline:/s
    );
  });

  it("keeps the frozen customer-service frame and welcome message during live chat", () => {
    expect(customerServiceChat).toContain("customer-service-message-initial");
    expect(css).toMatch(
      /\.customer-service-native-static-reference\s+\.customer-service-chat\[data-chat-state="pristine"\]\s*\{[^}]*customer-service-static-chat-frame\.png/s
    );
    expect(css).toMatch(
      /\.customer-service-native-static-reference\s+\.customer-service-chat\[data-chat-state="active"\]\s*\{[^}]*background:\s*#fff[^}]*border:\s*4px solid var\(--dplus-ink\)/s
    );
    expect(css).toMatch(
      /\.customer-service-native-static-reference\s+\.customer-service-messages::before\s*\{[^}]*content:\s*none/s
    );
    expect(css).toMatch(
      /\.customer-service-native-static-reference\s+\.customer-service-message-initial\s*\{[^}]*customer-service-static-welcome\.png[^}]*min-height:\s*101px[^}]*opacity:\s*1/s
    );
  });

  it("keeps the tutor live-result teacher label readable and non-shrinking", () => {
    expect(css).toMatch(
      /\.tutor-profiles-native-static-reference \.result-panel-head \.eyebrow\s*\{[^}]*box-shadow:\s*none/s
    );
    expect(css).toMatch(
      /\.tutor-profiles-native-static-reference\s+\.result-panel\[data-result-state="live"\]\s+\.listing-card-meta\s*\{[^}]*color:\s*var\(--dplus-ink\)[^}]*min-width:\s*106px[^}]*white-space:\s*nowrap/s
    );
  });

  it("keeps long public parent-need titles inside the live result card", () => {
    expect(css).toMatch(
      /\.parent-needs-native-static-reference\s+\.result-panel\[data-result-state="live"\]\s+\.record-card\s+h2\s*\{[^}]*max-width:\s*600px[^}]*overflow-wrap:\s*anywhere/s
    );
  });

  it("captures manual chat states and public real-data marketplace filters", () => {
    expect(captureScript).toContain('dataSource: values["data-source"] ?? "fixture"');
    expect(captureScript).toContain("customer-manual-send");
    expect(captureScript).toContain("customer-scroll-history");
    expect(captureScript).toContain("messageLayout");
    expect(captureScript).toContain("overlapPairs");
    expect(captureScript).toContain("tutorTeacherLabel");
    expect(captureScript).toContain('encodeURIComponent("about:blank")');
    expect(captureScript).toContain("focusByTab");
    expect(captureScript).toContain("auditTabOrder");
    expect(captureScript).toContain("keyboardAudit");
    expect(captureScript).toContain("activate-first-question-space");
    expect(captureScript).toContain("https://ungradeedu.eu.cc");
    expect(captureScript).toContain("public-real-data");
  });
});
