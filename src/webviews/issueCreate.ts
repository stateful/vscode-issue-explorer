import {
    WebviewView,
    WebviewViewProvider,
    ExtensionContext
} from 'vscode'
import Channel from 'tangle/webviews'
import type { Bus } from 'tangle'

import { webviewOptions, issueCreateChannel } from '../constants'
import { getHtmlForWebview } from '../utils'

import type { CodeSelection } from '../types'

export interface WebviewEvents {
    initIssueForm: CodeSelection[]
}

export default class IssueCreate implements WebviewViewProvider {
    private _client?: Bus<WebviewEvents>
    private _webviewView?: WebviewView

    constructor(private readonly _context: ExtensionContext) {}

    async resolveWebviewView(webviewView: WebviewView): Promise<void> {
        this._webviewView = webviewView
        webviewView.webview.html = await getHtmlForWebview(webviewView.webview, this._context.extensionUri)
        webviewView.webview.options = {
            ...webviewOptions,
            localResourceRoots: [this._context.extensionUri],
        }

        /**
         * register tangle
         */
        const bus = new Channel<WebviewEvents>(issueCreateChannel)
        this._client = await bus.registerPromise([this._webviewView.webview])
        console.log('[IssueCreate] webview resolved')
    }

    public initIssueForm (codeSelection: CodeSelection[]) {
        this._client?.emit('initIssueForm', codeSelection)
    }
}
