import { perlConfig } from "./format-configs";
import FormatToolPage from "./FormatToolPage";

export default function PerlFormat() {
  return <FormatToolPage config={perlConfig} />;
}
