// src/pages/tools/json-editor/components/ErrorBoundary.tsx
import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props { children: React.ReactNode; fallback?: React.ReactNode }
interface State { hasError: boolean; error: Error | null }

export class JsonEditorErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center max-w-md">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <h3 className="text-sm font-semibold mb-2">编辑器出现错误</h3>
            <p className="text-xs text-muted-foreground mb-4 font-mono bg-muted/50 p-2 rounded">
              {this.state.error?.message || "未知错误"}
            </p>
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 mx-auto rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-sm hover:bg-cyan-500/25 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> 重试
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
