import { FileCode, Braces } from "lucide-react";
import { pythonDepths, rubyDepths, vbscriptDepths, braceDepths } from "@/lib/format/shared";
import type { FormatToolConfig } from "./FormatToolPage";

export const pythonConfig: FormatToolConfig = {
  title: "Python Formatter",
  description: "Indent Python code with colon-based detection",
  icon: FileCode,
  iconColorClass: "bg-blue-100 text-blue-600",
  buttonColorClass: "bg-blue-600 hover:bg-blue-700",
  placeholder: "Paste Python code...",
  defaultIndentSize: 4,
  depthComputer: pythonDepths,
};

export const javaConfig: FormatToolConfig = {
  title: "Java Formatter",
  description: "Indent Java code with brace-based detection",
  icon: Braces,
  iconColorClass: "bg-orange-100 text-orange-600",
  buttonColorClass: "bg-orange-600 hover:bg-orange-700",
  placeholder: "Paste Java code...",
  defaultIndentSize: 4,
  depthComputer: braceDepths(),
};

export const phpConfig: FormatToolConfig = {
  title: "PHP Formatter",
  description: "Indent PHP code with brace-based detection",
  icon: FileCode,
  iconColorClass: "bg-indigo-100 text-indigo-600",
  buttonColorClass: "bg-indigo-600 hover:bg-indigo-700",
  placeholder: "Paste PHP code...",
  defaultIndentSize: 4,
  depthComputer: braceDepths(),
};

export const rubyConfig: FormatToolConfig = {
  title: "Ruby Formatter",
  description: "Indent Ruby code with keyword-based detection",
  icon: FileCode,
  iconColorClass: "bg-red-100 text-red-600",
  buttonColorClass: "bg-red-600 hover:bg-red-700",
  placeholder: "Paste Ruby code...",
  defaultIndentSize: 2,
  depthComputer: rubyDepths,
};

export const csharpConfig: FormatToolConfig = {
  title: "C# Formatter",
  description: "Indent C# code with brace-based detection",
  icon: Braces,
  iconColorClass: "bg-purple-100 text-purple-600",
  buttonColorClass: "bg-purple-600 hover:bg-purple-700",
  placeholder: "Paste C# code...",
  defaultIndentSize: 4,
  depthComputer: braceDepths(),
};

export const cConfig: FormatToolConfig = {
  title: "C Formatter",
  description: "Indent C code with brace detection + preprocessor support",
  icon: Braces,
  iconColorClass: "bg-gray-100 text-gray-600",
  buttonColorClass: "bg-gray-600 hover:bg-gray-700",
  placeholder: "Paste C code...",
  defaultIndentSize: 4,
  depthComputer: braceDepths({ preservePreprocessor: true }),
};

export const vbscriptConfig: FormatToolConfig = {
  title: "VBScript Formatter",
  description: "Indent VBScript with keyword-based detection",
  icon: FileCode,
  iconColorClass: "bg-sky-100 text-sky-600",
  buttonColorClass: "bg-sky-600 hover:bg-sky-700",
  placeholder: "Paste VBScript code...",
  defaultIndentSize: 4,
  depthComputer: vbscriptDepths,
};

export const perlConfig: FormatToolConfig = {
  title: "Perl Formatter",
  description: "Indent Perl code with brace-based detection",
  icon: FileCode,
  iconColorClass: "bg-teal-100 text-teal-600",
  buttonColorClass: "bg-teal-600 hover:bg-teal-700",
  placeholder: "Paste Perl code...",
  defaultIndentSize: 4,
  depthComputer: braceDepths(),
};
