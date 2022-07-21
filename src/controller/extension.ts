import path from 'node:path'
import { EventEmitter } from 'node:events'

import vscode from 'vscode'

import IssueCreatePanel, { WebviewEvents } from '../webviews/issueCreate'
import GitProvider from '../provider/git'
import type { CodeSelection } from '../types'

export default class ExtensionController implements vscode.Disposable {
    private readonly _channel = vscode.window.createOutputChannel('Issue Explorer')
    private readonly _git = new GitProvider()
    private _event: EventEmitter = new EventEmitter()
    private _disposables: vscode.Disposable[] = []

    private _issueCreatePanel: IssueCreatePanel

    /**
     * The main controller constructor
     * @constructor
     */
    constructor(private _context: vscode.ExtensionContext) {
        this._context.subscriptions.push(this)

        this._issueCreatePanel = new IssueCreatePanel(this._context)
        this._issueCreatePanel.on('issueCreateSubmission', this.#createIssue.bind(this))
        this._disposables.push(
            vscode.window.registerWebviewViewProvider('create-issue', this._issueCreatePanel)
        )
    }

    /**
     * Deactivate the controller
     */
    deactivate(): void {
        this.dispose()
        console.log('[ExtensionController] extension deactivated')
    }

    dispose() {
        this._disposables.forEach((disposable) => disposable.dispose())
        console.log(`[ExtensionController] ${this._disposables.length} items disposed`)
    }

    /**
     * Initializes the extension
     */
    public async activate() {
        this._registerCommand(
            'issue-explorer.createIssueFromSelection',
            this._createIssueFromSelection.bind(this),
            true
        )
        console.log(`[ExtensionController] extension activated`)
    }

    async _createIssueFromSelection(editor: vscode.TextEditor) {
        const codeLines: CodeSelection[] = editor.selections.map((s) => ({
            uri: editor.document.uri,
            fileType: path.basename(editor.document.uri.path).split('.').pop() || '',
            start: s.start.line,
            end: s.end.line,
            code: editor.document.getText(new vscode.Range(
                s.start.line,
                0,
                s.end.line,
                Infinity
            ))
        }))
        await vscode.commands.executeCommand('create-issue.focus')
        this._issueCreatePanel.initIssueForm(codeLines)
    }

    async #createIssue(params: WebviewEvents['issueCreateSubmission']) {
        const provider = await this._git.getRemoteVCS()
        const result = await provider.createIssue(params.title, params.description, params.selection)
        this._issueCreatePanel.emitIssueCreationResult(result)
    }

    /**
     * Helper method to setup command registrations with arguments
     */
    private _registerCommand(
        command: string,
        listener: (...args: any[]) => void,
        isTextEditorRegistration = false
    ): void {
        const registerCommand = isTextEditorRegistration
            ? 'registerTextEditorCommand'
            : 'registerCommand'
        this._channel.appendLine(`Register command ${command}`)
        this._disposables.push(vscode.commands[registerCommand](command, (args: any) => {
            this._event.emit(command, args)
            return listener(args)
        }))
    }
}
