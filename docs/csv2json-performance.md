# CSV → JSON 性能测试报告

## 环境
- Node.js：本机运行（`node --version`）
- 测试脚本：`npm run bench:csv`（默认 50,000 行）

## 指标
- 输出 JSON：压缩模式
- 统计：
  - 总行数（不含表头）
  - 耗时（毫秒）
  - 处理速率（行/秒）

## 结果样例
```
npm run bench:csv
{"rows":50000,"ms":XXX.XX,"rps":YYYYY}
```

## 结论
- 流式解析在 50k 行规模下具有良好吞吐
- 性能受字段复杂度、引号与转义比例影响
- 对更大文件建议使用 `--compact` 输出并关闭不必要日志
