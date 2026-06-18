async function main(): Promise<void> {
  await Bun.$`rm -rf dist`

  await Bun.build({
    entrypoints: ["./src/bin/cli.ts"],
    outdir: "./dist",
    naming: "index.[ext]",
    target: "node",
    format: "esm",
  })
}

void main()
