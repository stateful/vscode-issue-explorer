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

export interface IRemoteProvider {
    createIssue (
        title: string,
        description: string,
        selection: CodeSelection[]
    ): Promise<CreateIssueResponse>
}

export type CreateIssueResponse = CreateIssueResult | CreateIssueError

export interface CreateIssueResult {
    issueUrl: string
    issueLabel: string
    authorUrl: string
    authorLabel: string
}

export interface CreateIssueError {
    error: string
}
