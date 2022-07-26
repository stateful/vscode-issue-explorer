import crypto from 'crypto'
import { Uri, Webview, window, workspace } from "vscode"
import { EXTENSION_NAME } from './constants'

// @ts-expect-error
import tpl from './templates/webview.tpl.eta'

const config = workspace.getConfiguration(EXTENSION_NAME)

function getUri(webview: Webview, extensionUri: Uri, pathList: string[]) {
    return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList))
}

export async function getHtmlForWebview(webview: Webview, extensionUri: Uri) {
    const { cspSource } = webview
    const scripts = [{
        src: getUri(webview, extensionUri, [
            'node_modules',
            '@vscode',
            'webview-ui-toolkit',
            'dist',
            'toolkit.js'
        ]),
        defer: true
    }, {
        src: getUri(webview, extensionUri, ['out', 'webview.js']),
        defer: true
    }]
    const stylesheets = [{
        id: 'vscode-codicon-stylesheet',
        href: getUri(webview, extensionUri, ['node_modules', '@vscode', 'codicons', 'dist', 'codicon.css'])
    }]
    const baseAppUri = getUri(webview, extensionUri, ['out']).toString()

    try {
        const html = await tpl({
            scripts, stylesheets, cspSource,
            nonce: crypto.randomBytes(16).toString('base64'),
            config: {
                ...(config.get('configuration') as object || {}),
                baseAppUri
            },
            title: 'GitHub Issue Explorer'
        })
        return html!
    } catch (err: any) {
        window.showErrorMessage(`Issue Explorer: Couldn't generate template: ${err.message}`)
        return ''
    }
}
