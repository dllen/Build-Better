import { useMemo, useState } from "react";
import { Languages, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

const S2T_MAP: Record<string, string> = {
  '国':'國','学':'學','习':'習','门':'門','开':'開','关':'關','书':'書',
  '车':'車','马':'馬','风':'風','电':'電','长':'長','飞':'飛','东':'東',
  '为':'爲','乐':'樂','乔':'喬','乡':'鄉','买':'買','乱':'亂','争':'爭',
  '亏':'虧','亲':'親','亿':'億','仅':'僅','从':'從','仑':'侖','仓':'倉',
  '仪':'儀','众':'眾','优':'優','会':'會','传':'傳','伤':'傷','伦':'倫',
  '伪':'僞','体':'體','余':'餘','佣':'傭','侠':'俠','侣':'侶','侦':'偵',
  '侧':'側','侨':'僑','俩':'倆','俭':'儉','伟':'偉','偏':'偏','停':'停',
  '健':'健','偶':'偶','储':'儲','催':'催','傲':'傲','傻':'傻','倾':'傾',
  '像':'像','僚':'僚','僵':'僵','价':'價','僻':'僻','儒':'儒','偿':'償',
  '励':'勵','劳':'勞','势':'勢','勋':'勛','动':'動','务':'務','胜':'勝',
  '募':'募','勤':'勤','劝':'勸','匀':'勻','医':'醫','华':'華','协':'協',
  '单':'單','卖':'賣','卫':'衛','厂':'廠','历':'歷','压':'壓','厌':'厭',
  '厉':'厲','厅':'廳','厕':'廁','县':'縣','参':'參','双':'雙','发':'發',
  '丛':'叢','号':'號','叶':'葉','叹':'嘆','吊':'弔','后':'後','向':'嚮',
  '听':'聽','启':'啟','员':'員','呜':'嗚','周':'週','响':'響','哗':'譁',
  '哟':'喲','问':'問','吓':'嚇','严':'嚴','团':'團','园':'園','困':'困',
  '围':'圍','图':'圖','圆':'圓','圣':'聖','场':'場','坛':'壇',
  '坏':'壞','坚':'堅','坝':'壩','坟':'墳','垄':'壟','垒':'壘','垫':'墊',
  '堕':'墮','墙':'牆','壮':'壯','声':'聲','壳':'殼','处':'處','备':'備',
  '复':'複','梦':'夢','头':'頭','夺':'奪','奋':'奮','奖':'獎','奥':'奧',
  '妇':'婦','妈':'媽','娇':'嬌','婴':'嬰','婶':'嬸','孙':'孫',
  '宁':'寧','宝':'寶','实':'實','审':'審','宽':'寬','对':'對','寻':'尋',
  '导':'導','寿':'壽','将':'將','专':'專','尔':'爾','尘':'塵','尝':'嚐',
  '层':'層','属':'屬','屡':'屢','岁':'歲','岗':'崗','岛':'島','岩':'巖',
  '岭':'嶺','岳':'嶽','峡':'峽','币':'幣','帮':'幫','带':'帶','干':'幹',
  '广':'廣','庄':'莊','庆':'慶','库':'庫','应':'應','庙':'廟','张':'張',
  '弹':'彈','强':'強','归':'歸','当':'當','录':'錄','征':'徵','汇':'匯',
  '区':'區','冲':'衝','术':'術','忆':'憶','志':'誌','态':'態','总':'總',
  '虑':'慮','恋':'戀','恳':'懇','闷':'悶','惊':'驚','惩':'懲','愿':'願',
  '忧':'憂','戏':'戲','战':'戰','房':'房','护':'護','报':'報','拟':'擬',
  '拢':'攏','拥':'擁','拦':'攔','拨':'撥','择':'擇','挥':'揮','损':'損',
  '换':'換','据':'據','摄':'攝','摆':'擺','摇':'搖','摊':'攤','击':'擊',
  '担':'擔','败':'敗','敌':'敵','数':'數','断':'斷','无':'無','旧':'舊',
  '时':'時','昼':'晝','显':'顯','晋':'晉','晒':'曬',
  '权':'權','条':'條','来':'來','杨':'楊','杰':'傑','松':'鬆','板':'闆',
  '极':'極','构':'構','枪':'槍','柜':'櫃','标':'標','栏':'欄','树':'樹',
  '档':'檔','桥':'橋','桦':'樺','检':'檢','梁':'樑','椭':'橢','橱':'櫥',
  '机':'機','杀':'殺','殿':'殿','毁':'毀','毅':'毅',
};

const T2S_MAP: Record<string, string> = {};
for (const [s, t] of Object.entries(S2T_MAP)) { if (!T2S_MAP[t]) T2S_MAP[t] = s; }

const MARTIAN_MAP: Record<string, string> = {
  '的':'の','是':'素','不':'吥','了':'孒','我':'莪','你':'伱','他':'彵',
  '她':'怹','们':'菛','这':'适','那':'呐','好':'恏','很':'詪','就':'勼',
  '要':'崾','会':'哙','能':'螚','都':'嘟','说':'哾','想':'葙',
  '爱':'噯','有':'冇','在':'茬','和':'咊','对':'対','大':'汏','小':'尛',
};

function toMartian(text: string): string {
  let result = "";
  for (const ch of text) {
    if (MARTIAN_MAP[ch]) result += MARTIAN_MAP[ch];
    else if (S2T_MAP[ch]) result += S2T_MAP[ch];
    else result += ch;
  }
  return result;
}

type Mode = "s2t" | "t2s" | "martian";

export default function SimplifiedTraditional() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("s2t");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!text) return "";
    if (mode === "s2t") {
      let out = "";
      for (const ch of text) { out += S2T_MAP[ch] || ch; }
      return out;
    }
    if (mode === "t2s") {
      let out = "";
      for (const ch of text) { out += T2S_MAP[ch] || ch; }
      return out;
    }
    return toMartian(text);
  }, [text, mode]);

  function copy(textToCopy: string) {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  }

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-destructive/10 text-destructive">
            <Languages className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">简繁互转</h1>
        </>
      }
      toolbar={
        <>
          <select
            className="rounded-md border border-border px-3 py-2 text-sm"
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
          >
            <option value="s2t">简体 → 繁体</option>
            <option value="t2s">繁体 → 简体</option>
            <option value="martian">简体 → 火星文</option>
          </select>
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs hover:bg-muted"
            onClick={() => copy(result)}
            disabled={!result}
          >
            <ClipboardCopy className="h-3.5 w-3.5" /> 复制
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : null}
          </button>
        </>
      }
      inputLabel="输入"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder={mode === "t2s" ? "输入繁体文本..." : "输入简体文本..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel="结果"
      output={
        <pre className="h-full overflow-auto px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">
          {result || "—"}
        </pre>
      }
    />
  );
}
