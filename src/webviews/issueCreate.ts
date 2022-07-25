import { EventEmitter } from 'node:events'
import vscode, {
    WebviewView,
    WebviewViewProvider,
    ExtensionContext
} from 'vscode'
import Channel from 'tangle/webviews'
import type { Bus } from 'tangle'

import { WEBVIEW_OPTIONS, ISSUE_CREATE_CHANNEL } from '../constants'
import { getHtmlForWebview } from '../utils'

import type { CodeSelection, CreateIssueResponse, WebviewEvents } from '../types'

export default class IssueCreate extends EventEmitter implements WebviewViewProvider {
    private _client?: Bus<WebviewEvents>
    private _webviewView?: WebviewView

    constructor(private readonly _context: ExtensionContext) {
        super()
    }

    async resolveWebviewView(webviewView: WebviewView): Promise<void> {
        this._webviewView = webviewView
        webviewView.webview.html = await getHtmlForWebview(webviewView.webview, this._context.extensionUri)
        webviewView.webview.options = {
            ...WEBVIEW_OPTIONS,
            localResourceRoots: [this._context.extensionUri],
        }

        /**
         * register tangle
         */
        const bus = new Channel<WebviewEvents>(ISSUE_CREATE_CHANNEL)
        this._client = await bus.registerPromise([this._webviewView.webview])
        this._client.on('issueCreateSubmission', (val) => this.emit('issueCreateSubmission', val))
        this._client.on('stateUpdate', (state) => this.emit('stateUpdate', state))
        this._client.on('openCodeReference', (position) => this.emit('openCodeReference', position))
        console.log('[IssueCreate] webview resolved')
    }

    public initIssueForm (codeSelection: CodeSelection[]) {
        this._client?.emit('initIssueForm', codeSelection)
    }

    public emitIssueCreationResult (result: CreateIssueResponse) {
        this._client?.emit('issueCreateResult', result)
    }
}
