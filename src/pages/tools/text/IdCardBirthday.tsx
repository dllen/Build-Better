import { useMemo, useState } from "react";
import { CakeSlice } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

function extractInfo(id: string) {
  const clean = id.replace(/\s/g, "");
  if (clean.length !== 18 || !/^\d{17}[\dXx]$/.test(clean)) return null;

  const year = parseInt(clean.substring(6, 10));
  const month = parseInt(clean.substring(10, 12));
  const day = parseInt(clean.substring(12, 14));
  const gender = parseInt(clean[16]) % 2 === 1 ? "男" : "女";

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const today = new Date();
  const birth = new Date(year, month - 1, day);
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
    age--;
  }

  const zodiacAnimals = ["猴", "鸡", "狗", "猪", "鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊"];
  const zodiac = zodiacAnimals[year % 12];

  return {
    birthday: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    gender,
    age,
    zodiac,
  };
}

export default function IdCardBirthday() {
  const [id, setId] = useState("");

  const info = useMemo(() => extractInfo(id), [id]);

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-success/10 text-success">
            <CakeSlice className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">身份证提取</h1>
        </>
      }
      inputLabel="身份证号码"
      input={
        <div className="flex flex-col p-3 gap-3">
          <input
            className="rounded-md border border-border px-3 py-2 font-mono text-sm"
            placeholder="输入18位身份证号码"
            maxLength={18}
            value={id}
            onChange={(e) => setId(e.target.value.replace(/[^0-9Xx]/g, ""))}
          />
        </div>
      }
      outputLabel="提取信息"
      output={
        <div className="h-full overflow-auto px-3 py-3">
          {info ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded border">
                <div className="text-xs text-muted-foreground">出生日期</div>
                <div className="font-medium text-lg">{info.birthday}</div>
              </div>
              <div className="p-3 bg-muted rounded border">
                <div className="text-xs text-muted-foreground">性别</div>
                <div className="font-medium text-lg">{info.gender}</div>
              </div>
              <div className="p-3 bg-muted rounded border">
                <div className="text-xs text-muted-foreground">年龄</div>
                <div className="font-medium text-lg">{info.age} 岁</div>
              </div>
              <div className="p-3 bg-muted rounded border">
                <div className="text-xs text-muted-foreground">生肖</div>
                <div className="font-medium text-lg">{info.zodiac}</div>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">{id ? "请输入有效的18位身份证号码" : "输入身份证号码后自动提取"}</span>
          )}
        </div>
      }
    />
  );
}