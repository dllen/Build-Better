// Crops the WeChat Pay / Alipay tip QR codes out of the archived posters and
// writes the WebP assets served from /support/*.
//
// Sources: docs/assets/support/*.jpeg  (keep them, so a code rotation only needs a re-run)
// Output:  public/support/*.webp
//
// The crop rectangles were measured against the provided posters: the QR modules
// plus a ~6% white margin, excluding the coloured poster frame and the payer-name
// line. Re-measure if a source poster is ever replaced.
import { mkdir, stat } from "node:fs/promises";
import sharp from "sharp";

const OUT_DIR = "public/support";
const MAX_BYTES = 40 * 1024;

const JOBS = [
  {
    out: "wechat-pay.webp",
    source: "docs/assets/support/wechat-pay-source.jpeg",
    sourceSize: { width: 828, height: 1124 },
    crop: { left: 221, top: 275, width: 385, height: 385 },
    target: 385, // native size of the WeChat QR; never upscale
  },
  {
    out: "alipay.webp",
    source: "docs/assets/support/alipay-source.jpeg",
    sourceSize: { width: 1708, height: 2560 },
    crop: { left: 274, top: 898, width: 1160, height: 1160 },
    target: 640,
  },
];

await mkdir(OUT_DIR, { recursive: true });

for (const job of JOBS) {
  const meta = await sharp(job.source).metadata();
  if (meta.width !== job.sourceSize.width || meta.height !== job.sourceSize.height) {
    throw new Error(
      job.source +
        " is " +
        meta.width +
        "x" +
        meta.height +
        ", expected " +
        job.sourceSize.width +
        "x" +
        job.sourceSize.height +
        ". Re-measure the crop rectangle."
    );
  }

  const outPath = OUT_DIR + "/" + job.out;
  await sharp(job.source)
    .extract(job.crop)
    .resize(job.target, job.target, { fit: "fill" })
    .webp({ quality: 82, effort: 6 })
    .toFile(outPath);

  const { size } = await stat(outPath);
  if (size > MAX_BYTES) {
    throw new Error(
      outPath +
        " is " +
        (size / 1024).toFixed(1) +
        " KB, over the " +
        MAX_BYTES / 1024 +
        " KB budget"
    );
  }
  console.log(
    outPath + "  " + job.target + "x" + job.target + "  " + (size / 1024).toFixed(1) + " KB"
  );
}
