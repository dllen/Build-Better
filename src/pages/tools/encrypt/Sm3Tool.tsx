import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function Sm3() {
  return (
    <EditorSplitLayout
      title={<h1 className="text-2xl font-semibold">Sm3</h1>}
      inputLabel="Input"
      input={<textarea className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none" placeholder="Enter input..." />}
      outputLabel="Output"
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-gray-50">Coming soon...</pre>}
    />
  );
}
