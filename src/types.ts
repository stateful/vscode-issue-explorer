import type vscode from 'vscode'

export interface ExtensionConfiguration {
    baseAppUri: string
}

export interface CodeSelection {
    start: number
    end: number
    uri: string,
    fileType: string,
    code: string
}

export interface IRemoteProvider {
    createIssue (
        title: string,
        description: string,
        selection: CodeSelection[]
    ): Promise<CreateIssueResponse>

    findIssues (): Promise<ReferencedIssue[]>
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

export interface ReferencedIssue extends CreateIssueResult {
    codeSelection: CodeSelection[]
    referencedFiles: string[]
    body: string
    title: string
}
