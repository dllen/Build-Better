import React, { useEffect, useRef, useState } from "react";
import JSONEditor, { JSONEditorOptions } from "jsoneditor";
import "jsoneditor/dist/jsoneditor.css";
import { SEO } from "@/components/SEO";
import { useTranslation } from "react-i18next";

export default function JsonEditorTool() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<JSONEditor | null>(null);
  const [initialJson, setInitialJson] = useState({
    array: [1, 2, 3],
    boolean: true,
    color: "#82b92c",
    null: null,
    number: 123,
    object: {
      a: "b",
      c: "d",
    },
    string: "Hello World",
  });

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      const options: JSONEditorOptions = {
        mode: "tree",
        modes: ["code", "form", "text", "tree", "view", "preview"], // allowed modes
        onChangeText: (jsonString) => {
          // content changed
        },
      };

      editorRef.current = new JSONEditor(containerRef.current, options);
      editorRef.current.set(initialJson);
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title={t("tools.json-editor.name", "JSON Editor")}
        description={t("tools.json-editor.desc", "A web-based tool to view, edit, format, and validate JSON.")}
        keywords={["json", "editor", "viewer", "formatter", "validator"]}
      />

      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        {t("tools.json-editor.name", "JSON Editor")}
      </h1>
      
      <p className="mb-4 text-gray-600 dark:text-gray-300">
        {t("tools.json-editor.desc", "A web-based tool to view, edit, format, and validate JSON.")}
      </p>

      <div className="h-[600px] w-full border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden" ref={containerRef}></div>
      
      <div className="mt-4 text-sm text-gray-500">
        Powered by <a href="https://github.com/josdejong/jsoneditor" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">jsoneditor</a>
      </div>
    </div>
  );
}
