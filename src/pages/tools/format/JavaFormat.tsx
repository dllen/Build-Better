import { javaConfig } from "./format-configs";
import FormatToolPage from "./FormatToolPage";

export default function JavaFormat() {
  return <FormatToolPage config={javaConfig} />;
}
