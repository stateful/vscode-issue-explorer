import path from 'node:path'
import { EventEmitter } from 'node:events'

import vscode from 'vscode'

import telemetry from '../telemetry'
import IssueCreatePanel from '../webviews/issueCreate'
import GitProvider from '../provider/git'
import { EDITOR_DECORATION_OPTION, NO_GIT_EXTENSION_ERROR } from './constants'
import type { CodeSelection, CreateIssueError, WebViewState, WebviewEvents, CodeReferenceLocation } from '../types'

// @ts-expect-error
import tpl from '../templates/issueDescription.tpl.eta'

export default class ExtensionController implements vscode.Disposable {
    #activeEditor?: vscode.TextEditor
    #selectedCodeLines: CodeSelection[] = []

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
        this._issueCreatePanel.on('openCodeReference', this.#openCodeReference.bind(this))
        this._issueCreatePanel.on('stateUpdate', (state: WebViewState) => {
            this.#selectedCodeLines = state.codeSelection
        })
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
        this._registerCommand(
            'issue-explorer.getStarted',
            this.#openWalkthrough.bind(this)
        )

        this.#activeEditor = vscode.window.activeTextEditor
        this.#updateDecorations()
        console.log(`[ExtensionController] extension activated`)
    }

    async _createIssueFromSelection(editor: vscode.TextEditor) {
        const ws = vscode.workspace.getWorkspaceFolder(editor.document.uri)

        if (!ws) {
            return vscode.window.showWarningMessage(NO_GIT_EXTENSION_ERROR)
        }

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

        /**
         * if the extension failed to load due to error this variable
         * can be undefined given the way rollup bundles private fields
         */
        if (!this.#selectedCodeLines) {
            this.#selectedCodeLines = []
        }

        this.#selectedCodeLines.push(...codeLines)
        await vscode.commands.executeCommand('create-issue.focus')
        this._issueCreatePanel.initIssueForm(this.#selectedCodeLines)
        telemetry.sendTelemetryEvent('initIssueForm', {
            selectedLines: this.#selectedCodeLines.length.toString()
        })
    }

    async #createIssue(params: WebviewEvents['issueCreateSubmission']) {
        const provider = await this._git.getRemoteVCS()

        if (!provider) {
            return vscode.window.showWarningMessage(NO_GIT_EXTENSION_ERROR)
        }

        const result = await provider.createIssue(params.title, params.description, params.selection)
        this._issueCreatePanel.emitIssueCreationResult(result)

        if (!(result as CreateIssueError).error) {
            this.#selectedCodeLines = []
        }

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

        const ws = vscode.workspace.getWorkspaceFolder(this.#activeEditor.document.uri)
        if (!ws) {
            return
        }

        const relativePath = this.#activeEditor.document.fileName
            .replace(ws.uri.fsPath, '')
            .slice(1)

        const provider = await this._git.getRemoteVCS()
        if (!provider) {
            return console.warn(NO_GIT_EXTENSION_ERROR)
        }

        const referencedIssues = await provider.findIssues()
        const relativeIssues = referencedIssues.filter(
            (issue) => issue.referencedFiles.includes(relativePath))

        /**
         * active editor could not be active at this point anymore
         */
        if (!this.#activeEditor) {
            return
        }

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

    async #openCodeReference ({ uri, start, end }: CodeReferenceLocation) {
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            return console.log('Can\'t open file, no workspace opened')
        }

        const ws = vscode.workspace.workspaceFolders[0]
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.joinPath(ws.uri, uri))
        return vscode.window.showTextDocument(doc, {
            selection: new vscode.Range(
                new vscode.Position(start, 0),
                new vscode.Position(end + (start === end ? 1 : 0), Infinity)
            )
        })
    }

    #openWalkthrough () {
        vscode.commands.executeCommand(
            'workbench.action.openWalkthrough',
            {
                category: `stateful.issue-explorer#issue-explorer.welcome`,
                step: undefined,
            },
            false
        )
    }
}
