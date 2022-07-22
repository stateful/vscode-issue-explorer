import path from 'node:path'
import { EventEmitter } from 'node:events'

import vscode from 'vscode'

import IssueCreatePanel, { WebviewEvents } from '../webviews/issueCreate'
import GitProvider from '../provider/git'
import { EDITOR_DECORATION_OPTION } from './constants'
import type { CodeSelection } from '../types'

// @ts-expect-error
import tpl from '../templates/issueDescription.tpl.eta'

const UPDATE_DECORATION_TIMEOUT = 500

export default class ExtensionController implements vscode.Disposable {
    #activeEditor?: vscode.TextEditor

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
            vscode.window.registerWebviewViewProvider('create-issue', this._issueCreatePanel),
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                this.#activeEditor = editor
                this.#updateDecorations()
            })
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

        this.#activeEditor = vscode.window.activeTextEditor
        this.#updateDecorations()
        console.log(`[ExtensionController] extension activated`)
    }

    async _createIssueFromSelection(editor: vscode.TextEditor) {
        const ws = vscode.workspace.getWorkspaceFolder(editor.document.uri)!
        const codeLines: CodeSelection[] = editor.selections.map((s) => ({
            uri: editor.document.uri.fsPath
                // only store path relative to the workspace
                .replace(ws.uri.fsPath, '')
                // remove leading `/`
                .slice(1),
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
        this.#updateDecorations()
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

    async #updateDecorations () {
        if (!this.#activeEditor) {
            return
        }

        const ws = vscode.workspace.getWorkspaceFolder(this.#activeEditor.document.uri)!
        const relativePath = this.#activeEditor.document.fileName.replace(ws.uri.fsPath, '').slice(1)

        const provider = await this._git.getRemoteVCS()
        const referencedIssues = await provider.findIssues()
        const relativeIssues = referencedIssues.filter(
            (issue) => issue.referencedFiles.includes(relativePath))

        /**
         * highlight text
         */
        this.#activeEditor.setDecorations(EDITOR_DECORATION_OPTION, [])
        const decorations: vscode.DecorationOptions[] = []
        for (const issue of relativeIssues) {
            for (const selection of issue.codeSelection) {
                if (selection.uri !== relativePath) {
                    continue
                }

                decorations.push({
                    range: new vscode.Range(selection.start, 0, selection.end, Infinity),
                    hoverMessage: tpl(issue)
                })
            }
        }
        this.#activeEditor.setDecorations(EDITOR_DECORATION_OPTION, decorations)
    }
}
