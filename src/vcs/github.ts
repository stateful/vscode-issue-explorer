import vscode from 'vscode'
import { createRequire } from 'node:module'
import type { Octokit as OctokitType, RestEndpointMethodTypes } from '@octokit/rest'

const require = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/naming-convention
const { Octokit } = require('@octokit/rest')

import GitProvider from '../provider/git'
import { ISSUE_LABEL } from '../constants'
import type {
    CodeSelection, IRemoteProvider, CreateIssueResult, CreateIssueError,
    ReferencedIssue
} from '../types'

// @ts-expect-error
import tpl from '../templates/newGitHubIssue.tpl.eta'

const GITHUB_AUTH_PROVIDER_ID = 'github'
const SCOPES = ['user:email', 'repo']
const COMMENT_START = '<!-- '

export default class GitHubManager implements IRemoteProvider {
    #octokit?: OctokitType
    #owner: string
    #repo: string
    #git: GitProvider

    constructor (owner: string, repo: string, git: GitProvider) {
        this.#owner = owner
        this.#repo = repo
        this.#git = git
    }

    get isAuthenticated() {
        return Boolean(this.#octokit)
    }

    async #ensureAuth() {
        if (!this.isAuthenticated) {
            await this.authenticate()
        }
    }

    public async authenticate() {
        if (this.#octokit) {
            return this.#octokit
        }

        console.log(`Authenticate with ${GITHUB_AUTH_PROVIDER_ID}`)
        const session = await vscode.authentication.getSession(
            GITHUB_AUTH_PROVIDER_ID, SCOPES, { createIfNone: true })

        console.log(`Successfully authenticated with ${session.account.label}`)
        this.#octokit = new Octokit({ auth: session.accessToken })
    }

    public async createIssue(title: string, description: string, codeSelection: CodeSelection[]) {
        await this.#ensureAuth()

        try {
            console.log(`Create new Issue: "${title}"`)
            const sha = await this.#git.getCurrentHead()
            const result: RestEndpointMethodTypes["issues"]["create"]["response"] = await this.#octokit?.issues.create({
                owner: this.#owner,
                repo: this.#repo,
                title,
                body: await tpl({
                    owner: this.#owner,
                    repo: this.#repo,
                    title,
                    description,
                    codeSelection,
                    sha
                }),
                labels: [ISSUE_LABEL]
            })!
            const issueNumber = result.data.url.split('/').pop()

            console.log('Issue created successfully')
            return <CreateIssueResult>{
                issueUrl: result.data.html_url,
                issueLabel: `${this.#owner}/${this.#repo}#${issueNumber}`,
                authorUrl: result.data.user?.html_url,
                authorLabel: `@${result.data.user?.login}`
            }
        } catch (err: any) {
            const error = `Couldn't create issue: ${(err as Error).message}`
            vscode.window.showErrorMessage(error)
            return <CreateIssueError>{ error }
        }
    }

    public async findIssues () {
        await this.#ensureAuth()
        const issues = await this.#octokit!.issues.listForRepo({
            owner: this.#owner,
            repo: this.#repo,
            labels: ISSUE_LABEL.name,
            state: 'open'
        })

        return issues.data
            .filter((issue) => Boolean(issue.body))
            .map((issue) => {
                const issueDetails = issue.body!.slice(
                    issue.body!.indexOf(COMMENT_START) + COMMENT_START.length,
                    -COMMENT_START.length
                )

                try {
                    const codeSelection = JSON.parse(issueDetails) as CodeSelection[]
                    const referencedIssue: ReferencedIssue = {
                        codeSelection,
                        referencedFiles: codeSelection.map((s) => s.uri),
                        body: issue.body!.slice(0, issue.body!.indexOf(COMMENT_START)),
                        title: issue.title,
                        issueUrl: issue.html_url,
                        issueLabel: `${this.#owner}/${this.#repo}#${issue.url.split('/').pop()}`,
                        authorUrl: issue.user?.html_url!,
                        authorLabel: `@${issue.user?.login}`
                    }
                    return referencedIssue
                } catch (err) {
                    console.log(`Couldn't fetch issue details for ${issueDetails}`)
                }
            })
            .filter(Boolean) as ReferencedIssue[]
    }
}
