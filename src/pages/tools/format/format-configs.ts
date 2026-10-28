import { FileCode, Braces } from "lucide-react";
import { pythonDepths, rubyDepths, vbscriptDepths, braceDepths } from "@/lib/format/shared";
import type { FormatToolConfig } from "./FormatToolPage";

export const pythonConfig: FormatToolConfig = {
  title: "Python Formatter",
  description: "Indent Python code with colon-based detection",
  icon: FileCode,
  iconColorClass: "bg-primary/10 text-primary",
  buttonColorClass: "bg-primary hover:bg-primary/90",
  placeholder: "Paste Python code...",
  defaultIndentSize: 4,
  depthComputer: pythonDepths,
};

export const javaConfig: FormatToolConfig = {
  title: "Java Formatter",
  description: "Indent Java code with brace-based detection",
  icon: Braces,
  iconColorClass: "bg-primary/10 text-primary",
  buttonColorClass: "bg-primary hover:bg-primary/90",
  placeholder: "Paste Java code...",
  defaultIndentSize: 4,
  depthComputer: braceDepths(),
};

export const phpConfig: FormatToolConfig = {
  title: "PHP Formatter",
  description: "Indent PHP code with brace-based detection",
  icon: FileCode,
  iconColorClass: "bg-primary/10 text-primary",
  buttonColorClass: "bg-primary hover:bg-primary/90",
  placeholder: "Paste PHP code...",
  defaultIndentSize: 4,
  depthComputer: braceDepths(),
};

export const rubyConfig: FormatToolConfig = {
  title: "Ruby Formatter",
  description: "Indent Ruby code with keyword-based detection",
  icon: FileCode,
  iconColorClass: "bg-primary/10 text-primary",
  buttonColorClass: "bg-primary hover:bg-primary/90",
  placeholder: "Paste Ruby code...",
  defaultIndentSize: 2,
  depthComputer: rubyDepths,
};

export const csharpConfig: FormatToolConfig = {
  title: "C# Formatter",
  description: "Indent C# code with brace-based detection",
  icon: Braces,
  iconColorClass: "bg-primary/10 text-primary",
  buttonColorClass: "bg-primary hover:bg-primary/90",
  placeholder: "Paste C# code...",
  defaultIndentSize: 4,
  depthComputer: braceDepths(),
};

export const cConfig: FormatToolConfig = {
  title: "C Formatter",
  description: "Indent C code with brace detection + preprocessor support",
  icon: Braces,
  iconColorClass: "bg-primary/10 text-primary",
  buttonColorClass: "bg-primary hover:bg-primary/90",
  placeholder: "Paste C code...",
  defaultIndentSize: 4,
  depthComputer: braceDepths({ preservePreprocessor: true }),
};

export const vbscriptConfig: FormatToolConfig = {
  title: "VBScript Formatter",
  description: "Indent VBScript with keyword-based detection",
  icon: FileCode,
  iconColorClass: "bg-primary/10 text-primary",
  buttonColorClass: "bg-primary hover:bg-primary/90",
  placeholder: "Paste VBScript code...",
  defaultIndentSize: 4,
  depthComputer: vbscriptDepths,
};

export const perlConfig: FormatToolConfig = {
  title: "Perl Formatter",
  description: "Indent Perl code with brace-based detection",
  icon: FileCode,
  iconColorClass: "bg-primary/10 text-primary",
  buttonColorClass: "bg-primary hover:bg-primary/90",
  placeholder: "Paste Perl code...",
  defaultIndentSize: 4,
  depthComputer: braceDepths(),
};
