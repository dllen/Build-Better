import { csharpConfig } from "./format-configs";
import FormatToolPage from "./FormatToolPage";

export default function CsharpFormat() {
  return <FormatToolPage config={csharpConfig} />;
}
