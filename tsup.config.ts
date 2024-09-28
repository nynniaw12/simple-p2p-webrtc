import { defineConfig } from 'tsup';

export default defineConfig({
    format: ['cjs', 'esm'],
    entry: {
        index: './src/index.ts',
        'react-native': './src/react-native.ts'
    },
    dts: true,
    shims: true,
    splitting: false,
    skipNodeModulesBundle: true,
    clean: true,
});
