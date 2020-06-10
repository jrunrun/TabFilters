import { terser } from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import pkg from './package.json';

export default {
    input: 'src/tabfilters.js',
    output: [
        {
            file: pkg.main,
            format: 'umd',
            name: 'TabFilters'
        },
        {
            file: pkg.main.replace('.js', '.min.js'),
            format: 'umd',
            name: 'TabFilters',
            plugins: [terser()]
        },
        {
            file: pkg.module,
            format: 'es',
        }
    ],
    external: [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: [
        resolve({
            browser: true
        }),
        commonjs({
            sourceMap: false
        }),
        babel({
            exclude: 'node_modules/**'
        })
    ]
}