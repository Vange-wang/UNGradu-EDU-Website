import process from "node:process";
import { performance } from "node:perf_hooks";

const baseUrl = (process.env.M5_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const mode = process.argv.includes("--load") ? "load" : "flow";
const pairCount = mode === "load" ? 25 : 1;
const scriptStartedAt = performance.now();
const metrics = {
  durations: [],
  failures: new Map(),
  failure: 0,
  success: 0,
  total: 0
};

function createPhone(prefix, index) {
  return `${prefix}${String(index).padStart(8, "0")}`;
}

function parentNeedInput(index) {
  return {
    teacherGenderPreference: "any",
    subjects: ["math"],
    grade: "grade-7",
    budgetMin: "80",
    budgetMax: "120",
    timeSlots: ["sat-pm"],
    region: {
      province: "guangdong",
      city: "dongguan",
      district: "songshan"
    },
    community: `m5-http-community-${Date.now()}-${index}`,
    childIntro: `M5 HTTP flow child intro ${index}`
  };
}

function tutorProfileInput(index) {
  return {
    gender: index % 2 === 0 ? "female" : "male",
    school: "dgut",
    major: `m5-http-major-${index}`,
    subjects: ["math"],
    grades: ["grade-7"],
    timeSlots: ["sat-pm"],
    feeRanges: [{ grade: "grade-7", subject: "math", min: "90", max: "130" }],
    abilityDescription: `M5 HTTP flow tutor ability ${index}`,
    proofImages: []
  };
}

function readSetCookie(headers) {
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie().join("; ");
  }

  return headers.get("set-cookie") ?? "";
}

function recordFailure(label) {
  metrics.failure += 1;
  metrics.failures.set(label, (metrics.failures.get(label) ?? 0) + 1);
}

function percentile(values, rank) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.ceil((rank / 100) * sorted.length) - 1
  );

  return sorted[index];
}

function average(values) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function printMetrics(startedAt, successPairs = 0) {
  const elapsedMs = Math.round(performance.now() - startedAt);
  const successRate = metrics.total === 0 ? 0 : (metrics.success / metrics.total) * 100;
  const errorRate = metrics.total === 0 ? 0 : (metrics.failure / metrics.total) * 100;
  const p95 = Math.round(percentile(metrics.durations, 95));
  const avg = Math.round(average(metrics.durations));
  const max = Math.round(Math.max(0, ...metrics.durations));

  console.log(`Success pairs: ${successPairs}`);
  console.log(`Elapsed: ${elapsedMs}ms`);
  console.log(`Requests: ${metrics.total}`);
  console.log(`Success rate: ${successRate.toFixed(2)}%`);
  console.log(`Error rate: ${errorRate.toFixed(2)}%`);
  console.log(`Latency avg/p95/max: ${avg}ms / ${p95}ms / ${max}ms`);

  if (metrics.failures.size > 0) {
    console.log("Failures:");
    for (const [label, count] of metrics.failures.entries()) {
      console.log(`- ${label}: ${count}`);
    }
  }
}

async function request(path, {
  body,
  cookie,
  expectedStatus = 200,
  method = "GET"
} = {}) {
  const startedAt = performance.now();
  metrics.total += 1;

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: {
        ...(body === undefined ? {} : { "content-type": "application/json" }),
        ...(cookie ? { cookie } : {})
      },
      method
    });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;
    const durationMs = performance.now() - startedAt;
    metrics.durations.push(durationMs);

    if (response.status !== expectedStatus) {
      recordFailure(`${method} ${path} -> ${response.status}`);
      throw new Error(`${method} ${path} expected ${expectedStatus}, got ${response.status}: ${text}`);
    }

    metrics.success += 1;
    return { cookie: readSetCookie(response.headers), payload, response };
  } catch (error) {
    if (error instanceof TypeError) {
      recordFailure(`${method} ${path} -> network`);
    }

    throw error;
  }
}

async function login(phone) {
  const result = await request("/api/auth/test-login", {
    body: { phone, code: "000000" },
    method: "POST"
  });

  if (!result.cookie.includes("ungradu_auth_session=")) {
    throw new Error("Login did not return auth session cookie.");
  }

  return result.cookie;
}

function expectOk(result, label) {
  if (!result.payload?.ok) {
    throw new Error(`${label} failed: ${JSON.stringify(result.payload)}`);
  }

  return result.payload.value;
}

