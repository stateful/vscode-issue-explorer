import vscode from "vscode"
import { EventEmitter } from 'events'

import IssueCreatePanel from "../webviews/issueCreate"
import type { CodeSelection } from '../types'

export default class ExtensionController implements vscode.Disposable {
    private readonly _channel = vscode.window.createOutputChannel('Issue Explorer')
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

    dispose () {
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

    _createIssueFromSelection (editor: vscode.TextEditor) {
        const codeLines: CodeSelection[] = editor.selections.map((s) => ({
            uri: editor.document.uri,
            start: s.start.line,
            end: s.end.line,
            code: editor.document.getText(new vscode.Range(
                editor.selection.start.line,
                0,
                editor.selection.end.line,
                Infinity
            ))
        }))
        this._issueCreatePanel.initIssueForm(codeLines)
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
