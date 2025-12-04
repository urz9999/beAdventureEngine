import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  minify: true,
  sourcemap: true,
  target: 'es2020',
  format: 'esm',
  outfile: 'dist/bundle.min.js',
  loader: {
    '.ts': 'ts',
  },
});

console.log('✓ Bundle created successfully');