async function runPair(index) {
  const parentPhone = createPhone("138", index);
  const tutorPhone = createPhone("139", index);
  const [parentCookie, tutorCookie] = await Promise.all([
    login(parentPhone),
    login(tutorPhone)
  ]);

  await Promise.all([
    request("/api/contact-profile", {
      body: { phone: parentPhone, wechat: `m5_parent_${index}` },
      cookie: parentCookie,
      method: "PUT"
    }),
    request("/api/contact-profile", {
      body: { phone: tutorPhone, wechat: `m5_tutor_${index}` },
      cookie: tutorCookie,
      method: "PUT"
    })
  ]);

  const [parentNeed, tutorProfile] = await Promise.all([
    request("/api/parent-needs", {
      body: parentNeedInput(index),
      cookie: parentCookie,
      method: "POST"
    }).then((result) => expectOk(result, "create parent need")),
    request("/api/tutor-profiles", {
      body: tutorProfileInput(index),
      cookie: tutorCookie,
      method: "POST"
    }).then((result) => expectOk(result, "create tutor profile"))
  ]);

  const [needs, profiles] = await Promise.all([
    request("/api/parent-needs?subject=math").then((result) => expectOk(result, "list parent needs")),
    request("/api/tutor-profiles?subject=math").then((result) => expectOk(result, "list tutor profiles"))
  ]);

  if (!needs.some((need) => need.id === parentNeed.id)) {
    throw new Error("Created parent need was not visible in filtered public list.");
  }

  if (!profiles.some((profile) => profile.id === tutorProfile.id)) {
    throw new Error("Created tutor profile was not visible in filtered public list.");
  }

  const conversation = await request("/api/conversations", {
    body: { sourceId: parentNeed.id, sourceType: "parent-need" },
    cookie: tutorCookie,
    method: "POST"
  }).then((result) => expectOk(result, "create conversation"));

  await request(`/api/conversations/${encodeURIComponent(conversation.id)}/messages`, {
    body: { text: "Hello from parent" },
    cookie: parentCookie,
    method: "POST"
  });
  await request(`/api/conversations/${encodeURIComponent(conversation.id)}/messages`, {
    body: { text: "Hello from tutor" },
    cookie: tutorCookie,
    method: "POST"
  });

  const unauthorizedContact = await request(
    `/api/contact-exchange?conversationId=${encodeURIComponent(conversation.id)}&view=authorized-profiles`,
    { cookie: parentCookie }
  );

  if (unauthorizedContact.payload.value !== null) {
    throw new Error("Unauthorized contact profile read returned data before approval.");
  }

  const exchangeRequest = await request("/api/contact-exchange", {
    body: { action: "create", conversationId: conversation.id },
    cookie: parentCookie,
    method: "POST"
  }).then((result) => expectOk(result, "create contact exchange"));

  await request("/api/contact-exchange", {
    body: {
      action: "approve",
      requestId: exchangeRequest.id,
      secondConfirmation: true
    },
    cookie: tutorCookie,
    method: "POST"
  });

  const authorizedContact = await request(
    `/api/contact-exchange?conversationId=${encodeURIComponent(conversation.id)}&view=authorized-profiles`,
    { cookie: parentCookie }
  ).then((result) => expectOk(result, "read authorized contact"));

  if (authorizedContact.currentUser.phone !== parentPhone ||
    authorizedContact.otherUser.phone !== tutorPhone) {
    throw new Error("Authorized contact profile read returned mismatched phones.");
  }

  return { conversationId: conversation.id, parentNeedId: parentNeed.id, tutorProfileId: tutorProfile.id };
}

async function main() {
  console.log(`M5 HTTP ${mode} start`);
  console.log(`Target: ${baseUrl}`);
  console.log(`Pairs: ${pairCount}; virtual users: ${pairCount * 2}`);

  const results = await Promise.all(
    Array.from({ length: pairCount }, (_, index) => runPair(index))
  );

  console.log(`M5 HTTP ${mode} passed`);
  printMetrics(scriptStartedAt, results.length);
}

main().catch((error) => {
  console.error(`M5 HTTP ${mode} failed`);
  console.error(error instanceof Error ? error.message : String(error));
  printMetrics(scriptStartedAt);
  process.exit(1);
});
