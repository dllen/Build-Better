const defaultOptions = {
  delimiter: ",",
  quote: '"',
  parseNumber: true,
  logger: null,
};

function isNumericStrict(s) {
  if (s === "") return false;
  if (/^\s|\s$/.test(s)) return false;
  if (!/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(s)) return false;
  if (/^0\d+/.test(s)) return false;
  return true;
}

function convertType(s, parseNumber) {
  if (!parseNumber) return s;
  return isNumericStrict(s) ? Number(s) : s;
}

export class CsvParser {
  constructor(opts = {}) {
    const o = { ...defaultOptions, ...opts };
    this.delimiter = o.delimiter;
    this.quote = o.quote;
    this.parseNumber = o.parseNumber;
    this.logger = o.logger;
    this.decoder = new TextDecoder("utf-8");
    this.buffer = "";
    this.inQuotes = false;
    this.field = "";
    this.record = [];
    this.headers = null;
    this.rows = [];
    this.rowCount = 0;
  }

  feedChunk(uint8) {
    const text = this.decoder.decode(uint8, { stream: true });
    this._processText(text);
  }

  _processText(text) {
    const d = this.delimiter;
    const q = this.quote;
    let i = 0;
    while (i < text.length) {
      const ch = text[i];
      if (this.inQuotes) {
        if (ch === q) {
          const next = text[i + 1];
          if (next === q) {
            this.field += q;
            i += 2;
            continue;
          } else {
            this.inQuotes = false;
            i += 1;
            continue;
          }
        } else {
          this.field += ch;
          i += 1;
          continue;
        }
      } else {
        if (ch === q) {
          this.inQuotes = true;
          i += 1;
          continue;
        }
        if (ch === d) {
          this.record.push(this.field);
          this.field = "";
          i += 1;
          continue;
        }
        if (ch === "\r") {
          const next = text[i + 1];
          if (next === "\n") {
            i += 2;
          } else {
            i += 1;
          }
          this._endRecord();
          continue;
        }
        if (ch === "\n") {
          i += 1;
          this._endRecord();
          continue;
        }
        this.field += ch;
        i += 1;
      }
    }
  }

  _endRecord() {
    this.record.push(this.field);
    this.field = "";
    if (this.headers == null) {
      this.headers = this.record.map((h) => h);
      if (this.logger) this.logger(`headers: ${JSON.stringify(this.headers)}`);
    } else {
      if (this.record.length !== this.headers.length) {
        const msg = `Malformed CSV: column count ${this.record.length} != headers ${this.headers.length} at row ${this.rowCount + 1}`;
        throw new Error(msg);
      }
      const obj = {};
      for (let i = 0; i < this.headers.length; i++) {
        obj[this.headers[i]] = convertType(this.record[i], this.parseNumber);
      }
      this.rows.push(obj);
      this.rowCount += 1;
    }
    this.record = [];
  }

  finalize() {
    const tail = this.decoder.decode();
    if (tail) this._processText(tail);
    if (this.inQuotes) {
      throw new Error("Malformed CSV: unclosed quoted field at EOF");
    }
    if (this.field.length > 0 || this.record.length > 0) {
      this._endRecord();
    }
    if (this.headers == null) {
      throw new Error("Empty or header-less CSV: no data parsed");
    }
    return { rows: this.rows, headers: this.headers, count: this.rowCount };
  }
}

export async function parseCsvReadable(readable, options = {}) {
  const parser = new CsvParser(options);
  for await (let chunk of readable) {
    if (typeof chunk === "string") {
      chunk = Buffer.from(chunk, "utf-8");
    }
    parser.feedChunk(chunk);
  }
  return parser.finalize();
}

export async function parseCsvWebStream(webStream, options = {}) {
  const parser = new CsvParser(options);
  const reader = webStream.getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    parser.feedChunk(value);
  }
  return parser.finalize();
}
