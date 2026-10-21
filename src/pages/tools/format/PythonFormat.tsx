import { pythonConfig } from "./format-configs";
import FormatToolPage from "./FormatToolPage";

export default function PythonFormat() {
  return <FormatToolPage config={pythonConfig} />;
}
