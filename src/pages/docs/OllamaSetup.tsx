import React from "react";
import { Terminal as TerminalIcon, ExternalLink, Download, Cpu, Settings2, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CalculatorShell } from "@/components/common/CalculatorShell";

/**
 * Multi-language Ollama setup guide. Each language has install commands
 * plus a "verify" step and "models" recommendations. References official
 * Ollama docs as canonical source for the latest install steps.
 */
const OLLAMA_URLS = {
  download: "https://ollama.com/download",
  docs: "https://ollama.com/docs",
  models: "https://ollama.com/library",
};

const STEPS_DATA: Record<string, {
  intro: string;
  installTitle: string;
  installBody: string;
  startTitle: string;
  startBody: string;
  verifyTitle: string;
  verifyBody: string;
  modelTitle: string;
  modelBody: string;
  useTitle: string;
  useBody: string;
  troubleshootTitle: string;
  troubleshootBody: string;
}> = {
  en: {
    intro: "Run AI models locally for the Build-Better AI tools. Ollama keeps everything on your machine — no API keys, no cloud.",
    installTitle: "1. Install Ollama",
    installBody: "Download the official installer for your platform. macOS and Linux users can also use the one-line curl install shown on the official site.",
    startTitle: "2. Start the server",
    startBody: "After installing, Ollama runs as a background service on macOS and Windows. On Linux you may need to start it manually. The default API endpoint is http://localhost:11434.",
    verifyTitle: "3. Verify it's running",
    verifyBody: "In a terminal, run: ollama --version, and curl http://localhost:11434/api/tags. If you see a JSON model list, you're good.",
    modelTitle: "4. Pull a model",
    modelBody: "Recommended for Build-Better AI tools: ollama pull llama3.2:latest. Larger models (deepseek-v3.1, qwen3) give better results but need more RAM.",
    useTitle: "5. Use it in Build-Better",
    useBody: "Open any AI tool on this site (Customer Reply, Product Description, etc.). The model picker in the input column lets you switch between installed models.",
    troubleshootTitle: "Common issues",
    troubleshootBody: "Port in use: another service is using 11434 — change OLLAMA_HOST. Slow first response: llama3.2 first token can take 2-5s. CORS errors: Ollama accepts browser requests by default from localhost origins.",
  },
  zh: {
    intro: "在本地运行 AI 模型为 Build-Better 工具服务。所有数据都在本机，无需 API key，无需联网。",
    installTitle: "1. 安装 Ollama",
    installBody: "下载官方安装包，macOS/Linux 也可使用官网的一行 curl 安装命令。",
    startTitle: "2. 启动服务",
    startBody: "安装后 Ollama 在 macOS 和 Windows 自动后台运行。Linux 可能需要手动启动。默认 API 端口 http://localhost:11434。",
    verifyTitle: "3. 验证运行状态",
    verifyBody: "在终端执行：ollama --version，以及 curl http://localhost:11434/api/tags。看到 JSON 模型列表即成功。",
    modelTitle: "4. 下载模型",
    modelBody: "推荐执行：ollama pull llama3.2:latest。更大的模型（deepseek-v3.1、qwen3）效果更好但需要更多内存。",
    useTitle: "5. 在 Build-Better 中使用",
    useBody: "打开本网站的任意 AI 工具（如 AI 客服回复），输入区上方的模型选择器可以切换已安装的模型。",
    troubleshootTitle: "常见问题",
    troubleshootBody: "端口占用：另一个服务在使用 11434 — 设置环境变量 OLLAMA_HOST 切换。首次响应慢：llama3.2 首个 token 需 2-5秒。CORS 错误：Ollama 默认允许来自 localhost 的浏览器请求。",
  },
  ja: {
    intro: "Build-Better AI ツール用にローカルで AI モデルを実行。Ollama ならマシン内ですべて完結 — API キー不要、クラウド不要。",
    installTitle: "1. Ollama をインストール",
    installBody: "公式サイトからお使いのプラットフォーム用のインストーラーをダウンロード。macOS と Linux では公式の curl 一行インストールも利用可能。",
    startTitle: "2. サーバーを起動",
    startBody: "インストール後、macOS と Windows では Ollama がバックグラウンドで動作。Linux では手動起動が必要な場合あり。デフォルト API: http://localhost:11434。",
    verifyTitle: "3. 動作確認",
    verifyBody: "ターミナルで実行: ollama --version、curl http://localhost:11434/api/tags。JSON のモデル一覧が表示されれば成功。",
    modelTitle: "4. モデルを取得",
    modelBody: "Build-Better 推奨: ollama pull llama3.2:latest。大きなモデル (deepseek-v3.1、qwen3) は性能向上だが RAM が必要。",
    useTitle: "5. Build-Better で使う",
    useBody: "本サイトの AI ツールを開く。入力欄のモデルピッカーでインストール済みモデルを切り替え可能。",
    troubleshootTitle: "トラブルシューティング",
    troubleshootBody: "ポート競合: 11434 が使用中 — OLLAMA_HOST で変更。初回遅延: llama3.2 の最初のトークンに 2-5 秒。CORS エラー: Ollama は localhost からのブラウザリクエストをデフォルト許可。",
  },
  ko: {
    intro: "Build-Better AI 도구를 위해 로컬에서 AI 모델 실행. Ollama는 모든 것을 기기에 보관 — API 키 불필요, 클라우드 불필요.",
    installTitle: "1. Ollama 설치",
    installBody: "공식 사이트에서 플랫폼용 설치 프로그램 다운로드. macOS/Linux는 공식 사이트의 curl 한 줄 설치도 가능.",
    startTitle: "2. 서버 시작",
    startBody: "설치 후 macOS/Windows에서 Ollama가 백그라운드 실행. Linux는 수동 시작 필요할 수 있음. 기본 API: http://localhost:11434.",
    verifyTitle: "3. 실행 확인",
    verifyBody: "터미널에서 실행: ollama --version, curl http://localhost:11434/api/tags. JSON 모델 목록이 보이면 성공.",
    modelTitle: "4. 모델 받기",
    modelBody: "Build-Better 추천: ollama pull llama3.2:latest. 더 큰 모델 (deepseek-v3.1, qwen3)은 더 좋은 결과지만 더 많은 RAM 필요.",
    useTitle: "5. Build-Better에서 사용",
    useBody: "본 사이트의 AI 도구 열기. 입력 영역의 모델 선택기로 설치된 모델 간 전환 가능.",
    troubleshootTitle: "문제 해결",
    troubleshootBody: "포트 충돌: 11434 사용 중 — OLLAMA_HOST 변경. 첫 응답 느림: llama3.2 첫 토큰 2-5초. CORS 오류: Ollama는 localhost에서의 브라우저 요청 기본 허용.",
  },
  es: {
    intro: "Ejecuta modelos de IA localmente para las herramientas Build-Better. Ollama lo mantiene todo en tu equipo.",
    installTitle: "1. Instalar Ollama",
    installBody: "Descarga el instalador oficial para tu plataforma. macOS/Linux también pueden usar la instalación de una línea con curl del sitio oficial.",
    startTitle: "2. Iniciar el servidor",
    startBody: "Tras instalar, Ollama corre como servicio en macOS y Windows. En Linux puede requerir inicio manual. API por defecto: http://localhost:11434.",
    verifyTitle: "3. Verificar",
    verifyBody: "En terminal: ollama --version, curl http://localhost:11434/api/tags. Si ves una lista JSON de modelos, funciona.",
    modelTitle: "4. Descargar un modelo",
    modelBody: "Recomendado: ollama pull llama3.2:latest. Modelos más grandes (deepseek-v3.1, qwen3) dan mejores resultados pero necesitan más RAM.",
    useTitle: "5. Usar en Build-Better",
    useBody: "Abre cualquier herramienta IA. El selector de modelo en la columna de entrada permite cambiar entre modelos instalados.",
    troubleshootTitle: "Problemas comunes",
    troubleshootBody: "Puerto en uso: otro servicio usa 11434 — cambia OLLAMA_HOST. Primera respuesta lenta: llama3.2 tarda 2-5s. Errores CORS: Ollama acepta requests del navegador desde localhost por defecto.",
  },
  pt: {
    intro: "Execute modelos de IA localmente para as ferramentas Build-Better. Ollama mantém tudo na sua máquina.",
    installTitle: "1. Instalar Ollama",
    installBody: "Baixe o instalador oficial para sua plataforma. macOS/Linux também podem usar a instalação de uma linha via curl do site oficial.",
    startTitle: "2. Iniciar o servidor",
    startBody: "Após instalar, Ollama roda como serviço em macOS e Windows. No Linux pode exigir início manual. API padrão: http://localhost:11434.",
    verifyTitle: "3. Verificar",
    verifyBody: "No terminal: ollama --version, curl http://localhost:11434/api/tags. Se aparecer uma lista JSON de modelos, está funcionando.",
    modelTitle: "4. Baixar um modelo",
    modelBody: "Recomendado: ollama pull llama3.2:latest. Modelos maiores (deepseek-v3.1, qwen3) dão melhores resultados mas precisam de mais RAM.",
    useTitle: "5. Usar no Build-Better",
    useBody: "Abra qualquer ferramenta IA. O seletor de modelo na coluna de entrada permite alternar entre modelos instalados.",
    troubleshootTitle: "Problemas comuns",
    troubleshootBody: "Porta em uso: outro serviço usa 11434 — altere OLLAMA_HOST. Primeira resposta lenta: llama3.2 leva 2-5s. Erros CORS: Ollama aceita requests do navegador de localhost por padrão.",
  },
  fr: {
    intro: "Exécutez des modèles IA localement pour les outils Build-Better. Ollama garde tout sur votre machine.",
    installTitle: "1. Installer Ollama",
    installBody: "Téléchargez l'installateur officiel pour votre plateforme. macOS/Linux peuvent aussi utiliser l'installation curl en une ligne du site officiel.",
    startTitle: "2. Démarrer le serveur",
    startBody: "Après l'installation, Ollama tourne en arrière-plan sur macOS et Windows. Sur Linux vous devrez peut-être le démarrer manuellement. API par défaut : http://localhost:11434.",
    verifyTitle: "3. Vérifier",
    verifyBody: "Dans le terminal : ollama --version, curl http://localhost:11434/api/tags. Si une liste JSON de modèles s'affiche, c'est bon.",
    modelTitle: "4. Télécharger un modèle",
    modelBody: "Recommandé : ollama pull llama3.2:latest. Les modèles plus grands (deepseek-v3.1, qwen3) donnent de meilleurs résultats mais nécessitent plus de RAM.",
    useTitle: "5. Utiliser dans Build-Better",
    useBody: "Ouvrez n'importe quel outil IA. Le sélecteur de modèle dans la colonne d'entrée permet de basculer entre les modèles installés.",
    troubleshootTitle: "Problèmes courants",
    troubleshootBody: "Port utilisé : un autre service utilise 11434 — changez OLLAMA_HOST. Première réponse lente : llama3.2 prend 2-5s. Erreurs CORS : Ollama accepte les requêtes du navigateur depuis localhost par défaut.",
  },
  de: {
    intro: "KI-Modelle lokal für die Build-Better-Tools ausführen. Ollama hält alles auf Ihrem Rechner.",
    installTitle: "1. Ollama installieren",
    installBody: "Laden Sie den offiziellen Installer für Ihre Plattform. macOS/Linux können auch den curl-Einzeiler von der offiziellen Seite verwenden.",
    startTitle: "2. Server starten",
    startBody: "Nach der Installation läuft Ollama auf macOS und Windows als Dienst. Unter Linux muss er evtl. manuell gestartet werden. Standard-API: http://localhost:11434.",
    verifyTitle: "3. Überprüfen",
    verifyBody: "Im Terminal: ollama --version, curl http://localhost:11434/api/tags. Wenn eine JSON-Modellliste erscheint, funktioniert es.",
    modelTitle: "4. Modell laden",
    modelBody: "Empfohlen: ollama pull llama3.2:latest. Größere Modelle (deepseek-v3.1, qwen3) liefern bessere Ergebnisse, brauchen aber mehr RAM.",
    useTitle: "5. In Build-Better verwenden",
    useBody: "Öffnen Sie ein beliebiges KI-Tool. Die Modellauswahl in der Eingabespalte ermöglicht das Wechseln zwischen installierten Modellen.",
    troubleshootTitle: "Häufige Probleme",
    troubleshootBody: "Port belegt: ein anderer Dienst nutzt 11434 — OLLAMA_HOST ändern. Langsame erste Antwort: llama3.2 2-5s. CORS-Fehler: Ollama erlaubt standardmäßig Browser-Anfragen von localhost.",
  },
  ru: {
    intro: "Запускайте ИИ-модели локально для инструментов Build-Better. Ollama хранит всё на вашем компьютере.",
    installTitle: "1. Установка Ollama",
    installBody: "Скачайте официальный установщик для вашей платформы. macOS/Linux также могут использовать однострочник curl с официального сайта.",
    startTitle: "2. Запуск сервера",
    startBody: "После установки Ollama работает как фоновый сервис на macOS и Windows. На Linux может потребоваться ручной запуск. API по умолчанию: http://localhost:11434.",
    verifyTitle: "3. Проверка",
    verifyBody: "В терминале: ollama --version, curl http://localhost:11434/api/tags. Если видите JSON-список моделей — всё работает.",
    modelTitle: "4. Загрузка модели",
    modelBody: "Рекомендуется: ollama pull llama3.2:latest. Большие модели (deepseek-v3.1, qwen3) дают лучшие результаты, но требуют больше RAM.",
    useTitle: "5. Использование в Build-Better",
    useBody: "Откройте любой ИИ-инструмент. Переключатель моделей в колонке ввода позволяет менять установленные модели.",
    troubleshootTitle: "Частые проблемы",
    troubleshootBody: "Порт занят: другая служба использует 11434 — измените OLLAMA_HOST. Медленный первый ответ: llama3.2 2-5с. CORS ошибки: Ollama по умолчанию разрешает запросы с localhost.",
  },
  ar: {
    intro: "قم بتشغيل نماذج الذكاء الاصطناعي محليًا لأدوات Build-Better. Ollama تحتفظ بكل شيء على جهازك.",
    installTitle: "1. تثبيت Ollama",
    installBody: "حمّل برنامج التثبيت الرسمي لنظامك. macOS/Linux يمكنهم أيضًا استخدام أمر curl من الموقع الرسمي.",
    startTitle: "2. بدء الخادم",
    startBody: "بعد التثبيت، Ollama تعمل كخدمة في الخلفية على macOS و Windows. على Linux قد تحتاج لبدءها يدويًا. واجهة برمجة التطبيقات الافتراضية: http://localhost:11434.",
    verifyTitle: "3. التحقق",
    verifyBody: "في الطرفية: ollama --version, curl http://localhost:11434/api/tags. إذا رأيت قائمة JSON للنماذج، فكل شيء يعمل.",
    modelTitle: "4. تنزيل نموذج",
    modelBody: "موصى به: ollama pull llama3.2:latest. النماذج الأكبر (deepseek-v3.1, qwen3) تعطي نتائج أفضل لكنها تحتاج ذاكرة أكبر.",
    useTitle: "5. الاستخدام في Build-Better",
    useBody: "افتح أي أداة ذكاء اصطناعي. محدد النموذج في عمود الإدخال يسمح بالتبديل بين النماذج المثبتة.",
    troubleshootTitle: "مشاكل شائعة",
    troubleshootBody: "المنفذ مشغول: خدمة أخرى تستخدم 11434 — غيّر OLLAMA_HOST. أول استجابة بطيئة: llama3.2 تستغرق 2-5 ث. أخطاء CORS: Ollama تقبل طلبات المتصفح من localhost افتراضيًا.",
  },

    "zh-TW": {
    intro: "在本地執行 AI 模型為 Build-Better 工具服務。所有資料都在本機，無需 API 金鑰，無需雲端。",
    installTitle: "1. 安裝 Ollama",
    installBody: "下載官方安裝包，macOS/Linux 也可使用官網的一行 curl 安裝指令。",
    startTitle: "2. 啟動服務",
    startBody: "安裝後 Ollama 在 macOS 和 Windows 自動背景執行。Linux 可能需要手動啟動。預設 API 通訊埠 http://localhost:11434。",
    verifyTitle: "3. 驗證執行狀態",
    verifyBody: "在終端機執行：ollama --version，以及 curl http://localhost:11434/api/tags。看到 JSON 模型列表即成功。",
    modelTitle: "4. 下載模型",
    modelBody: "推薦執行：ollama pull llama3.2:latest。更大的模型（deepseek-v3.1、qwen3）效果更好但需要更多記憶體。",
    useTitle: "5. 在 Build-Better 中使用",
    useBody: "打開本網站的任意 AI 工具（如 AI 客服回覆），輸入區上方的模型選擇器可以切換已安裝的模型。",
    troubleshootTitle: "常見問題",
    troubleshootBody: "通訊埠佔用：另一個服務在使用 11434 — 設定環境變數 OLLAMA_HOST 切換。首次回應慢：llama3.2 首個 token 需 2-5秒。CORS 錯誤：Ollama 預設允許來自 localhost 的瀏覽器請求。",
  },
};

