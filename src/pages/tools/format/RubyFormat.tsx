import { rubyConfig } from "./format-configs";
import FormatToolPage from "./FormatToolPage";

export default function RubyFormat() {
  return <FormatToolPage config={rubyConfig} />;
}
