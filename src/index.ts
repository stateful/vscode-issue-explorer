import type vscode from "vscode"
import telemetry from './telemetry'
import ExtensionController from './controller/extension'

let controller: ExtensionController

export async function activate(context: vscode.ExtensionContext) {
    controller = new ExtensionController(context)
    await controller.activate()
    telemetry.sendTelemetryEvent('extensionActivated')
}

/**
 * this method is called when your extension is deactivated
 */
export async function deactivate() {
    controller?.deactivate()
    telemetry.sendTelemetryEvent('extensionDeactivated')
}
