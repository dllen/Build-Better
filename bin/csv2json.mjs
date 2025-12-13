#!/usr/bin/env node
import fs from "node:fs";
import { parseCsvReadable } from "../shared/csv-parser.mjs";

function parseArgs(argv) {
  const args = { input: "-", delimiter: ",", quote: "\"", pretty: false, compact: false, parseNumber: true, verbose: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--input" || a === "-i") { args.input = argv[++i]; continue; }
    if (a === "--delimiter" || a === "-d") { args.delimiter = argv[++i]; continue; }
    if (a === "--quote" || a === "-q") { args.quote = argv[++i]; continue; }
    if (a === "--pretty") { args.pretty = true; continue; }
    if (a === "--compact") { args.compact = true; continue; }
    if (a === "--no-parse-number") { args.parseNumber = false; continue; }
    if (a === "--verbose" || a === "-v") { args.verbose = true; continue; }
    if (a === "--help" || a === "-h") { printHelp(); process.exit(0); }
  }
  return args;
}

function printHelp() {
  const text = [
    "csv2json — CSV → JSON converter",
    "Usage:",
    "  csv2json [-i file.csv] [--delimiter ,] [--quote \"] [--pretty|--compact] [--no-parse-number] [-v]",
    "Options:",
    "  -i, --input           Input file path (default: stdin)",
    "  -d, --delimiter       Field delimiter (default: ,)",
    "  -q, --quote           Quote character (default: \")",
    "      --pretty          Pretty-print JSON",
    "      --compact         Minified JSON (default if not pretty)",
    "      --no-parse-number Do not convert numeric-looking values",
    "  -v, --verbose         Verbose logging",
  ].join("\n");
  process.stderr.write(text + "\n");
}

async function main() {
  const args = parseArgs(process.argv);
  const start = process.hrtime.bigint();
  const readable = args.input === "-" ? process.stdin : fs.createReadStream(args.input);
  const logger = args.verbose ? (msg) => process.stderr.write(`[csv2json] ${msg}\n`) : null;
  try {
    const { rows, count } = await parseCsvReadable(readable, {
      delimiter: args.delimiter,
      quote: args.quote,
      parseNumber: args.parseNumber,
      logger,
    });
    const json = args.pretty ? JSON.stringify(rows, null, 2) : JSON.stringify(rows);
    process.stdout.write(json);
    const end = process.hrtime.bigint();
    if (logger) {
      const ms = Number(end - start) / 1e6;
      logger(`rows=${count} time=${ms.toFixed(2)}ms`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    process.stderr.write(`Error: ${msg}\n`);
    process.exit(1);
  }
}

main();
