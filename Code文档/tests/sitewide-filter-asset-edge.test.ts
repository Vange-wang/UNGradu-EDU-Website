import { createHash } from "node:crypto";
import path from "node:path";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

type Point = readonly [x: number, y: number];
type BackgroundContract = {
  readonly backFile: string;
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

const backAssets = [
  {
    file: "tutor-profiles-static-back.png",
    rgbSha256:
      "ac051994581ace666f71c313d8f60f084def75d6c9fda5de88c6584ae690a23e",
    transparentPixelCount: 350
  },
  {
    file: "parent-needs-static-back.png",
    rgbSha256:
      "9df41ed7a47f53c3eecfab54cb5df77612ea546c8d968571ada1f811a9aa59c6",
    transparentPixelCount: 328
  }
] as const;

const backgroundContracts = [
  {
    backFile: "tutor-profiles-static-back.png",
    file: "tutor-profiles-background.png",
    filterFile: "tutor-profiles-static-filter.png",
    outsideMaskSha256:
      "472f10226e16abbc8e1fe56cd0e0f6cb2afa2233bd0fcb4406da544ef97f884f",
    approvedPixelCount: 12137
  },
  {
    backFile: "parent-needs-static-back.png",
    file: "parent-needs-background.png",
    filterFile: "parent-needs-static-filter.png",
    outsideMaskSha256:
      "597aecffdfaab4f3d810144fdbd6102e62f2f3e2908f367d6c45f2795b1c1e9a",
    approvedPixelCount: 12102
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
  backData: Buffer,
  filterData: Buffer,
  x: number,
  y: number
) {
  const inFilterOuter = x >= 137 && x <= 559 && y >= 83 && y <= 972;
  const inFilter = x >= 141 && x <= 555 && y >= 87 && y <= 968;
  const inBackOuter = x >= 47 && x <= 111 && y >= 86 && y <= 146;
  const inBack = x >= 51 && x <= 107 && y >= 90 && y <= 142;

  let filterExterior = false;
  if (inFilterOuter) {
    if (!inFilter) {
      filterExterior = true;
    } else {
      const filterX = x - 141;
      const filterY = y - 87;
      filterExterior =
        filterData[(filterY * 415 + filterX) * 4 + 3] === 0;
    }
  }

  let backExterior = false;
  if (inBackOuter) {
    if (!inBack) {
      backExterior = true;
    } else {
      backExterior = backFrameExterior(backData, x - 51, y - 90);
    }
  }

  return filterExterior || backExterior;
}

function backFrameExterior(
  data: Buffer,
  x: number,
  y: number
) {
  const width = 57;
  let left = -1;
  let right = -1;

  for (let candidate = 0; candidate < 18; candidate += 1) {
    const source = (y * width + candidate) * 4;
    const luminance =
      (data[source] * 299 +
        data[source + 1] * 587 +
        data[source + 2] * 114) /
      1000;
    if (luminance <= 180) {
      left = candidate;
      break;
    }
  }
  for (let candidate = width - 1; candidate >= width - 18; candidate -= 1) {
    const source = (y * width + candidate) * 4;
    const luminance =
      (data[source] * 299 +
        data[source + 1] * 587 +
        data[source + 2] * 114) /
      1000;
    if (luminance <= 180) {
      right = candidate;
      break;
    }
  }

  return left < 0 || right < left || x < left || x > right;
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

  for (const asset of backAssets) {
    it(`${asset.file} only clears pixels outside the approved black return-button frame`, async () => {
      const { data, info } = await sharp(path.join(assetRoot, asset.file))
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      expect(info).toMatchObject({
        channels: 4,
        height: 53,
        width: 57
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

      for (const point of [
        [0, 0],
        [56, 0],
        [0, 52],
        [56, 52]
      ] satisfies Point[]) {
        expect(alphaAt(data, info.width, point), `${point} exterior alpha`).toBe(
          0
        );
      }
      for (const point of [
        [10, 0],
        [28, 0],
        [1, 20],
        [28, 26]
      ] satisfies Point[]) {
        expect(alphaAt(data, info.width, point), `${point} frame alpha`).toBe(
          255
        );
      }
    });
  }

  for (const contract of backgroundContracts) {
    it(`${contract.file} removes only pale pixels outside the approved black control frames`, async () => {
      const [
        { data, info },
        { data: filterData },
        { data: backData }
      ] = await Promise.all([
        sharp(path.join(assetRoot, contract.file))
          .raw()
          .toBuffer({ resolveWithObject: true }),
        sharp(path.join(assetRoot, contract.filterFile))
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true }),
        sharp(path.join(assetRoot, contract.backFile))
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
          if (!backgroundMask(backData, filterData, x, y)) {
            preservedPixels.push(
              data[source],
              data[source + 1],
              data[source + 2]
            );
            continue;
          }

          approvedPixelCount += 1;
          const inBackOuter = x >= 47 && x <= 111 && y >= 86 && y <= 146;
          const edgeDistances = inBackOuter
            ? [
                { distance: x - 47, x: 46, y },
                { distance: 111 - x, x: 112, y },
                { distance: y - 86, x, y: 85 },
                { distance: 146 - y, x, y: 147 }
              ]
            : [
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
