import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import copy from 'rollup-plugin-copy'
import eta from 'rollup-plugin-eta'

const extensions = ['.js', '.ts']

export default [{
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
}, {
    input: 'src/index.ts',
    output: [
        {
            dir: 'out',
            format: 'cjs',
            sourcemap: true,
        },
    ],
    plugins: [
        typescript({ tsconfig: './tsconfig.json' }),
        resolve({ extensions }),
        eta(),
        copy({ targets: [{ src: 'src/assets', dest: 'out' }] })
    ],
    external: ['vscode']
}]
