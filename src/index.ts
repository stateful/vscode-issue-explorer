import vscode from "vscode"
import ExtensionController from './controller/extension'

let controller: ExtensionController

export async function activate(context: vscode.ExtensionContext) {
    controller = new ExtensionController(context)
    await controller.activate()
}

/**
 * this method is called when your extension is deactivated
 */
export async function deactivate() {
    controller?.deactivate()
}
