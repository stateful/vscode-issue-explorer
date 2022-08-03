/* eslint-disable @typescript-eslint/naming-convention */
import fs from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'
import json from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import copy from 'rollup-plugin-copy'
import eta from 'rollup-plugin-eta'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const pkg = JSON.parse(
    (await fs.readFile(path.join(__dirname, 'package.json'), 'utf-8')).toString()
)

const extensions = ['.js', '.ts']

export default [
/**
 * Webview (ESM)
 */
{
    input: 'src/components/index.ts',
    output: [
        {
            file: './out/webview.js',
            format: 'esm',
            sourcemap: true,
        },
    ],
    plugins: [
        typescript({
            tsconfig: './tsconfig.json',
            declaration: false
        }),
        resolve({ extensions })
    ]
},
/**
 * Extension Host (CJS)
 */
{
    input: 'src/index.ts',
    output: [
        {
            dir: 'out',
            format: 'cjs',
            sourcemap: true,
        }
    ],
    plugins: [
        replace({
            preventAssignment: true,
            include: ['src/**/*.ts'],
            values: {
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
                __PACKAGE_JSON__: JSON.stringify(pkg),
                __INSTRUMENTATION_KEY__: process.env.INSTRUMENTATION_KEY || false
            }
        }),
        typescript({ tsconfig: './tsconfig.json' }),
        json(),
        commonjs({ transformMixedEsModules: true }),
        resolve({ extensions }),
        eta(),
        copy({ targets: [{ src: 'src/assets', dest: 'out' }] })
    ],
    external: ['vscode', '@vscode/extension-telemetry']
}]