// Remove Arabic entries with bad keys (built from string concat errors)
delete STEPS_DATA.ar;
STEPS_DATA.ar = {
  intro: "قم بتشغيل نماذج الذكاء الاصطناعي محليًا لأدوات Build-Better. Ollama تحتفظ بكل شيء على جهازك.",
  installTitle: "1. تثبيت Ollama",
  installBody: "حمّل برنامج التثبيت الرسمي لنظامك. macOS/Linux يمكنهم أيضًا استخدام أمر curl من الموقع الرسمي.",
  startTitle: "2. بدء الخادم",
  startBody: "بعد التثبيت، Ollama تعمل كخدمة في الخلفية على macOS و Windows. على Linux قد تحتاج لبدءها يدويًا. واجهة برمجة التطبيقات الافتراضية: http://localhost:11434.",
  verifyTitle: "3. التحقق",
  verifyBody: "في الطرفية: ollama --version, curl http://localhost:11434/api/tags. إذا رأيت قائمة JSON للنماذج، فكل شيء يعمل.",
  modelTitle: "4. تنزيل نموذج",
  modelBody: "موصى به: ollama pull llama3.2:latest. النماذج الأكبر (deepseek-v3.1, qwen3) تعطي نتائج أفضل لكنها تحتاج ذاكرة أكبر.",
  useTitle: "5. الاستخدام في Build-Better",
  useBody: "افتح أي أداة ذكاء اصطناعي. محدد النموذج في عمود الإدخال يسمح بالتبديل بين النماذج المثبتة.",
  troubleshootTitle: "مشاكل شائعة",
  troubleshootBody: "المنفذ مشغول: خدمة أخرى تستخدم 11434 — غيّر OLLAMA_HOST. أول استجابة بطيئة: llama3.2 تستغرق 2-5 ث. أخطاء CORS: Ollama تقبل طلبات المتصفح من localhost افتراضيًا.",
};

