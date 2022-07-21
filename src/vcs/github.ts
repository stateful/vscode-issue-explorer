import vscode from 'vscode'
import { createRequire } from 'node:module'
import type { Octokit as OctokitType, RestEndpointMethodTypes } from '@octokit/rest'

const require = createRequire(import.meta.url)
const { Octokit } = require('@octokit/rest')

import { ISSUE_LABEL } from '../constants'
import type { CodeSelection, IRemoteProvider, CreateIssueResult, CreateIssueError } from '../types'

// @ts-expect-error
import tpl from '../templates/newGitHubIssue.tpl.eta'

const GITHUB_AUTH_PROVIDER_ID = 'github'
const SCOPES = ['user:email', 'repo']

export default class GitHubManager implements IRemoteProvider {
    #octokit?: OctokitType
    #owner: string
    #repo: string

    constructor (owner: string, repo: string) {
        this.#owner = owner
        this.#repo = repo
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
        console.log('Authenticate with ', this.#octokit)

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
            const result: RestEndpointMethodTypes["issues"]["create"]["response"] = await this.#octokit?.issues.create({
                owner: this.#owner,
                repo: this.#repo,
                title,
                body: await tpl({ title, description, codeSelection }),
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

    public findIssues () {
        return [] as any
    }
}
