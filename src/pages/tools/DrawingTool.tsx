import { Quickdraw, type QuickdrawRef, useQuickdrawStore } from "@quickdrawjs/react";
import "@quickdrawjs/core/quickdraw.css";
import { useRef } from "react";
import { SEO } from "@/components/SEO";
import { useTranslation } from "react-i18next";

export default function DrawingTool() {
  const { t } = useTranslation();
  const ref = useRef<QuickdrawRef>(null);

  // useQuickdrawStore gives us a stable Store instance across renders
  useQuickdrawStore();

  return (
    <>
      <SEO
        title={t("drawing-tool.pageTitle")}
        description={t("drawing-tool.pageDescription")}
      />

      <div className="flex flex-col h-[calc(100vh-5rem)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white shrink-0">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {t("drawing-tool.title")}
            </h1>
            <p className="text-xs text-gray-500">
              {t("drawing-tool.subtitle")}
            </p>
          </div>
        </div>

        {/* QuickDraw whiteboard — fills remaining height */}
        <div className="flex-1 min-h-0">
          <Quickdraw
            ref={ref}
            className="w-full h-full"
            themeToggle
            gridControl
            grid="dots"
            autoFit
          />
        </div>
      </div>
    </>
  );
}