const LANG_ORDER = ["en", "zh-CN", "zh-TW", "ja", "ko", "es", "pt", "fr", "de", "ru", "ar"];

export default function OllamaSetup() {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || "en").split("-")[0];
  const langKey = (LANG_ORDER.find(l => l === currentLang || l.startsWith(currentLang)) || "en") as keyof typeof STEPS_DATA;
  const steps = STEPS_DATA[langKey] || STEPS_DATA.en;

  return (
    <CalculatorShell
      title="Set up Ollama locally"
      subtitle="Run AI models on your machine — no API keys, no cloud"
      icon={Cpu}
      iconBgColor="bg-amber-100"
      iconColor="text-amber-600"
      keywords={["ollama", "local ai", "llama", "setup", "install"]}
      result={
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
            {steps.intro}
          </div>
          {([
            { title: steps.installTitle, body: steps.installBody, icon: <Download className="h-5 w-5 text-amber-600" /> },
            { title: steps.startTitle, body: steps.startBody, icon: <TerminalIcon className="h-5 w-5 text-amber-600" /> },
            { title: steps.verifyTitle, body: steps.verifyBody, icon: <Settings2 className="h-5 w-5 text-amber-600" /> },
            { title: steps.modelTitle, body: steps.modelBody, icon: <Download className="h-5 w-5 text-amber-600" /> },
            { title: steps.useTitle, body: steps.useBody, icon: <MessageSquare className="h-5 w-5 text-amber-600" /> },
            { title: steps.troubleshootTitle, body: steps.troubleshootBody, icon: <Settings2 className="h-5 w-5 text-amber-600" /> },
          ]).map((s, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">{s.icon}</div>
              <div>
                <p className="font-semibold text-sm">{s.title}</p>
                <p className="text-sm text-gray-700 mt-1">{s.body}</p>
              </div>
            </div>
          ))}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 space-y-1">
            <p className="font-semibold">Official references:</p>
            <p>• Download: <a href={OLLAMA_URLS.download} target="_blank" rel="noopener noreferrer" className="underline">ollama.com/download</a></p>
            <p>• Documentation: <a href={OLLAMA_URLS.docs} target="_blank" rel="noopener noreferrer" className="underline">ollama.com/docs</a></p>
            <p>• Model library: <a href={OLLAMA_URLS.models} target="_blank" rel="noopener noreferrer" className="underline">ollama.com/library</a></p>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="text-sm font-semibold mb-2">Available languages</p>
          <div className="flex flex-wrap gap-2">
            {LANG_ORDER.map(l => (
              <button
                key={l}
                onClick={() => i18n.changeLanguage(l)}
                className={`px-2 py-1 text-xs rounded ${
                  langKey === l || (langKey as string).startsWith(l as string)
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Switch language to read the guide in your preferred language.
            All content references the official Ollama docs.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
          <p className="font-semibold mb-1">Why Ollama?</p>
          <ul className="text-xs space-y-1 text-amber-900">
            <li>• Free and open-source</li>
            <li>• Runs entirely on your machine — data stays private</li>
            <li>• No API keys, no rate limits, no monthly fees</li>
            <li>• Works offline once models are downloaded</li>
          </ul>
        </div>
        <a href={OLLAMA_URLS.download} target="_blank" rel="noopener noreferrer"
          className="block w-full text-center px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
          <Download className="inline h-4 w-4 mr-2" />
          Download Ollama <ExternalLink className="inline h-3 w-3 ml-1" />
        </a>
      </div>
    </CalculatorShell>
  );
}
