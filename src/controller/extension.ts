import vscode from "vscode"
import { EventEmitter } from 'events'

import IssueCreatePanel from "../webviews/issueCreate"

export default class ExtensionController implements vscode.Disposable {
    private _event: EventEmitter = new EventEmitter()
    private _disposables: vscode.Disposable[] = []

    // extension webviews
    private _issueCreatePanel: IssueCreatePanel

    /**
     * The main controller constructor
     * @constructor
     */
    constructor(private _context: vscode.ExtensionContext) {
        this._context.subscriptions.push(this)

        this._issueCreatePanel = new IssueCreatePanel(this._context)
        this._disposables.push(vscode.window.registerWebviewViewProvider('issueCreate', this._issueCreatePanel))
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
        console.log(`[ExtensionController] extension activated`)
    }

    /**
     * Helper method to setup command registrations with arguments
     */
    private _registerCommand(command: string, listener: (...args: any[]) => void): void {
        this._disposables.push(vscode.commands.registerCommand(command, (args: any) => {
            this._event.emit(command, args)
            return listener(args)
        }))
    }
}
