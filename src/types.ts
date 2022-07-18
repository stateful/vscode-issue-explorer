import type vscode from 'vscode'

export interface ExtensionConfiguration {
    baseAppUri: string
}

export interface CodeSelection {
    start: number
    end: number
    uri: vscode.Uri,
    code: string
}
