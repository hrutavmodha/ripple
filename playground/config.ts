interface RippleConfig {
  adapter?: 'node' | null
  rootDir?: string
  outDir?: string
  port?: number
}

export default function defineRippleConfig(args: RippleConfig): RippleConfig {
  return args
}