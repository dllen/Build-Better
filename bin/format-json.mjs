#!/usr/bin/env node
import fs from "node:fs";
import { Formatter, FracturedJsonOptions } from 'fracturedjsonjs';

function parseArgs(argv) {
  const args = {
    input: "-",
    maxLength: 80,
    indent: 2,
    verbose: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--input" || a === "-i") {
      args.input = argv[++i];
      continue;
    }
    if (a === "--max-length" || a === "-m") {
      args.maxLength = parseInt(argv[++i], 10);
      continue;
    }
    if (a === "--indent") {
      args.indent = parseInt(argv[++i], 10);
      continue;
    }
    if (a === "--verbose" || a === "-v") {
      args.verbose = true;
      continue;
    }
    if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    }
  }
  return args;
}

function printHelp() {
  const text = [
    "format-json — JSON formatter using FracturedJson",
    "Usage:",
    '  format-json [-i file.json] [-m 80] [--indent 2] [-v]',
    "Options:",
    "  -i, --input           Input file path (default: stdin)",
    "  -m, --max-length      Max total line length (default: 80)",
    "      --indent          Indent spaces (default: 2)",
    "  -v, --verbose         Verbose logging",
  ].join("\n");
  process.stderr.write(text + "\n");
}

async function readInput(input) {
  if (input === "-") {
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString("utf8");
  } else {
    return fs.readFileSync(input, "utf8");
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const logger = args.verbose ? (msg) => process.stderr.write(`[format-json] ${msg}\n`) : null;
  
  try {
    const start = process.hrtime.bigint();
    const jsonString = await readInput(args.input);
    
    const options = new FracturedJsonOptions();
    options.MaxTotalLineLength = args.maxLength;
    options.IndentSpaces = args.indent;
    
    const formatter = new Formatter();
    formatter.Options = options;
    
    const formatted = formatter.Reformat(jsonString);
    process.stdout.write(formatted);
    
    // Ensure trailing newline if missing
    if (!formatted.endsWith('\n')) {
      process.stdout.write('\n');
    }

    const end = process.hrtime.bigint();
    if (logger) {
      const ms = Number(end - start) / 1e6;
      logger(`time=${ms.toFixed(2)}ms`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    process.stderr.write(`Error: ${msg}\n`);
    process.exit(1);
  }
}

main();
