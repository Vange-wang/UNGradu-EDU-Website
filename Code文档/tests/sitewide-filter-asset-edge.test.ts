import { createHash } from "node:crypto";
import path from "node:path";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

type Point = readonly [x: number, y: number];
type BackgroundContract = {
  readonly file: string;
  readonly filterFile: string;
  readonly outsideMaskSha256: string;
  readonly approvedPixelCount: number;
};

const assetRoot = path.resolve(
  process.cwd(),
  "public",
  "assets",
  "sitewide-ui"
);

const assets = [
  {
    file: "tutor-profiles-static-filter.png",
    rgbSha256:
      "587746b19ba9e5ad8b066325ebeb83559b4c04e2de7509ce54f49bc252d1c807",
    transparentPixelCount: 403,
    exterior: [
      [0, 0],
      [414, 19],
      [0, 881],
      [414, 881]
    ] satisfies Point[],
    preserved: [
      [17, 0],
      [0, 20],
      [200, 200],
      [17, 881],
      [398, 881]
    ] satisfies Point[]
  },
  {
    file: "parent-needs-static-filter.png",
    rgbSha256:
      "3b4a3f02cb76c5491dfe8384a77c4885cea0395310451dc9eca876ee93255857",
    transparentPixelCount: 390,
    exterior: [
      [0, 0],
      [414, 0],
      [0, 881],
      [414, 881]
    ] satisfies Point[],
    preserved: [
      [17, 0],
      [0, 20],
      [200, 200],
      [17, 881],
      [398, 881]
    ] satisfies Point[]
  }
] as const;

const backgroundContracts = [
  {
    file: "tutor-profiles-background.png",
    filterFile: "tutor-profiles-static-filter.png",
    outsideMaskSha256:
      "1de28aee2719134a3ea4b83a1c78ea1529a1f17066031f5938335b883f29a18a",
    approvedPixelCount: 10843
  },
  {
    file: "parent-needs-background.png",
    filterFile: "parent-needs-static-filter.png",
    outsideMaskSha256:
      "cc683fa2c8832be544f7153e092a36208acbafdd37136ef4fab5fa4313a41ef0",
    approvedPixelCount: 10830
  }
] satisfies BackgroundContract[];

function alphaAt(
  data: Buffer,
  width: number,
  [x, y]: Point
) {
  return data[(y * width + x) * 4 + 3];
}

function backgroundMask(
  filterData: Buffer,
  x: number,
  y: number
) {
  const inOuter = x >= 137 && x <= 559 && y >= 83 && y <= 972;
  const inFilter = x >= 141 && x <= 555 && y >= 87 && y <= 968;

  if (!inOuter) {
    return false;
  }
  if (!inFilter) {
    return true;
  }

  const filterX = x - 141;
  const filterY = y - 87;
  return filterData[(filterY * 415 + filterX) * 4 + 3] === 0;
}

describe("sitewide marketplace filter static assets", () => {
  for (const asset of assets) {
    it(`${asset.file} only clears pixels outside the approved black frame`, async () => {
      const { data, info } = await sharp(path.join(assetRoot, asset.file))
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      expect(info).toMatchObject({
        channels: 4,
        height: 882,
        width: 415
      });

      const rgb = Buffer.alloc(info.width * info.height * 3);
      let transparentPixelCount = 0;

      for (let source = 0, target = 0; source < data.length; source += 4) {
        rgb[target] = data[source];
        rgb[target + 1] = data[source + 1];
        rgb[target + 2] = data[source + 2];
        target += 3;
        if (data[source + 3] === 0) {
          transparentPixelCount += 1;
        }
      }

      expect(createHash("sha256").update(rgb).digest("hex")).toBe(
        asset.rgbSha256
      );
      expect(transparentPixelCount).toBe(asset.transparentPixelCount);

      for (const point of asset.exterior) {
        expect(alphaAt(data, info.width, point), `${point} exterior alpha`).toBe(
          0
        );
      }
      for (const point of asset.preserved) {
        expect(alphaAt(data, info.width, point), `${point} frame alpha`).toBe(
          255
        );
      }
    });
  }

  for (const contract of backgroundContracts) {
    it(`${contract.file} removes only the pale frame pixels outside the black filter frame`, async () => {
      const [{ data, info }, { data: filterData }] = await Promise.all([
        sharp(path.join(assetRoot, contract.file))
          .raw()
          .toBuffer({ resolveWithObject: true }),
        sharp(path.join(assetRoot, contract.filterFile))
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true })
      ]);

      expect(info).toMatchObject({
        channels: 3,
        height: 1024,
        width: 1536
      });

      const preservedPixels: number[] = [];
      let approvedPixelCount = 0;
      let maximumChannelDiscontinuity = 0;

      for (let y = 0; y < info.height; y += 1) {
        for (let x = 0; x < info.width; x += 1) {
          const source = (y * info.width + x) * 3;
          if (!backgroundMask(filterData, x, y)) {
            preservedPixels.push(
              data[source],
              data[source + 1],
              data[source + 2]
            );
            continue;
          }

          approvedPixelCount += 1;
          const edgeDistances = [
            { distance: x - 137, x: 136, y },
            { distance: 559 - x, x: 560, y },
            { distance: y - 83, x, y: 82 },
            { distance: 972 - y, x, y: 973 }
          ];
          const nearestExterior = edgeDistances.reduce((nearest, candidate) =>
            candidate.distance < nearest.distance ? candidate : nearest
          );
          const referenceX = nearestExterior.x;
          const referenceY = nearestExterior.y;
          const reference = (referenceY * info.width + referenceX) * 3;
          for (let channel = 0; channel < 3; channel += 1) {
            maximumChannelDiscontinuity = Math.max(
              maximumChannelDiscontinuity,
              Math.abs(data[source + channel] - data[reference + channel])
            );
          }
        }
      }

      expect(approvedPixelCount).toBe(contract.approvedPixelCount);
      expect(
        createHash("sha256")
          .update(Buffer.from(preservedPixels))
          .digest("hex")
      ).toBe(contract.outsideMaskSha256);
      expect(maximumChannelDiscontinuity).toBeLessThanOrEqual(4);
    });
  }
});
