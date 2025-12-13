# CSV → JSON 工具使用文档

## 功能概述
- 读取标准 CSV，首行表头作为 JSON 键名
- 支持自定义分隔符与引号字符
- 流式处理，适合大文件
- 保留数据类型（数字转换），可关闭转换
- 输出美化（pretty）与压缩（compact）

## 命令行使用
```
csv2json [-i file.csv] [--delimiter ,] [--quote "] [--pretty|--compact] [--no-parse-number] [-v]
```
- `-i, --input`：输入文件路径，默认 `stdin`
- `-d, --delimiter`：字段分隔符，默认 `,`
- `-q, --quote`：引号字符，默认 `"`
- `--pretty`：美化输出
- `--compact`：压缩输出（默认）
- `--no-parse-number`：禁用数字转换
- `-v, --verbose`：日志输出

示例：
```
npm run csv2json -- -i samples/users.csv --delimiter , --quote " --pretty
cat samples/users.csv | npm run csv2json -- --pretty
```

## API 使用（Cloudflare Pages Functions）
- 路径：`POST /api/tools/csv2json`
- 请求头：
  - `Content-Type: text/csv`（流式）或 `application/json`
- 查询参数：
  - `delimiter`、`quote`、`mode=pretty|compact`、`parseNumber=true|false`
- `application/json` 请求体示例：
```json
{
  "csv": "a,b\n1,2\n"
}
```

## 数据类型说明
- 默认将形如 `-?\d+(\.\d+)?` 且不含前导零的值转换为数字
- 可使用 `--no-parse-number` 或 `parseNumber=false` 关闭

## 错误处理
- 列数不一致：`Malformed CSV: column count ...`
- 未闭合引号：`Malformed CSV: unclosed quoted field at EOF`
- 空或无表头：`Empty or header-less CSV: no data parsed`

## 兼容与编码
- 采用 UTF-8 解码
- 支持 `\r\n` 与 `\n`

