import { EventEmitter } from 'events'

import {
    WebviewView,
    WebviewViewProvider,
    ExtensionContext
} from 'vscode'
import Channel from 'tangle/webviews'
import type { Bus } from 'tangle'

import { webviewOptions, issueCreateChannel } from '../constants'
import { getHtmlForWebview } from '../utils'

import type { CodeSelection, CreateIssueResponse } from '../types'

export interface WebviewEvents {
    initIssueForm: CodeSelection[]
    issueCreateSubmission: {
        title: string
        description: string
        selection: CodeSelection[]
    }
    issueCreateResult: CreateIssueResponse
}

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
            ...webviewOptions,
            localResourceRoots: [this._context.extensionUri],
        }

        /**
         * register tangle
         */
        const bus = new Channel<WebviewEvents>(issueCreateChannel)
        this._client = await bus.registerPromise([this._webviewView.webview])
        this._client.on('issueCreateSubmission', (val) => this.emit('issueCreateSubmission', val))
        console.log('[IssueCreate] webview resolved')
    }

    public initIssueForm (codeSelection: CodeSelection[]) {
        this._client?.emit('initIssueForm', codeSelection)
    }

    public emitIssueCreationResult (result: CreateIssueResponse) {
        this._client?.emit('issueCreateResult', result)
    }
}
