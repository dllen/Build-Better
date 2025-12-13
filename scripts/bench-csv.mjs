import { Readable } from "node:stream";
import { parseCsvReadable } from "../shared/csv-parser.mjs";

function genCsv(rows) {
  const header = "id,value,text\n";
  let body = "";
  for (let i = 1; i <= rows; i++) {
    const v = (i * 3.14159).toFixed(3);
    const t = `row ${i} "quoted"`;
    body += `${i},${v},"${t.replace(/"/g, '""')}"\n`;
  }
  return header + body;
}

async function main() {
  const rows = Number(process.env.ROWS || "50000");
  const csv = genCsv(rows);
  const start = process.hrtime.bigint();
  const { count } = await parseCsvReadable(Readable.from(csv), { logger: null });
  const end = process.hrtime.bigint();
  const ms = Number(end - start) / 1e6;
  const rps = count / (ms / 1000);
  console.log(JSON.stringify({ rows: count, ms: Number(ms.toFixed(2)), rps: Number(rps.toFixed(0)) }));
}

main();
