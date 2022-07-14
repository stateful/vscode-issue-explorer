import vscode from "vscode"
import { EventEmitter } from 'events'

import IssueCreatePanel from "../webviews/issueCreate"

export default class ExtensionController implements vscode.Disposable {
    private readonly _channel = vscode.window.createOutputChannel('Issue Explorer')
    private _event: EventEmitter = new EventEmitter()
    private _disposables: vscode.Disposable[] = []

    /**
     * The main controller constructor
     * @constructor
     */
    constructor(private _context: vscode.ExtensionContext) {
        this._context.subscriptions.push(this)

        this._disposables.push(
            vscode.window.registerWebviewViewProvider('create-issue', new IssueCreatePanel(this._context))
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
        this._registerCommand('issue-explorer.createIssueFromSelection', this._createIssueFromSelection.bind(this))
        console.log(`[ExtensionController] extension activated`)
    }

    _createIssueFromSelection (a: any) {
        this._channel.appendLine(`HA!!!`)
    }

    /**
     * Helper method to setup command registrations with arguments
     */
    private _registerCommand(command: string, listener: (...args: any[]) => void): void {
        this._channel.appendLine(`Register command ${command}`)
        this._disposables.push(vscode.commands.registerCommand(command, (args: any) => {
            this._event.emit(command, args)
            return listener(args)
        }))
    }
}
