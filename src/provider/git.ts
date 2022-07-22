import vscode from 'vscode'

import GitHubManager from '../vcs/github'
import { API, GitExtension, Remote } from '../types/git'
import type { IRemoteProvider } from '../types'

const sleep = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

export default class GitProvider {
    #git?: API
    #vcsManager: Promise<IRemoteProvider>

    constructor () {
        this.#vcsManager = this.#init()
    }

    async #init() {
        const vscodeGit = vscode.extensions.getExtension('vscode.git') as vscode.Extension<GitExtension>
        if (!vscodeGit) {
            throw new Error('Failed to load git extension.')
        }

        const ext = await vscodeGit.activate()
        this.#git = ext.getAPI(1)

        const folder = vscode.workspace.getWorkspaceFolder(
            vscode.window.activeTextEditor?.document.uri!
        )

        if (!folder) {
            throw new Error('No workspace detected.')
        }

        const remote = await this.#waitForRemotes()
        const [provider, repo] = remote.pushUrl?.split(':') as [string, string]

        if (provider.endsWith('github.com')) {
            console.log(`Identified GitHub repository ${repo}`)
            const [owner, repoName] = repo.split('/')
            return new GitHubManager(
                owner,
                repoName.endsWith('.git')
                    ? repoName.slice(0, -4)
                    : repoName,
                this
            )
        }

        throw new Error(`No support for remote provider with url ${remote.pushUrl}`)
    }

    public async getRemoteVCS () {
        return await this.#vcsManager
    }

    public async getCurrentHead () {
        await this.getRemoteVCS()
        const repo = this.#git!.repositories[0]
        return repo.state.HEAD?.commit
    }

    async #waitForRemotes (retries = 5): Promise<Remote> {
        if (!this.#git) {
            throw new Error('not initialised')
        }

        await sleep()
        if (this.#git.repositories.length === 0) {
            return this.#waitForRemotes(--retries)
        }

        const repo = this.#git.repositories[0]
        if (repo.state.remotes.length === 0) {
            return this.#waitForRemotes(--retries)
        }

        /**
         * ToDo(Christian): ask user which remote to use if origin is not found
         */
        return repo.state.remotes.find((r) => r.name === 'origin')!
    }
}
