import React, { useState } from "react";
import {
  ExternalLink, Download, Cpu,
  MessageSquare, Apple, Monitor, Server, CheckCircle2, Copy,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { CalculatorShell } from "@/components/common/CalculatorShell";

/**
 * Multi-language Ollama setup guide with macOS/Windows/Linux tabs,
 * model recommendations, and FAQ. References official Ollama docs.
 */

const OLLAMA_URLS = {
  download: "https://ollama.com/download",
  docs: "https://ollama.com/docs",
  models: "https://ollama.com/library",
  api: "https://github.com/ollama/ollama/blob/main/docs/api.md",
};

const LANG_ORDER = ["en", "zh-CN", "zh-TW", "ja", "ko", "es", "pt", "fr", "de", "ru", "ar"];

const COPY_FEEDBACK_MS = 2000;

interface ContentPack {
  intro: string;
  selectOs: string;
  macos: { label: string; requirements: string; install: string; installSubtext: string; start: string; verify: string; notes: string; };
  windows: { label: string; requirements: string; install: string; installSubtext: string; start: string; verify: string; notes: string; };
  linux: { label: string; requirements: string; install: string; installSubtext: string; start: string; verify: string; notes: string; };
  modelSection: { title: string; intro: string; recommended: string; }
  faqTitle: string;
  faqs: { q: string; a: string; }[];
  copyHint: string;
}

const CONTENT: Record<string, ContentPack> = {
  en: {
    intro: "Run AI models locally for the Build-Better AI tools. Ollama keeps everything on your machine — no API keys, no cloud.",
    selectOs: "Select your operating system",
    macos: {
      label: "macOS",
      requirements: "macOS 11 (Big Sur) or later. Apple Silicon (M1/M2/M3) recommended; Intel works too. 8 GB RAM minimum, 16 GB+ for larger models.",
      install: "Download the .dmg from ollama.com/download, drag Ollama.app to Applications. Or use Homebrew:",
      installSubtext: "Either method installs the CLI and the menu-bar app.",
      start: "Ollama runs automatically after install — you'll see the Ollama icon in the menu bar. To control it from the terminal:",
      verify: "Open Terminal and run:",
      notes: "Apple Silicon: optimized ARM64 build runs models fastest. Default model location: ~/.ollama/models",
    },
    windows: {
      label: "Windows",
      requirements: "Windows 10 or 11 (x64). WSL2 strongly recommended for best performance. NVIDIA GPU optional but accelerates large models.",
      install: "Download OllamaSetup.exe from ollama.com/download. Run the installer — it adds ollama.exe to PATH.",
      installSubtext: "For WSL2 users, install inside WSL2 instead for GPU passthrough.",
      start: "Ollama runs as a Windows service after install. To manage it from PowerShell:",
      verify: "Open PowerShell and run:",
      notes: "GPU acceleration uses CUDA on NVIDIA. Default model location: %USERPROFILE%\\.ollama\\models",
    },
    linux: {
      label: "Linux",
      requirements: "Linux kernel 5.x+, systemd (most distros). 8 GB RAM minimum, 16 GB+ for larger models. NVIDIA/AMD GPU optional.",
      install: "Run the official install script:",
      installSubtext: "Installs to /usr/local/bin/ollama and creates an ollama user/service.",
      start: "ollama service starts automatically. To control manually:",
      verify: "Check the service:",
      notes: "GPU: NVIDIA needs CUDA 11.8+, AMD needs rocmld-classification. Headless servers: set OLLAMA_HOST=0.0.0.0:11434.",
    },
    modelSection: {
      title: "Recommended models",
      intro: "Different models have different speed/quality tradeoffs. Start with llama3.2 for general use.",
      recommended: "Best for Build-Better AI tools",
    },
    faqTitle: "Frequently asked questions",
    faqs: [
      { q: "Which model should I use?", a: "Start with llama3.2:latest (3B params). It's fast, ~2 GB RAM, good enough for all Build-Better AI tools. Upgrade to deepseek-v3.1 or qwen3-coder for more demanding work." },
      { q: "Can I run this without a GPU?", a: "Yes — Ollama runs on CPU only. Apple Silicon is fastest; on Intel/AMD expect 2-5s for first token. Smaller models (llama3.2) work fine on CPU." },
      { q: "Why is the first response slow?", a: "Cold start: the model is loaded into RAM on first use (one-time cost of 1-10s). Subsequent requests are fast. Use 'ollama run llama3.2' once to warm up." },
      { q: "How do I use a different port?", a: "Set OLLAMA_HOST before starting ollama serve, e.g. OLLAMA_HOST=127.0.0.1:11435 ollama serve. Update the Build-Better service via VITE_OLLAMA_URL env variable." },
      { q: "Are my prompts/data sent anywhere?", a: "No. Everything runs locally. Your product descriptions, customer messages, and reviews never leave your machine. The only network calls are model downloads from ollama.com." },
      { q: "How do I delete a model to free space?", a: "ollama rm llama3.2:latest. To see what's installed: ollama list. Models are stored under ~/.ollama/models (Mac/Linux) or %USERPROFILE%\\.ollama\\models (Windows)." },
    ],
    copyHint: "Click to copy",
  },
  "zh-CN": {
    intro: "在本地运行 AI 模型为 Build-Better 工具服务。所有数据都在本机，无需 API key，无需联网。",
    selectOs: "选择你的操作系统",
    macos: {
      label: "macOS",
      requirements: "macOS 11 (Big Sur) 或更新版本。推荐 Apple Silicon (M1/M2/M3)，Intel 也可用。最少 8 GB 内存，较大模型建议 16 GB+。",
      install: "从 ollama.com/download 下载 .dmg 安装包，将 Ollama.app 拖入 Applications。或使用 Homebrew：",
      installSubtext: "两种方式都会安装命令行工具和菜单栏应用。",
      start: "安装后 Ollama 自动运行，菜单栏会出现 Ollama 图标。终端控制：",
      verify: "打开终端执行：",
      notes: "Apple Silicon：ARM64 原生构建性能最佳。模型默认路径：~/.ollama/models",
    },
    windows: {
      label: "Windows",
      requirements: "Windows 10 或 11 (x64)。强烈推荐 WSL2 获得最佳性能。可选 NVIDIA GPU 加速大型模型。",
      install: "从 ollama.com/download 下载 OllamaSetup.exe，运行安装程序（会自动将 ollama.exe 加入 PATH）。",
      installSubtext: "WSL2 用户建议在 WSL2 内安装以获得 GPU 直通。",
      start: "Ollama 安装后作为 Windows 服务运行。PowerShell 管理：",
      verify: "打开 PowerShell 执行：",
      notes: "GPU 加速使用 NVIDIA CUDA。模型默认路径：%USERPROFILE%\\.ollama\\models",
    },
    linux: {
      label: "Linux",
      requirements: "Linux 内核 5.x+，systemd（大部分发行版）。8 GB 内存起，16 GB+ 用于大模型。可选 NVIDIA/AMD GPU。",
      install: "运行官方安装脚本：",
      installSubtext: "安装到 /usr/local/bin/ollama，并创建 ollama 用户和服务。",
      start: "ollama 服务自动运行。手动控制：",
      verify: "检查服务状态：",
      notes: "GPU：NVIDIA 需要 CUDA 11.8+，AMD 需要 ROCm。无头服务器：设置 OLLAMA_HOST=0.0.0.0:11434",
    },
    modelSection: {
      title: "推荐模型",
      intro: "不同模型有不同的速度/质量权衡。从 llama3.2 开始通用场景。",
      recommended: "Build-Better AI 工具推荐",
    },
    faqTitle: "常见问题",
    faqs: [
      { q: "应该用哪个模型？", a: "先用 llama3.2:latest（30亿参数）。速度快，约 2 GB 内存，对所有 Build-Better AI 工具足够。深度任务升级到 deepseek-v3.1 或 qwen3-coder。" },
      { q: "没有 GPU 能用吗？", a: "可以，Ollama 仅 CPU 即可运行。Apple Silicon 最快；Intel/AMD 首个 token 需 2-5 秒。小模型（llama3.2）在 CPU 上完全够用。" },
      { q: "首次响应为什么慢？", a: "冷启动：模型首次加载到内存（一次性成本 1-10 秒）。后续请求很快。提前用 'ollama run llama3.2' 预热。" },
      { q: "如何修改端口？", a: "启动前设置 OLLAMA_HOST，如 OLLAMA_HOST=127.0.0.1:11435 ollama serve。然后通过 VITE_OLLAMA_URL 环境变量更新 Build-Better 服务。" },
      { q: "我的数据会被上传吗？", a: "不会。一切本地运行。你的商品描述、客户消息、评论永远不会离开你的机器。唯一的网络调用是从 ollama.com 下载模型。" },
      { q: "如何删除模型？", a: "ollama rm llama3.2:latest。查看已安装：ollama list。模型存储在 ~/.ollama/models（Mac/Linux）或 %USERPROFILE%\\.ollama\\models（Windows）。" },
    ],
    copyHint: "点击复制",
  },
  ja: {
    intro: "Build-Better AI ツール用にローカルで AI モデルを実行。Ollama ならマシン内ですべて完結 — API キー不要、クラウド不要。",
    selectOs: "OS を選択",
    macos: {
      label: "macOS",
      requirements: "macOS 11 (Big Sur) 以降。Apple Silicon (M1/M2/M3) 推奨、Intel も対応。最低 8 GB RAM、大型モデルは 16 GB+。",
      install: "ollama.com/download から .dmg をダウンロードし Ollama.app を Applications に移動。あるいは Homebrew：",
      installSubtext: "どちらもインストールされ、メニューバーアプリも入ります。",
      start: "インストール後に自動起動（メニューバーにアイコン）。ターミナル制御：",
      verify: "ターミナルで実行：",
      notes: "Apple Silicon：ARM64 ネイティブビルドが最速。モデルの保存先：~/.ollama/models",
    },
    windows: {
      label: "Windows",
      requirements: "Windows 10/11 (x64)。WSL2 を強く推奨。NVIDIA GPU オプション（大型モデル高速化）。",
      install: "ollama.com/download から OllamaSetup.exe をダウンロード、実行（自動的に PATH に追加）。",
      installSubtext: "WSL2 ユーザーは WSL2 内にインストールすると GPU パススルー可能。",
      start: "Windows サービスとして自動起動。PowerShell 管理：",
      verify: "PowerShell で実行：",
      notes: "GPU 高速化は NVIDIA CUDA を使用。保存先：%USERPROFILE%\\.ollama\\models",
    },
    linux: {
      label: "Linux",
      requirements: "Linux カーネル 5.x+、systemd。最低 8 GB RAM、NVIDIA/AMD GPU オプション。",
      install: "公式インストールスクリプト：",
      installSubtext: "/usr/local/bin/ollama にインストール、ollama ユーザーとサービスを作成。",
      start: "ollama サービスは自動起動。手動制御：",
      verify: "サービス状態を確認：",
      notes: "GPU：NVIDIA は CUDA 11.8+、AMD は ROCm。ヘッドレス：OLLAMA_HOST=0.0.0.0:11434 を設定。",
    },
    modelSection: {
      title: "推奨モデル",
      intro: "モデルにより速度/品質のトレードオフが異なります。まずは llama3.2。",
      recommended: "Build-Better AI ツールに最適",
    },
    faqTitle: "よくある質問",
    faqs: [
      { q: "どのモデルを使えばいい？", a: "まずは llama3.2:latest（3B）。高速、約 2 GB RAM で全 Build-Better AI ツールに十分。重いタスクは deepseek-v3.1 や qwen3-coder。" },
      { q: "GPU なしでも動く？", a: "はい、CPU だけで動作。Apple Silicon が最速。CPU でも llama3.2 は快適。" },
      { q: "初回応答が遅いのは？", a: "コールドスタート：初回起動時にメモリへロード（1 回 1-10 秒）。'ollama run llama3.2' で事前ウォームアップ可能。" },
      { q: "ポート変更は？", a: "OLLAMA_HOST を設定して起動。例：OLLAMA_HOST=127.0.0.1:11435 ollama serve。Build-Better 側は VITE_OLLAMA_URL で。" },
      { q: "データは外部送信される？", a: "いいえ、全てローカル。モデルダウンロード時のみ ollama.com と通信。" },
      { q: "モデルの削除は？", a: "ollama rm llama3.2:latest。一覧：ollama list。保存先：~/.ollama/models（Mac/Linux）または %USERPROFILE%\\.ollama\\models（Windows）。" },
    ],
    copyHint: "クリックでコピー",
  },
  ko: {
    intro: "Build-Better AI 도구를 위해 로컬에서 AI 모델 실행. Ollama는 모든 것을 기기에 보관 — API 키 불필요, 클라우드 불필요.",
    selectOs: "운영체제 선택",
    macos: {
      label: "macOS",
      requirements: "macOS 11 (Big Sur) 이상. Apple Silicon (M1/M2/M3) 권장, Intel도 지원. 최소 8 GB RAM, 대형 모델은 16 GB+.",
      install: "ollama.com/download에서 .dmg 다운로드, Ollama.app을 Applications로 이동. 또는 Homebrew:",
      installSubtext: "두 방법 모두 CLI와 메뉴바 앱 설치.",
      start: "설치 후 자동 실행 (메뉴바 아이콘). 터미널 제어:",
      verify: "터미널에서 실행:",
      notes: "Apple Silicon: ARM64 네이티브 빌드가 가장 빠름. 모델 저장 위치: ~/.ollama/models",
    },
    windows: {
      label: "Windows",
      requirements: "Windows 10/11 (x64). WSL2 강력 권장. NVIDIA GPU 옵션 (대형 모델 가속).",
      install: "ollama.com/download에서 OllamaSetup.exe 다운로드 및 실행 (자동으로 PATH에 추가).",
      installSubtext: "WSL2 사용자는 WSL2 안에 설치하면 GPU 패스스루 가능.",
      start: "Windows 서비스로 자동 실행. PowerShell 관리:",
      verify: "PowerShell에서 실행:",
      notes: "GPU 가속은 NVIDIA CUDA 사용. 저장 위치: %USERPROFILE%\\.ollama\\models",
    },
    linux: {
      label: "Linux",
      requirements: "Linux 커널 5.x+, systemd. 최소 8 GB RAM, NVIDIA/AMD GPU 옵션.",
      install: "공식 설치 스크립트 실행:",
      installSubtext: "/usr/local/bin/ollama에 설치, ollama 사용자와 서비스 생성.",
      start: "ollama 서비스 자동 시작. 수동 제어:",
      verify: "서비스 상태 확인:",
      notes: "GPU: NVIDIA는 CUDA 11.8+, AMD는 ROCm. 헤드리스: OLLAMA_HOST=0.0.0.0:11434 설정.",
    },
    modelSection: {
      title: "추천 모델",
      intro: "모델마다 속도/품질 트레이드오프가 다름. llama3.2부터 시작.",
      recommended: "Build-Better AI 도구에 최적",
    },
    faqTitle: "자주 묻는 질문",
    faqs: [
      { q: "어떤 모델을 써야 하나요?", a: "먼저 llama3.2:latest (30억 파라미터). 빠르고 ~2 GB RAM으로 모든 Build-Better AI 도구에 충분. 무거운 작업은 deepseek-v3.1 또는 qwen3-coder." },
      { q: "GPU 없이도 되나요?", a: "네, CPU만으로 동작. Apple Silicon이 가장 빠름. Intel/AMD CPU에서도 llama3.2는 충분." },
      { q: "첫 응답이 느린 이유는?", a: "콜드 스타트: 첫 사용 시 RAM에 모델 로드 (1회 1-10초). 'ollama run llama3.2'로 사전 워밍업 가능." },
      { q: "포트 변경은?", a: "OLLAMA_HOST 환경변수 설정. 예: OLLAMA_HOST=127.0.0.1:11435 ollama serve. Build-Better는 VITE_OLLAMA_URL로." },
      { q: "데이터가 외부로 전송되나요?", a: "아니요, 모두 로컬. 모델 다운로드 시에만 ollama.com과 통신." },
      { q: "모델 삭제는?", a: "ollama rm llama3.2:latest. 목록: ollama list. 저장 위치: ~/.ollama/models (Mac/Linux) 또는 %USERPROFILE%\\.ollama\\models (Windows)." },
    ],
    copyHint: "클릭하여 복사",
  },
  es: {
    intro: "Ejecuta modelos de IA localmente para las herramientas Build-Better. Ollama lo mantiene todo en tu equipo.",
    selectOs: "Selecciona tu sistema operativo",
    macos: {
      label: "macOS",
      requirements: "macOS 11 (Big Sur) o posterior. Apple Silicon (M1/M2/M3) recomendado, Intel también funciona. Mínimo 8 GB RAM, 16 GB+ para modelos grandes.",
      install: "Descarga el .dmg desde ollama.com/download, arrastra Ollama.app a Aplicaciones. O usa Homebrew:",
      installSubtext: "Ambos métodos instalan la CLI y la app de menú.",
      start: "Ollama se ejecuta automáticamente tras la instalación — verás el icono en la barra de menú. Para controlarlo desde terminal:",
      verify: "Abre Terminal y ejecuta:",
      notes: "Apple Silicon: build ARM64 nativo es más rápido. Ubicación: ~/.ollama/models",
    },
    windows: {
      label: "Windows",
      requirements: "Windows 10 u 11 (x64). WSL2 fuertemente recomendado. NVIDIA GPU opcional pero acelera modelos grandes.",
      install: "Descarga OllamaSetup.exe desde ollama.com/download. Ejecuta el instalador — añade ollama.exe al PATH.",
      installSubtext: "Para usuarios WSL2, instala dentro de WSL2 para tener acceso GPU.",
      start: "Ollama se ejecuta como servicio de Windows tras la instalación. Para gestionarlo desde PowerShell:",
      verify: "Abre PowerShell y ejecuta:",
      notes: "Aceleración GPU usa CUDA de NVIDIA. Ubicación: %USERPROFILE%\\.ollama\\models",
    },
    linux: {
      label: "Linux",
      requirements: "Linux kernel 5.x+, systemd. Mínimo 8 GB RAM, NVIDIA/AMD GPU opcional.",
      install: "Ejecuta el script de instalación oficial:",
      installSubtext: "Instala en /usr/local/bin/ollama y crea usuario/servicio ollama.",
      start: "El servicio ollama arranca automáticamente. Para control manual:",
      verify: "Comprueba el servicio:",
      notes: "GPU: NVIDIA necesita CUDA 11.8+, AMD necesita ROCm. Servidores sin cabeza: OLLAMA_HOST=0.0.0.0:11434.",
    },
    modelSection: {
      title: "Modelos recomendados",
      intro: "Los modelos tienen diferentes compromisos velocidad/calidad. Empieza con llama3.2.",
      recommended: "Mejor para herramientas IA Build-Better",
    },
    faqTitle: "Preguntas frecuentes",
    faqs: [
      { q: "¿Qué modelo debería usar?", a: "Empieza con llama3.2:latest (3B parámetros). Rápido, ~2 GB RAM, suficiente para todas las herramientas. Para tareas pesadas: deepseek-v3.1 o qwen3-coder." },
      { q: "¿Puedo usarlo sin GPU?", a: "Sí, Ollama funciona solo con CPU. Apple Silicon es el más rápido. En Intel/AMD espera 2-5s para el primer token." },
      { q: "¿Por qué la primera respuesta es lenta?", a: "Arranque en frío: el modelo se carga en RAM en el primer uso (coste único de 1-10s). Usa 'ollama run llama3.2' para precalentar." },
      { q: "¿Cómo cambio el puerto?", a: "Establece OLLAMA_HOST antes de iniciar ollama serve. Actualiza Build-Better con VITE_OLLAMA_URL." },
      { q: "¿Se envían mis datos?", a: "No. Todo se ejecuta localmente. La única comunicación con la red es la descarga de modelos desde ollama.com." },
      { q: "¿Cómo libero espacio borrando un modelo?", a: "ollama rm llama3.2:latest. Para ver instalados: ollama list. Ubicación: ~/.ollama/models (Mac/Linux) o %USERPROFILE%\\.ollama\\models (Windows)." },
    ],
    copyHint: "Clic para copiar",
  },
  pt: {
    intro: "Execute modelos de IA localmente para as ferramentas Build-Better. Ollama mantém tudo na sua máquina.",
    selectOs: "Selecione seu sistema operacional",
    macos: {
      label: "macOS",
      requirements: "macOS 11 (Big Sur) ou posterior. Apple Silicon (M1/M2/M3) recomendado, Intel também. Mínimo 8 GB RAM, 16 GB+ para modelos grandes.",
      install: "Baixe o .dmg em ollama.com/download, arraste Ollama.app para Aplicativos. Ou use Homebrew:",
      installSubtext: "Ambos métodos instalam a CLI e o app de menu.",
      start: "Ollama roda automaticamente após instalar — você verá o ícone na barra de menu. Para controlar do terminal:",
      verify: "Abra o Terminal e execute:",
      notes: "Apple Silicon: build ARM64 nativo é mais rápido. Localização: ~/.ollama/models",
    },
    windows: {
      label: "Windows",
      requirements: "Windows 10 ou 11 (x64). WSL2 fortemente recomendado. NVIDIA GPU opcional mas acelera modelos grandes.",
      install: "Baixe OllamaSetup.exe em ollama.com/download. Execute o instalador — adiciona ollama.exe ao PATH.",
      installSubtext: "Para usuários WSL2, instale dentro do WSL2 para acesso GPU.",
      start: "Ollama roda como serviço Windows após a instalação. Para gerenciar do PowerShell:",
      verify: "Abra o PowerShell e execute:",
      notes: "Aceleração GPU usa CUDA da NVIDIA. Localização: %USERPROFILE%\\.ollama\\models",
    },
    linux: {
      label: "Linux",
      requirements: "Linux kernel 5.x+, systemd. Mínimo 8 GB RAM, NVIDIA/AMD GPU opcional.",
      install: "Execute o script oficial de instalação:",
      installSubtext: "Instala em /usr/local/bin/ollama e cria usuário/serviço ollama.",
      start: "O serviço ollama inicia automaticamente. Para controle manual:",
      verify: "Verifique o serviço:",
      notes: "GPU: NVIDIA precisa CUDA 11.8+, AMD precisa ROCm. Servidores headless: OLLAMA_HOST=0.0.0.0:11434.",
    },
    modelSection: {
      title: "Modelos recomendados",
      intro: "Diferentes modelos têm diferentes trade-offs velocidade/qualidade. Comece com llama3.2.",
      recommended: "Melhor para ferramentas IA Build-Better",
    },
    faqTitle: "Perguntas frequentes",
    faqs: [
      { q: "Qual modelo devo usar?", a: "Comece com llama3.2:latest (3B parâmetros). Rápido, ~2 GB RAM, suficiente para todas as ferramentas. Para tarefas pesadas: deepseek-v3.1 ou qwen3-coder." },
      { q: "Posso rodar sem GPU?", a: "Sim, Ollama roda só com CPU. Apple Silicon é o mais rápido. Em Intel/AMD espere 2-5s para o primeiro token." },
      { q: "Por que a primeira resposta é lenta?", a: "Cold start: o modelo é carregado na RAM no primeiro uso (custo único de 1-10s). Use 'ollama run llama3.2' para pré-aquecer." },
      { q: "Como uso uma porta diferente?", a: "Defina OLLAMA_HOST antes de iniciar ollama serve. Atualize o Build-Better com VITE_OLLAMA_URL." },
      { q: "Meus dados são enviados para algum lugar?", a: "Não. Tudo roda local. A única comunicação com a rede é baixar modelos de ollama.com." },
      { q: "Como libero espaço excluindo um modelo?", a: "ollama rm llama3.2:latest. Para listar: ollama list. Localização: ~/.ollama/models (Mac/Linux) ou %USERPROFILE%\\.ollama\\models (Windows)." },
    ],
    copyHint: "Clique para copiar",
  },
  fr: {
    intro: "Exécutez des modèles IA localement pour les outils Build-Better. Ollama garde tout sur votre machine.",
    selectOs: "Sélectionnez votre système",
    macos: {
      label: "macOS",
      requirements: "macOS 11 (Big Sur) ou plus récent. Apple Silicon (M1/M2/M3) recommandé, Intel fonctionne aussi. 8 Go RAM min, 16 Go+ pour gros modèles.",
      install: "Téléchargez le .dmg depuis ollama.com/download, glissez Ollama.app dans Applications. Ou via Homebrew :",
      installSubtext: "Les deux méthodes installent la CLI et l'app de barre de menu.",
      start: "Ollama démarre automatiquement après l'installation — icône dans la barre de menu. Contrôle depuis le terminal :",
      verify: "Ouvrez Terminal et exécutez :",
      notes: "Apple Silicon : build ARM64 natif le plus rapide. Emplacement : ~/.ollama/models",
    },
    windows: {
      label: "Windows",
      requirements: "Windows 10 ou 11 (x64). WSL2 fortement recommandé. GPU NVIDIA optionnel mais accélère les gros modèles.",
      install: "Téléchargez OllamaSetup.exe depuis ollama.com/download. Lancez l'installateur — ajoute ollama.exe au PATH.",
      installSubtext: "Pour WSL2, installez dans WSL2 pour le passthrough GPU.",
      start: "Ollama tourne comme service Windows après installation. Gestion via PowerShell :",
      verify: "Ouvrez PowerShell et exécutez :",
      notes: "L'accélération GPU utilise CUDA de NVIDIA. Emplacement : %USERPROFILE%\\.ollama\\models",
    },
    linux: {
      label: "Linux",
      requirements: "Noyau Linux 5.x+, systemd (la plupart des distros). 8 Go RAM min, GPU NVIDIA/AMD optionnel.",
      install: "Exécutez le script d'installation officiel :",
      installSubtext: "Installe dans /usr/local/bin/ollama et crée un utilisateur/service ollama.",
      start: "Le service ollama démarre automatiquement. Contrôle manuel :",
      verify: "Vérifiez le service :",
      notes: "GPU : NVIDIA a besoin de CUDA 11.8+, AMD de ROCm. Sans tête : OLLAMA_HOST=0.0.0.0:11434.",
    },
    modelSection: {
      title: "Modèles recommandés",
      intro: "Différents modèles ont différents compromis vitesse/qualité. Commencez par llama3.2.",
      recommended: "Idéal pour les outils IA Build-Better",
    },
    faqTitle: "Questions fréquentes",
    faqs: [
      { q: "Quel modèle choisir ?", a: "Commencez par llama3.2:latest (3B paramètres). Rapide, ~2 Go RAM, suffisant pour tous les outils. Tâches lourdes : deepseek-v3.1 ou qwen3-coder." },
      { q: "Puis-je l'utiliser sans GPU ?", a: "Oui, Ollama fonctionne en CPU seul. Apple Silicon est le plus rapide. Intel/AMD : 2-5s pour le premier token." },
      { q: "Pourquoi la première réponse est lente ?", a: "Démarrage à froid : le modèle est chargé en RAM au premier usage (coût unique de 1-10s). Pré-chauffez avec 'ollama run llama3.2'." },
      { q: "Comment changer de port ?", a: "Définissez OLLAMA_HOST avant de lancer ollama serve. Mettez à jour Build-Better via VITE_OLLAMA_URL." },
      { q: "Mes données sont-elles envoyées ?", a: "Non. Tout est local. La seule communication réseau est le téléchargement de modèles depuis ollama.com." },
      { q: "Comment libérer de l'espace en supprimant un modèle ?", a: "ollama rm llama3.2:latest. Pour lister : ollama list. Emplacement : ~/.ollama/models (Mac/Linux) ou %USERPROFILE%\\.ollama\\models (Windows)." },
    ],
    copyHint: "Cliquer pour copier",
  },
  de: {
    intro: "KI-Modelle lokal für die Build-Better-Tools ausführen. Ollama hält alles auf Ihrem Rechner.",
    selectOs: "Betriebssystem wählen",
    macos: {
      label: "macOS",
      requirements: "macOS 11 (Big Sur) oder neuer. Apple Silicon (M1/M2/M3) empfohlen, Intel geht auch. Mindestens 8 GB RAM, 16 GB+ für große Modelle.",
      install: "Laden Sie die .dmg von ollama.com/download, ziehen Sie Ollama.app in Programme. Oder mit Homebrew:",
      installSubtext: "Beide Methoden installieren CLI und Menüleisten-App.",
      start: "Ollama startet nach Installation — Symbol in der Menüleiste. Steuerung im Terminal:",
      verify: "Terminal öffnen und ausführen:",
      notes: "Apple Silicon: ARM64-Build ist am schnellsten. Speicherort: ~/.ollama/models",
    },
    windows: {
      label: "Windows",
      requirements: "Windows 10 oder 11 (x64). WSL2 dringend empfohlen. NVIDIA-GPU optional, beschleunigt aber große Modelle.",
      install: "Laden Sie OllamaSetup.exe von ollama.com/download. Installieren — ollama.exe wird zum PATH hinzugefügt.",
      installSubtext: "Für WSL2: darin installieren für GPU-Passthrough.",
      start: "Ollama läuft als Windows-Dienst nach Installation. PowerShell-Verwaltung:",
      verify: "PowerShell öffnen und ausführen:",
      notes: "GPU-Beschleunigung nutzt NVIDIA CUDA. Speicherort: %USERPROFILE%\\.ollama\\models",
    },
    linux: {
      label: "Linux",
      requirements: "Linux-Kernel 5.x+, systemd. Mindestens 8 GB RAM, NVIDIA/AMD-GPU optional.",
      install: "Führen Sie das offizielle Installationsskript aus:",
      installSubtext: "Installiert nach /usr/local/bin/ollama und erstellt ollama-Benutzer/-Dienst.",
      start: "ollama-Dienst startet automatisch. Manuelle Steuerung:",
      verify: "Dienst prüfen:",
      notes: "GPU: NVIDIA benötigt CUDA 11.8+, AMD ROCm. Headless: OLLAMA_HOST=0.0.0.0:11434 setzen.",
    },
    modelSection: {
      title: "Empfohlene Modelle",
      intro: "Modelle haben verschiedene Geschwindigkeit/Qualität-Abwägungen. Starten Sie mit llama3.2.",
      recommended: "Ideal für Build-Better KI-Tools",
    },
    faqTitle: "Häufige Fragen",
    faqs: [
      { q: "Welches Modell soll ich nutzen?", a: "Starten Sie mit llama3.2:latest (3B Parameter). Schnell, ~2 GB RAM, ausreichend für alle Tools. Schwere Aufgaben: deepseek-v3.1 oder qwen3-coder." },
      { q: "Funktioniert es ohne GPU?", a: "Ja, Ollama läuft nur mit CPU. Apple Silicon ist am schnellsten. Intel/AMD: 2-5s für erstes Token." },
      { q: "Warum ist die erste Antwort langsam?", a: "Kaltstart: Modell wird beim ersten Aufruf in RAM geladen (einmalige Kosten 1-10s). Mit 'ollama run llama3.2' vorwärmen." },
      { q: "Wie ändere ich den Port?", a: "OLLAMA_HOST vor ollama serve setzen. Build-Better über VITE_OLLAMA_URL aktualisieren." },
      { q: "Werden meine Daten gesendet?", a: "Nein. Alles lokal. Einzige Netzwerkkommunikation: Modell-Download von ollama.com." },
      { q: "Wie lösche ich ein Modell zum Platzsparen?", a: "ollama rm llama3.2:latest. Liste: ollama list. Speicherort: ~/.ollama/models (Mac/Linux) oder %USERPROFILE%\\.ollama\\models (Windows)." },
    ],
    copyHint: "Zum kopieren",
  },
  ru: {
    intro: "Запускайте ИИ-модели локально для инструментов Build-Better. Ollama хранит всё на вашем компьютере.",
    selectOs: "Выберите ОС",
    macos: {
      label: "macOS",
      requirements: "macOS 11 (Big Sur) или новее. Рекомендуется Apple Silicon (M1/M2/M3), Intel тоже работает. Мин. 8 ГБ RAM, 16 ГБ+ для больших моделей.",
      install: "Скачайте .dmg с ollama.com/download, перетащите Ollama.app в Программы. Или через Homebrew:",
      installSubtext: "Оба способа установят CLI и приложение в строке меню.",
      start: "Ollama запускается автоматически — значок в строке меню. Управление из терминала:",
      verify: "Откройте Терминал и выполните:",
      notes: "Apple Silicon: ARM64-сборка самая быстрая. Путь: ~/.ollama/models",
    },
    windows: {
      label: "Windows",
      requirements: "Windows 10/11 (x64). Настоятельно рекомендуется WSL2. GPU NVIDIA опционально, ускоряет большие модели.",
      install: "Скачайте OllamaSetup.exe с ollama.com/download. Запустите установщик — ollama.exe добавится в PATH.",
      installSubtext: "Для WSL2: установите внутри WSL2 для проброса GPU.",
      start: "Ollama работает как служба Windows. Управление через PowerShell:",
      verify: "Откройте PowerShell и выполните:",
      notes: "GPU-ускорение через NVIDIA CUDA. Путь: %USERPROFILE%\\.ollama\\models",
    },
    linux: {
      label: "Linux",
      requirements: "Ядро Linux 5.x+, systemd. Мин. 8 ГБ RAM, NVIDIA/AMD GPU опционально.",
      install: "Запустите официальный скрипт установки:",
      installSubtext: "Устанавливается в /usr/local/bin/ollama, создаётся пользователь/сервис ollama.",
      start: "Сервис ollama запускается автоматически. Ручное управление:",
      verify: "Проверьте сервис:",
      notes: "GPU: NVIDIA требует CUDA 11.8+, AMD — ROCm. Headless-серверы: OLLAMA_HOST=0.0.0.0:11434",
    },
    modelSection: {
      title: "Рекомендуемые модели",
      intro: "У моделей разные компромиссы скорости/качества. Начните с llama3.2.",
      recommended: "Лучшие для ИИ-инструментов Build-Better",
    },
    faqTitle: "Частые вопросы",
    faqs: [
      { q: "Какую модель выбрать?", a: "Начните с llama3.2:latest (3B параметров). Быстрая, ~2 ГБ RAM, подходит для всех инструментов. Для сложных задач: deepseek-v3.1 или qwen3-coder." },
      { q: "Можно без GPU?", a: "Да, Ollama работает только на CPU. Apple Silicon — самый быстрый. Intel/AMD: 2-5с на первый токен." },
      { q: "Почему первый ответ медленный?", a: "Холодный старт: модель загружается в RAM при первом использовании (разовые 1-10с). Прогрейте через 'ollama run llama3.2'." },
      { q: "Как изменить порт?", a: "Задайте OLLAMA_HOST перед запуском ollama serve. Build-Better обновите через VITE_OLLAMA_URL." },
      { q: "Данные куда-то отправляются?", a: "Нет, всё локально. Единственное сетевое обращение — загрузка моделей с ollama.com." },
      { q: "Как удалить модель?", a: "ollama rm llama3.2:latest. Список: ollama list. Путь: ~/.ollama/models (Mac/Linux) или %USERPROFILE%\\.ollama\\models (Windows)." },
    ],
    copyHint: "Нажмите для копирования",
  },
  ar: {
    intro: "قم بتشغيل نماذج الذكاء الاصطناعي محليًا لأدوات Build-Better. Ollama تحتفظ بكل شيء على جهازك.",
    selectOs: "اختر نظام التشغيل",
    macos: {
      label: "macOS",
      requirements: "macOS 11 (Big Sur) أو أحدث. يُنصح بـ Apple Silicon (M1/M2/M3)، Intel يعمل أيضًا. 8 GB RAM كحد أدنى، 16 GB+ للنماذج الكبيرة.",
      install: "حمّل .dmg من ollama.com/download، اسحب Ollama.app إلى Applications. أو استخدم Homebrew:",
      installSubtext: "كلتا الطريقتين تثبتان CLI وتطبيق شريط القوائم.",
      start: "Ollama تعمل بعد التثبيت تلقائيًا — أيقونة في شريط القوائم. للتحكم من الطرفية:",
      verify: "افتح Terminal ونفذ:",
      notes: "Apple Silicon: بناء ARM64 الأصلي الأسرع. الموقع: ~/.ollama/models",
    },
    windows: {
      label: "Windows",
      requirements: "Windows 10 أو 11 (x64). يُنصح بشدة بـ WSL2. NVIDIA GPU اختياري لكنه يسرع النماذج الكبيرة.",
      install: "حمّل OllamaSetup.exe من ollama.com/download. شغّل المثبت — يضيف ollama.exe إلى PATH.",
      installSubtext: "لمستخدمي WSL2، ثبّت داخل WSL2 لمرور GPU.",
      start: "Ollama تعمل كخدمة Windows بعد التثبيت. للإدارة من PowerShell:",
      verify: "افتح PowerShell ونفذ:",
      notes: "تسريع GPU يستخدم NVIDIA CUDA. الموقع: %USERPROFILE%\\.ollama\\models",
    },
    linux: {
      label: "Linux",
      requirements: "Linux kernel 5.x+، systemd، 8 GB RAM كحد أدنى، NVIDIA/AMD GPU اختياري.",
      install: "شغّل سكربت التثبيت الرسمي:",
      installSubtext: "يثبت في /usr/local/bin/ollama وينشئ مستخدم/خدمة ollama.",
      start: "خدمة ollama تبدأ تلقائيًا. للتحكم اليدوي:",
      verify: "تحقق من الخدمة:",
      notes: "GPU: NVIDIA يحتاج CUDA 11.8+، AMD يحتاج ROCm. الخوادم بدون شاشة: OLLAMA_HOST=0.0.0.0:11434",
    },
    modelSection: {
      title: "النماذج الموصى بها",
      intro: "النماذج لها مقايضات مختلفة بين السرعة والجودة. ابدأ بـ llama3.2.",
      recommended: "الأفضل لأدوات الذكاء الاصطناعي في Build-Better",
    },
    faqTitle: "أسئلة شائعة",
    faqs: [
      { q: "أي نموذج يجب أن أستخدم؟", a: "ابدأ بـ llama3.2:latest (3B معاملات). ~2 GB RAM، كافٍ لجميع الأدوات. للمهام الثقيلة: deepseek-v3.1 أو qwen3-coder." },
      { q: "هل يمكن بدون GPU؟", a: "نعم، Ollama تعمل على CPU فقط. Apple Silicon الأسرع. Intel/AMD: 2-5 ث للرمز الأول." },
      { q: "لماذا الاستجابة الأولى بطيئة؟", a: "بدء بارد: يُحمّل النموذج في RAM عند الاستخدام الأول (تكلفة لمرة واحدة 1-10 ث)." },
      { q: "كيف أغير المنفذ؟", a: "حدد OLLAMA_HOST قبل تشغيل ollama serve. حدّث Build-Better عبر VITE_OLLAMA_URL." },
      { q: "هل بياناتي تُرسل؟", a: "لا، كل شيء محلي. الاتصال الوحيد بالشبكة هو تنزيل النماذج من ollama.com." },
      { q: "كيف أحذف نموذجًا لتوفير المساحة؟", a: "ollama rm llama3.2:latest. للعرض: ollama list. الموقع: ~/.ollama/models (Mac/Linux) أو %USERPROFILE%\\.ollama\\models (Windows)." },
    ],
    copyHint: "انقر للنسخ",
  },
  "zh-TW": {
    intro: "在本地執行 AI 模型為 Build-Better 工具服務。所有資料都在本機，無需 API 金鑰，無需雲端。",
    selectOs: "選擇你的作業系統",
    macos: {
      label: "macOS",
      requirements: "macOS 11 (Big Sur) 或更新版本。建議 Apple Silicon (M1/M2/M3)，Intel 也可用。最少 8 GB 記憶體，大模型建議 16 GB+。",
      install: "從 ollama.com/download 下載 .dmg 套件，將 Ollama.app 拖入 Applications。或使用 Homebrew：",
      installSubtext: "兩種方式都會安裝命令列工具和選單列應用程式。",
      start: "安裝後 Ollama 自動執行，選單列會出現 Ollama 圖示。終端機控制：",
      verify: "開啟終端機執行：",
      notes: "Apple Silicon：ARM64 原生建置效能最佳。模型預設路徑：~/.ollama/models",
    },
    windows: {
      label: "Windows",
      requirements: "Windows 10 或 11 (x64)。強烈建議 WSL2 獲得最佳效能。可選 NVIDIA GPU 加速大型模型。",
      install: "從 ollama.com/download 下載 OllamaSetup.exe，執行安裝程式（會自動將 ollama.exe 加入 PATH）。",
      installSubtext: "WSL2 使用者建議在 WSL2 內安裝以獲得 GPU 直通。",
      start: "Ollama 安裝後作為 Windows 服務執行。PowerShell 管理：",
      verify: "開啟 PowerShell 執行：",
      notes: "GPU 加速使用 NVIDIA CUDA。模型預設路徑：%USERPROFILE%\\.ollama\\models",
    },
    linux: {
      label: "Linux",
      requirements: "Linux 核心 5.x+，systemd（大部分發行版）。8 GB 記憶體起，16 GB+ 用於大模型。可選 NVIDIA/AMD GPU。",
      install: "執行官方安裝腳本：",
      installSubtext: "安裝到 /usr/local/bin/ollama，並建立 ollama 使用者和服務。",
      start: "ollama 服務自動執行。手動控制：",
      verify: "檢查服務狀態：",
      notes: "GPU：NVIDIA 需要 CUDA 11.8+，AMD 需要 ROCm。無頭伺服器：設定 OLLAMA_HOST=0.0.0.0:11434",
    },
    modelSection: {
      title: "推薦模型",
      intro: "不同模型有不同的速度/品質權衡。從 llama3.2 開始通用情境。",
      recommended: "Build-Better AI 工具推薦",
    },
    faqTitle: "常見問題",
    faqs: [
      { q: "應該用哪個模型？", a: "先用 llama3.2:latest（30 億參數）。速度快，約 2 GB 記憶體，對所有 Build-Better AI 工具足夠。深度任務升級到 deepseek-v3.1 或 qwen3-coder。" },
      { q: "沒有 GPU 能用嗎？", a: "可以，Ollama 僅 CPU 即可執行。Apple Silicon 最快；Intel/AMD 首個 token 需 2-5 秒。小模型（llama3.2）在 CPU 上完全夠用。" },
      { q: "首次回應為什麼慢？", a: "冷啟動：模型首次載入到記憶體（一次性成本 1-10 秒）。提前用 'ollama run llama3.2' 預熱。" },
      { q: "如何修改通訊埠？", a: "啟動前設定 OLLAMA_HOST，如 OLLAMA_HOST=127.0.0.1:11435 ollama serve。然後透過 VITE_OLLAMA_URL 環境變數更新 Build-Better 服務。" },
      { q: "我的資料會被上傳嗎？", a: "不會。一切本地執行。唯一的網路呼叫是從 ollama.com 下載模型。" },
      { q: "如何刪除模型？", a: "ollama rm llama3.2:latest。檢視已安裝：ollama list。模型儲存在 ~/.ollama/models（Mac/Linux）或 %USERPROFILE%\\.ollama\\models（Windows）。" },
    ],
    copyHint: "點擊複製",
  },
};

interface CommandBlockProps {
  cmd: string;
  hint?: string;
}

function CommandBlock({ cmd, hint }: CommandBlockProps) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  };
  return (
    <div className="relative group">
      <pre className="bg-gray-900 text-green-400 text-xs font-mono p-3 rounded-md overflow-x-auto">
        {cmd}
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Copy command"
      >
        <Copy className="h-3 w-3" />
        {copied ? <CheckCircle2 className="h-3 w-3 text-green-400" /> : <span>Copy</span>}
      </button>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

function OSTab({ icon, label, selected, onClick }: { icon: React.ReactNode; label: string; selected: boolean; onClick: () => void; }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
        selected
          ? "bg-amber-600 text-white shadow-sm"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

interface OSSectionProps {
  data: { label: string; requirements: string; install: string; installSubtext: string; start: string; verify: string; notes: string; };
}

function OSSection({ data }: OSSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1">System Requirements</p>
        <p className="text-sm text-gray-700">{data.requirements}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1">Install</p>
        <p className="text-sm text-gray-700 mb-2">{data.install}</p>
        <CommandBlock cmd="$ ollama --version" hint="(Verify install — should print version number)" />
        <p className="text-xs text-gray-500 mt-1">{data.installSubtext}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1">Start / Manage</p>
        <CommandBlock cmd="$ ollama serve" hint={data.start} />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1">Verify</p>
        <CommandBlock cmd="$ curl http://localhost:11434/api/tags" hint="Should return JSON with installed models list" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1">Notes</p>
        <p className="text-sm text-gray-700">{data.notes}</p>
      </div>
    </div>
  );
}

const MODEL_RECOMMENDATIONS = [
  { name: "llama3.2:latest", size: "~2 GB", speed: "Fast", quality: "Good", best: "All 5 Build-Better AI tools", lang: "multilingual" },
  { name: "deepseek-v3.1:671b-cloud", size: "Remote", speed: "Slow", quality: "Excellent", best: "Hard reasoning tasks", lang: "multilingual" },
  { name: "qwen3-coder:480b-cloud", size: "Remote", speed: "Slow", quality: "Excellent", best: "Technical / code tasks", lang: "multilingual" },
  { name: "smollm2:1.7b", size: "~1 GB", speed: "Very Fast", quality: "Fair", best: "Low-resource environments", lang: "English" },
  { name: "minimax-m3:cloud", size: "Remote", speed: "Medium", quality: "Good", best: "Vision + text mixed tasks", lang: "multilingual" },
];

export default function OllamaSetup() {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || "en").split("-")[0];
  const langKey = (LANG_ORDER.find(l => l === currentLang || l.startsWith(currentLang)) || "en") as keyof typeof CONTENT;
  const c = CONTENT[langKey] || CONTENT.en;

  const [os, setOs] = useState<"macos" | "windows" | "linux">(
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.userAgent) ? "macos"
    : typeof navigator !== "undefined" && /Windows/i.test(navigator.userAgent) ? "windows"
    : "linux"
  );

  return (
    <CalculatorShell
      title="Set up Ollama locally"
      subtitle="Run AI models on your machine — no API keys, no cloud"
      icon={Cpu}
      iconBgColor="bg-amber-100"
      iconColor="text-amber-600"
      keywords={["ollama", "local ai", "llama", "setup", "install"]}
      result={
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
            {c.intro}
          </div>

          {/* OS-specific installation */}
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2">{c.selectOs}</p>
            <div className="flex gap-2 mb-4 flex-wrap">
              <OSTab icon={<Apple className="h-4 w-4" />} label={c.macos.label} selected={os === "macos"} onClick={() => setOs("macos")} />
              <OSTab icon={<Monitor className="h-4 w-4" />} label={c.windows.label} selected={os === "windows"} onClick={() => setOs("windows")} />
              <OSTab icon={<Server className="h-4 w-4" />} label={c.linux.label} selected={os === "linux"} onClick={() => setOs("linux")} />
            </div>
            <OSSection data={c[os]} />
          </div>

          {/* Model recommendations */}
          <div>
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-amber-600" />
              {c.modelSection.title}
            </h3>
            <p className="text-xs text-gray-600 mb-2">{c.modelSection.intro}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left">Model</th>
                    <th className="px-2 py-1 text-left">Size</th>
                    <th className="px-2 py-1 text-left">Speed</th>
                    <th className="px-2 py-1 text-left">Quality</th>
                    <th className="px-2 py-1 text-left">Best for</th>
                  </tr>
                </thead>
                <tbody>
                  {MODEL_RECOMMENDATIONS.map((m, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-2 py-1.5 font-mono">{m.name}</td>
                      <td className="px-2 py-1.5">{m.size}</td>
                      <td className="px-2 py-1.5">{m.speed}</td>
                      <td className="px-2 py-1.5">{m.quality}</td>
                      <td className="px-2 py-1.5">{m.best}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">{c.modelSection.recommended}:</p>
            <CommandBlock cmd="$ ollama pull llama3.2:latest" hint="Download your first model" />
          </div>

          {/* FAQ */}
          <div>
            <h3 className="text-sm font-bold mb-2">{c.faqTitle}</h3>
            <div className="space-y-2">
              {c.faqs.map((f, i) => (
                <details key={i} className="bg-gray-50 border border-gray-200 rounded-md p-2 group">
                  <summary className="cursor-pointer font-medium text-xs flex items-center justify-between">
                    <span>{f.q}</span>
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-xs text-gray-700 mt-2 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>

          {/* Official references */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 space-y-1">
            <p className="font-semibold mb-1">Official references (canonical source):</p>
            <p>• Download: <a href={OLLAMA_URLS.download} target="_blank" rel="noopener noreferrer" className="underline">{OLLAMA_URLS.download}</a></p>
            <p>• Documentation: <a href={OLLAMA_URLS.docs} target="_blank" rel="noopener noreferrer" className="underline">{OLLAMA_URLS.docs}</a></p>
            <p>• Model library: <a href={OLLAMA_URLS.models} target="_blank" rel="noopener noreferrer" className="underline">{OLLAMA_URLS.models}</a></p>
            <p>• API reference: <a href={OLLAMA_URLS.api} target="_blank" rel="noopener noreferrer" className="underline">{OLLAMA_URLS.api}</a></p>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="text-sm font-semibold mb-2">Read this guide in:</p>
          <div className="flex flex-wrap gap-1.5">
            {LANG_ORDER.map(l => (
              <button
                key={l}
                onClick={() => i18n.changeLanguage(l)}
                className={`px-2 py-1 text-xs rounded transition ${
                  langKey === l || (langKey as string).startsWith(l as string)
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs space-y-1 text-amber-900">
          <p className="font-semibold">Why Ollama?</p>
          <p>• Free and open-source</p>
          <p>• Runs entirely on your machine — data stays private</p>
          <p>• No API keys, no rate limits, no monthly fees</p>
          <p>• Works offline once models are downloaded</p>
        </div>
        <a href={OLLAMA_URLS.download} target="_blank" rel="noopener noreferrer"
          className="block w-full text-center px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium">
          <Download className="inline h-4 w-4 mr-2" />
          Download Ollama <ExternalLink className="inline h-3 w-3 ml-1" />
        </a>
        <Link to="/ai-customer-reply" className="block w-full text-center px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 text-sm">
          Try an AI tool <MessageSquare className="inline h-3 w-3 ml-1" />
        </Link>
      </div>
    </CalculatorShell>
  );
}

