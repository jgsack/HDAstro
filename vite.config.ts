import { cloudflare } from "@cloudflare/vite-plugin";
import { sites } from "@openai/sites-vite-plugin";
import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json" with { type: "json" };

const bindings = hostingConfig as { d1?: string | null; r2?: string | null };

export default defineConfig({
  plugins: [
    vinext(),
    sites(),
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
      config: {
        main: "./worker/index.ts",
        compatibility_flags: ["nodejs_compat"],
        d1_databases: bindings.d1
          ? [{
              binding: bindings.d1,
              database_name: "site-creator-d1",
              database_id: "00000000-0000-4000-8000-000000000000",
            }]
          : [],
        r2_buckets: bindings.r2
          ? [{ binding: bindings.r2, bucket_name: "site-creator-r2" }]
          : [],
      },
    }),
  ],
});
