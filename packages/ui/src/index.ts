// Web entry. Side-effect CSS import included — bundled by Next via transpilePackages.
// React Native consumers MUST import from "@batho/ui/native" to avoid this CSS.
import "./components/components.css";

export { Button } from "./components/Button";
export { Card } from "./components/Card";
export { Badge } from "./components/Badge";
export { Field, Input, Select, Textarea } from "./components/Input";
export { Section } from "./components/Section";
export { Stat } from "./components/Stat";
export { Table } from "./components/Table";
export { NavBar } from "./components/NavBar";
export { BorderPattern } from "./components/BorderPattern";

export { ThemeProvider, useTheme } from "./theme/ThemeProvider";
export { ThemeToggle } from "./theme/ThemeToggle";
export { themeInitScript } from "./theme/init-script";

// Legacy contract — preserved for any web consumer that referenced these.
// Native consumers should pull these from "@batho/ui/native" instead.
export type {
  ButtonTone,
  StageStatus,
  ButtonRecipe,
  FundingStageProgressItem
} from "./legacy";

export {
  createButtonRecipe,
  getFundingStageStatus,
  formatProgressPercent
} from "./legacy";
