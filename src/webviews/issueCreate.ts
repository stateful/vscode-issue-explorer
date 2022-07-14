import {
    Webview,
    WebviewView,
    WebviewViewProvider,
    ExtensionContext
} from 'vscode'

import { webviewOptions } from '../constants'
import { getHtmlForWebview } from '../utils'

export default class IssueCreate implements WebviewViewProvider {
    constructor(private readonly _context: ExtensionContext) {}

    async resolveWebviewView(webviewView: WebviewView): Promise<void> {
        webviewView.webview.html = await getHtmlForWebview(webviewView.webview, this._context.extensionUri)
        webviewView.webview.options = {
            ...webviewOptions,
            localResourceRoots: [this._context.extensionUri],
        }
        console.log('[IssueCreate] webview resolved')
    }
}
