import { readdirSync, readFileSync } from "fs";
import path from "path";
import type { CountryConfig } from "@/lib/challenge-12/types";
import Challenge12Client from "./Challenge12Client";

function loadConfigs(): Record<string, CountryConfig> {
  const dir = path.join(process.cwd(), "lib/challenge-12/configs");
  const configs: Record<string, CountryConfig> = {};
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    const code = file.replace(".json", "");
    configs[code] = JSON.parse(readFileSync(path.join(dir, file), "utf-8"));
  }
  return configs;
}

export default function Challenge12Page() {
  const configs = loadConfigs();
  return <Challenge12Client configs={configs} />;
}
