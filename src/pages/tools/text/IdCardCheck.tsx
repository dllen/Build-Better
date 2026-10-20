import { useState } from "react";
import { IdCard } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const CHECK_CHARS = "10X98765432";

interface ValidationResult {
  valid: boolean;
  reason?: string;
  region?: string;
  birthday?: string;
  gender?: string;
}

const REGION_MAP: Record<string, string> = {
  "11": "北京", "12": "天津", "13": "河北", "14": "山西", "15": "内蒙古",
  "21": "辽宁", "22": "吉林", "23": "黑龙江",
  "31": "上海", "32": "江苏", "33": "浙江", "34": "安徽", "35": "福建", "36": "江西", "37": "山东",
  "41": "河南", "42": "湖北", "43": "湖南", "44": "广东", "45": "广西", "46": "海南",
  "50": "重庆", "51": "四川", "52": "贵州", "53": "云南", "54": "西藏",
  "61": "陕西", "62": "甘肃", "63": "青海", "64": "宁夏", "65": "新疆",
  "71": "台湾", "81": "香港", "82": "澳门",
};

function validateIdCard(id: string): ValidationResult {
  if (!/^\d{17}[\dXx]$/.test(id)) {
    return { valid: false, reason: "格式错误：须为18位数字（末位可为X）" };
  }

  const region = id.substring(0, 2);
  if (!REGION_MAP[region]) {
    return { valid: false, reason: "地区码无效" };
  }

  const year = parseInt(id.substring(6, 10));
  const month = parseInt(id.substring(10, 12));
  const day = parseInt(id.substring(12, 14));

  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return { valid: false, reason: "出生日期无效" };
  }

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(id[i]) * WEIGHTS[i];
  }
  const checkChar = CHECK_CHARS[sum % 11];
  if (id[17].toUpperCase() !== checkChar) {
    return { valid: false, reason: "校验位不匹配" };
  }

  const gender = parseInt(id[16]) % 2 === 1 ? "男" : "女";

  return {
    valid: true,
    region: REGION_MAP[region],
    birthday: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    gender,
  };
}

export default function IdCardCheck() {
  const [id, setId] = useState("");
  const result = id.length === 18 ? validateIdCard(id) : null;

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-yellow-100 text-yellow-600">
            <IdCard className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">身份证校验</h1>
        </>
      }
      inputLabel="身份证号码"
      input={
        <div className="flex flex-col p-3 gap-3">
          <input
            className="rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
            placeholder="输入18位身份证号码"
            maxLength={18}
            value={id}
            onChange={(e) => setId(e.target.value.replace(/[^0-9Xx]/g, ""))}
          />
          {id.length > 0 && id.length < 18 && (
            <p className="text-xs text-gray-500">已输入 {id.length}/18 位</p>
          )}
        </div>
      }
      outputLabel="校验结果"
      output={
        <div className="h-full overflow-auto px-3 py-3">
          {result ? (
            <div className="space-y-3">
              <div className={`p-4 rounded-lg ${result.valid ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                <div className={`font-bold text-lg ${result.valid ? "text-green-700" : "text-red-700"}`}>
                  {result.valid ? "✓ 校验通过" : "✗ 校验失败"}
                </div>
                {!result.valid && <div className="text-sm text-red-600 mt-1">{result.reason}</div>}
              </div>
              {result.valid && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-500">地区</div>
                    <div className="font-medium">{result.region}</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-500">性别</div>
                    <div className="font-medium">{result.gender}</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded border col-span-2">
                    <div className="text-xs text-gray-500">出生日期</div>
                    <div className="font-medium">{result.birthday}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-400">输入18位号码后自动校验</span>
          )}
        </div>
      }
    />
  );
}