import { terser } from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import pkg from './package.json';

export default {
    input: 'src/tabfilters.js',
    output: [
        {
            file: pkg.main.replace('.js', '.salesforce.js'),
            format: 'umd',
            name: 'TabFilters'
        },
        {
            file: pkg.main.replace('.js', '.browser.js'),
            format: 'umd',
            name: 'TabFilters'
        },
        {
            file: pkg.main.replace('.js', '.salesforce.min.js'),
            format: 'umd',
            name: 'TabFilters',
            plugins: [terser()]
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