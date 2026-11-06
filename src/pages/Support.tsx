import { Link } from "react-router-dom";
import { SEO } from "@/components/seo";

interface TipMethod {
  name: string;
  nameZh: string;
  hint: string;
  hintZh: string;
  image: string;
  width: number;
  height: number;
  alt: string;
}

const TIP_METHODS: TipMethod[] = [
  {
    name: "WeChat Pay",
    nameZh: "微信支付",
    hint: "Open WeChat → Scan",
    hintZh: "打开微信 → 扫一扫",
    image: "/support/wechat-pay.webp",
    width: 385,
    height: 385,
    alt: "WeChat Pay QR code — scan with WeChat to tip Build Better",
  },
  {
    name: "Alipay",
    nameZh: "支付宝",
    hint: "Open Alipay → Scan",
    hintZh: "打开支付宝 → 扫一扫",
    image: "/support/alipay.webp",
    width: 640,
    height: 640,
    alt: "Alipay QR code — scan with Alipay to tip Build Better",
  },
];

export default function Support() {
  return (
    <>
      <SEO
        title="Support Build Better"
        description="Build Better is free and ad-light. If it saved you time, you can leave a tip with WeChat Pay or Alipay."
      />
      <article className="max-w-3xl mx-auto space-y-8 text-foreground">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Support Build Better</h1>
          <p className="text-muted-foreground" lang="zh-CN">
            支持 Build Better
          </p>
        </header>

        <section className="space-y-3">
          <p className="text-muted-foreground leading-relaxed">
            Build Better is free, has no login, and runs in your browser. If it saved you a few
            minutes today, you can leave a small tip — it pays for hosting and keeps the tools
            ad-light.
          </p>
          <p className="text-muted-foreground leading-relaxed" lang="zh-CN">
            Build Better
            是一个免费、无需登录的浏览器工具站，所有工具都在你的浏览器里运行。如果它今天帮你省下了几分钟，可以请我喝杯咖啡。
          </p>
        </section>

        <section className="grid gap-6 sm:grid-cols-2" aria-label="Payment methods">
          {TIP_METHODS.map((method) => (
            <div
              key={method.name}
              className="bg-card text-card-foreground rounded-xl border border-border p-6 flex flex-col items-center text-center gap-4"
            >
              {/* Literal white is intentional: the repo's "white" token is remapped to the theme background. */}
              <div className="bg-[#ffffff] p-3 rounded-lg border border-border">
                <img
                  src={method.image}
                  alt={method.alt}
                  width={method.width}
                  height={method.height}
                  decoding="async"
                  className="w-full max-w-[240px] h-auto"
                />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{method.name}</h2>
                <p className="text-sm text-muted-foreground" lang="zh-CN">
                  {method.nameZh}
                </p>
                <p className="text-sm text-muted-foreground">
                  {method.hint}
                  <span className="block" lang="zh-CN">
                    {method.hintZh}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </section>

        <p className="text-sm text-muted-foreground leading-relaxed">
          On a phone? Long-press the code to save it, then scan it from the app's album.
          <span className="block" lang="zh-CN">
            在手机上？长按保存图片，再从 App 相册扫码。
          </span>
        </p>

        <section className="space-y-3 bg-card text-card-foreground rounded-xl border border-border p-6">
          <p className="text-muted-foreground leading-relaxed">
            Any amount, one-off. No account, no subscription, and nothing is stored on the site —
            the payment happens inside your wallet app.
          </p>
          <p className="text-muted-foreground leading-relaxed" lang="zh-CN">
            任意金额，一次性支持。无需账号、无需订阅，本站不存储任何信息——付款在你的支付 App
            内完成。
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Outside mainland China, WeChat Pay and Alipay require a Chinese bank account. If you'd
            still like to help,{" "}
            <Link
              to="/contact"
              className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
            >
              get in touch
            </Link>
            .
          </p>
          <p className="font-medium text-foreground">
            Thank you. <span lang="zh-CN">谢谢。</span>
          </p>
        </section>
      </article>
    </>
  );
}
