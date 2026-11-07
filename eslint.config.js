import pluginVue from "eslint-plugin-vue";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";

export default defineConfigWithVueTs(
  { ignores: ["dist/**", "dev-dist/**", "node_modules/**", ".yarn/**", "public/**", "contrib/**"] },
  pluginVue.configs["flat/recommended"],
  vueTsConfigs.recommended,
  skipFormatting,
  {
    rules: {
      "vue/multi-word-component-names": "off",
    },
  },
);
