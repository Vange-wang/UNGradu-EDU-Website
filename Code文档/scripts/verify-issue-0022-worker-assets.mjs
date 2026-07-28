import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

import worker from "../cloudflare/worker.js";

const ORIGIN_VERIFY_HEADER = "x-ungrade-origin-verify";
const pages = [
  ["home", "/"],
  ["login", "/login"],
  ["rules", "/rules"],
  ["customer-service", "/customer-service"],
  ["tutor-profiles", "/tutor-profiles"],
  ["parent-needs", "/parent-needs"]
];

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    values[argv[index]?.replace(/^--/, "")] = argv[index + 1];
  }
  if (!values["upstream-url"] || !values["output-dir"]) {
    throw new Error("--upstream-url and --output-dir are required");
  }
  return {
    outputDir: path.resolve(values["output-dir"]),
    upstreamUrl: values["upstream-url"].replace(/\/$/, "")
  };
}

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to resolve local verification port");
  }
  return `http://127.0.0.1:${address.port}`;
}

async function close(server) {
  await new Promise((resolve) => server.close(resolve));
}

function sendNodeResponse(nodeResponse, response) {
  nodeResponse.statusCode = response.status;
  for (const [name, value] of response.headers) {
    if (name === "content-encoding" || name === "content-length") {
      continue;
    }
    nodeResponse.setHeader(name, value);
  }
  response.arrayBuffer().then(
    (body) => nodeResponse.end(Buffer.from(body)),
    (error) => nodeResponse.destroy(error)
  );
}

async function readNodeBody(nodeRequest) {
  if (nodeRequest.method === "GET" || nodeRequest.method === "HEAD") {
    return undefined;
  }
  const chunks = [];
  for await (const chunk of nodeRequest) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function runCapture({ baseUrl, outputDir, page, route }) {
  await new Promise((resolve, reject) => {
    let stderr = "";
    const child = spawn(
      process.execPath,
      [
        path.resolve("scripts/capture-sitewide-visual.mjs"),
        "--base-url",
        baseUrl,
        "--page",
        page,
        "--route",
        route,
        "--width",
        "1920",
        "--height",
        "974",
        "--output-dir",
        path.join(outputDir, page)
      ],
      {
        cwd: path.resolve("."),
        stdio: ["ignore", "ignore", "pipe"],
        windowsHide: true
      }
    );
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `visual capture failed for ${page}: exit ${code}; ${stderr.trim()}`
        )
      );
    });
  });
}

async function probe(url) {
  const response = await fetch(url, { redirect: "manual" });
  const body = Buffer.from(await response.arrayBuffer());
  return {
    contentType: response.headers.get("content-type"),
    pngSignature:
      body.length >= 8 &&
      body.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      ),
    size: body.length,
    status: response.status,
    url
  };
}

async function probeExpectedFailure(url) {
  try {
    return await probe(url);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : "unknown probe failure",
      status: null,
      url
    };
  }
}

const options = parseArgs(process.argv.slice(2));
const originVerifySecret = randomBytes(32).toString("base64url");
let guardedOrigin;
let workerProxy;

try {
  guardedOrigin = createServer(async (request, response) => {
    try {
      if (request.headers[ORIGIN_VERIFY_HEADER] !== originVerifySecret) {
        response.writeHead(403, { "content-type": "text/plain" });
        response.end("Forbidden.");
        return;
      }
      const headers = new Headers();
      for (const [name, value] of Object.entries(request.headers)) {
        if (
          name === "host" ||
          name === ORIGIN_VERIFY_HEADER ||
          value === undefined
        ) {
          continue;
        }
        headers.set(name, Array.isArray(value) ? value.join(", ") : value);
      }
      const upstreamResponse = await fetch(
        new URL(request.url ?? "/", options.upstreamUrl),
        {
          body: await readNodeBody(request),
          headers,
          method: request.method,
          redirect: "manual"
        }
      );
      sendNodeResponse(response, upstreamResponse);
    } catch (error) {
      response.writeHead(502, { "content-type": "text/plain" });
      response.end(error instanceof Error ? error.message : "upstream failure");
    }
  });
  const guardedOriginUrl = await listen(guardedOrigin);

  workerProxy = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "https://ungradeedu.eu.cc");
      const workerResponse = await worker.fetch(
        new Request(requestUrl, {
          body: await readNodeBody(request),
          headers: request.headers,
          method: request.method,
          redirect: "manual"
        }),
        {
          ORIGIN_VERIFY_SECRET: originVerifySecret,
          UPSTREAM_ORIGIN: guardedOriginUrl
        }
      );
      sendNodeResponse(response, workerResponse);
    } catch (error) {
      response.writeHead(502, { "content-type": "text/plain" });
      response.end(error instanceof Error ? error.message : "worker failure");
    }
  });
  const workerProxyUrl = await listen(workerProxy);

  await mkdir(options.outputDir, { recursive: true });
  const directWithoutWorker = await probe(
    `${guardedOriginUrl}/assets/sitewide-ui/brand-mark.png`
  );
  const workerAssetProbes = await Promise.all([
    probe(`${workerProxyUrl}/assets/sitewide-ui/brand-mark.png`),
    probe(`${workerProxyUrl}/assets/sitewide-ui/home-boy.png`),
    probe(`${workerProxyUrl}/assets/sitewide-ui/rules-student-shield.png`)
  ]);
  const manualOptimizerProbe = await probeExpectedFailure(
    `${workerProxyUrl}/_next/image?url=${encodeURIComponent(
      "/assets/sitewide-ui/brand-mark.png"
    )}&w=64&q=75`
  );

  for (const [page, route] of pages) {
    await runCapture({
      baseUrl: workerProxyUrl,
      outputDir: options.outputDir,
      page,
      route
    });
  }

  const summary = {
    captures: pages.map(([page, route]) => ({
      page,
      route,
      viewport: { height: 974, width: 1920 }
    })),
    directWithoutWorker,
    manualOptimizerProbe,
    workerAssetProbes
  };
  await writeFile(
    path.join(options.outputDir, "worker-asset-verification.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8"
  );
  console.log(
    JSON.stringify({
      captures: pages.length,
      directWithoutWorkerStatus: directWithoutWorker.status,
      manualOptimizerStatus: manualOptimizerProbe.status,
      workerAssetStatuses: workerAssetProbes.map((result) => result.status)
    })
  );
} finally {
  if (workerProxy) {
    await close(workerProxy);
  }
  if (guardedOrigin) {
    await close(guardedOrigin);
  }
}
