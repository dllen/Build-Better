import { phpConfig } from "./format-configs";
import FormatToolPage from "./FormatToolPage";

export default function PhpFormat() {
  return <FormatToolPage config={phpConfig} />;
}
