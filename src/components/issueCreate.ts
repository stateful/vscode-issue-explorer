import {
    html,
    css,
    unsafeCSS,
    CSSResult,
    LitElement,
    customElement
} from 'lit-element'
import { when } from 'lit/directives/when.js'
import Channel from 'tangle/webviews'
import shrinkPath from 'shrink-path'
import type { TextArea, TextField } from '@vscode/webview-ui-toolkit'
import type { Client } from 'tangle'

import { updateState } from './utils'
import { vscode, codiconCSSRules } from './constants'
import { ISSUE_CREATE_CHANNEL } from '../constants'
import type { CodeSelection, CreateIssueResult, CreateIssueResponse, CreateIssueError, WebviewEvents } from '../types'

const MARKETPLACE_URL = 'https://marketplace.visualstudio.com/items?itemName=stateful.issue-explorer'
const GITHUB_URL = 'https://github.com/stateful/vscode-issue-explorer'
const state = vscode.getState()

@customElement('issue-create')
export class IssueCreateForm extends LitElement {
    #error?: string
    #result?: CreateIssueResult
    #client: Client<WebviewEvents>
    #codeSelection: CodeSelection[] = state?.codeSelection || []
    #requestPending = false

    static get styles(): CSSResult[] {
        return [css/*css*/`
        .content {
            height: 100%;
            display: flex;
            flex-direction: column;
            flex: 1;
        }

        vscode-radio-group {
            margin: 10px 0
        }

        sub {
            display: block;
            margin-top: 5px;
        }

        vscode-text-field, vscode-text-area {
            width: 100%
        }

        footer {
            text-align: center;
            margin: 15px 0 0;
            font-size: .8em;
            border-top: 1px solid rgba(255, 255, 255, .3);
            padding: 3px 0 15px;
            margin-top: auto;
        }
        footer vscode-link {
            font-size: .9em;
        }

        .btnSection {
            display: flex;
            flex-direction: row;
            justify-content: flex-end;
            gap: 10px;
        }

        .codeSelection {
            list-style: none;
            padding-inline-start: 0;
        }

        .codeSelection li {
            margin-bottom: 15px;
            display: flex;
            gap: 10px;
            align-items: flex-start;
        }

        .codeSelection li div {
            width: 100%;
        }

        .codeSelection li div vscode-text-area {
            margin-top: 10px;
        }

        .errorMessage {
            color: red;
            font-weight: bold;
        }

        .codicon-check {
            color: green;
        }
        .codicon-check,
        .codicon-error {
            position: relative;
            top: 3px;
            padding-right: 5px;
        }
        button.codicon-close,
        button.codicon-edit {
            border: 0;
            background: transparent;
            cursor: pointer;
            color: inherit;
            padding: 0;
        }

        .createIssueForm {
            opacity: 1;
            transition: opacity .2s linear;
            display: flex;
            flex-direction: column;
            flex: 1 1 0%;
            height: 100%;
        }
        .createIssueForm.hidden {
            opacity: 0;
        }

        @keyframes spin {
            from {
                transform: rotate(0deg);
            } to {
                transform: rotate(360deg);
            }
        }

        .codicon-loading {
            animation-name: spin;
            animation-duration: 4000ms;
            animation-iteration-count: infinite;
            animation-timing-function: linear;
        }
        `,
        ...codiconCSSRules.map((r: string) => unsafeCSS(r))]
    }

    constructor() {
        super()

        const channel = new Channel<WebviewEvents>(ISSUE_CREATE_CHANNEL)
        this.#client = channel.attach(vscode as any)
        this.#client.on('initIssueForm', this.#initIssueForm.bind(this))
        this.#client.on('issueCreateResult', this.#renderResult.bind(this))

        /**
         * Propagate state to extension host to update our collection there
         * in case VS Code was restarted and the webview kept code selections
         * in its state
         */
        updateState(this.#client, {})
    }

    render() {
        if (!this.#result && (!this.#codeSelection || this.#codeSelection.length === 0)) {
            return this.renderWelcomeView()
        }

        return html/* html */`
        ${when(this.#error, () => this.renderError(this.#error!))}
        ${when(this.#result,
            () => this.renderSuccess(this.#result!),
            () => this.renderForm()
        )}
        `
    }

    #cancel () {
        this.#requestPending = false
        this.#codeSelection = []

        updateState(this.#client, { codeSelection: [] })
        this.requestUpdate()
    }

    #submit () {
        const titleElem = this.shadowRoot?.querySelector('vscode-text-field') as TextField
        const descriptionElem = this.shadowRoot?.querySelector('vscode-text-area') as TextArea

        /**
         * fetch code reference comments
         */
        const commentBlocks: TextArea[] = Array.from(this.shadowRoot?.querySelectorAll('vscode-text-area[name="codeReferenceComment"]') || [])
        for (const commentBlock of commentBlocks) {
            const item = parseInt(commentBlock.getAttribute('data-item')!, 10)
            this.#codeSelection[item].comment = commentBlock.value
        }

        this.#client.emit('issueCreateSubmission', {
            title: titleElem.value,
            description: descriptionElem.value,
            selection: this.#codeSelection
        })

        this.#requestPending = true
        this.requestUpdate()
    }

    #removeCodeReference (i: number) {
        this.#codeSelection.splice(i, 1)
        updateState(this.#client, { codeSelection: this.#codeSelection })
        this.requestUpdate()
    }

    #addCodeReferenceComment (i: number) {
        if (typeof this.#codeSelection[i].comment === 'string') {
            return
        }

        this.#codeSelection[i].comment = ''
        this.requestUpdate()
    }

    #updateCodeReference (i: number, ev: InputEvent) {
        // @ts-expect-error `path` doesn't seem to exist
        const targetElem = ev.path.find((elem: HTMLElement) => (
            elem.tagName && elem.tagName.toLocaleLowerCase() === 'vscode-text-area'
        ))

        if (!targetElem) {
            return
        }

        this.#codeSelection[i].comment = targetElem.value
        updateState(this.#client, { codeSelection: this.#codeSelection })
    }

    renderFooter() {
        return html/* html */`
        <footer>
            💡 For feedback or bug reports, visit <vscode-link href="${GITHUB_URL}"><b>stateful/vscode-issue-explorer</b></vscode-link>
        </footer>`
    }

    renderWelcomeView() {
        return html/* html */`
        <div class="content">
            <h2>GitHub Issue Explorer</h2>
            <p>
                The <vscode-link href="${MARKETPLACE_URL}">GitHub Issue Explorer</vscode-link>
                allows you to quickly create GitHub issues while working on your code. Just select
                one or multiple lines, do a right click and pick <i>Create Issue From Selection</i>.
            </p>
            <p>
                <b>Note:</b> make sure you are working in a project that has <code>git</code>
                as version control system!
            </p>
            <vscode-link href="command:issue-explorer.getStarted">→ Open Walkthrough</vscode-link>
            ${this.renderFooter()}
        </div>`
    }

    renderForm () {
        return html/*html*/`<form class="createIssueForm">
            <h2>Create Code Issue</h2>
            <p>
                <vscode-text-field name="title">Issue Title</vscode-text-field>
            </p>
            <p>
                <vscode-text-area
                    name="description"
                    rows=${10}
                >
                    Issue Description
                </vscode-text-area>
            </p>
            <p class="btnSection">
                <vscode-button @click=${this.#cancel.bind(this)} appearance="secondary">Cancel</vscode-button>
                <vscode-button @click=${this.#submit.bind(this)} ?disabled=${this.#requestPending}>
                    Submit
                    ${this.#requestPending && html`<span slot="start" class="codicon codicon-loading"></span>` || ''}
                </vscode-button>
            </p>
            <vscode-divider></vscode-divider>
            <h4>Selected Code Lines</h4>
            <ul class="codeSelection">
                ${this.#codeSelection.map((selection, i) => html/*html*/`
                <li>
                    <button
                        title="Remove Code Reference"
                        @click=${(e: CustomEvent) => {
                            e.preventDefault()
                            this.#removeCodeReference(i)
                        }}
                        class='codicon codicon-close'
                    ></button>
                    <div>
                        <vscode-link @click=${() => this.#client.emit('openCodeReference', selection)}>
                            ${shrinkPath(selection.uri, 30)}
                        </vscode-link>
                        <sub>${
                            selection.start === selection.end
                            ? html/*html*/`<b>Line:</b> ${selection.start + 1}</sub>`
                            : html/*html*/`<b>Lines:</b> ${selection.start + 1} - ${selection.end + 1}</sub>`
                        }
                        ${when(
                            typeof selection.comment === 'string',
                            () => html/*html*/`
                            <vscode-text-area
                                @input=${(ev: InputEvent) => this.#updateCodeReference(i, ev)}
                                name="codeReferenceComment"
                                data-item=${i}
                                rows=${3}
                                value=${selection.comment}
                            ></vscode-text-area>`
                        )}
                    </div>
                    <button
                        title="Add Comment to Code Reference"
                        @click=${(e: CustomEvent) => {
                            e.preventDefault()
                            this.#addCodeReferenceComment(i)
                        }}
                        class='codicon codicon-edit'
                    ></button>
                </li>
                `)}
            </ul>
            ${this.renderFooter()}
        </form>`
    }

    renderSuccess (result: CreateIssueResult) {
        return html/*html*/`
        <p>
            <span class='codicon codicon-check'></span>
            Issue successfully created 🎉
        </p>
        <p>
            <b><vscode-link href="${result.issueUrl}">${result.issueLabel}</vscode-link></b>
            <sub>by <vscode-link href="${result.authorUrl}"><b>${result.authorLabel}</b></vscode-link></sub>
        </p>
        `
    }

    renderError (error: string) {
        return html/*html*/`<p class="errorMessage">
            <span class='codicon codicon-error'></span>
            <b>${error}</b>
        </p>`
    }

    #initIssueForm(codeSelection: CodeSelection[]) {
        this.#error = undefined
        this.#result = undefined
        this.#requestPending = false
        this.#codeSelection = codeSelection

        updateState(this.#client, { codeSelection })
        this.requestUpdate()
    }

    async #renderResult(result: CreateIssueResponse) {
        this.#requestPending = false

        const { error } = result as CreateIssueError
        if (error) {
            this.#error = error
            return this.requestUpdate()
        }

        const form = this.shadowRoot?.querySelector('.createIssueForm')
        if (!form) {
            return
        }

        form.className += ' hidden'
        await new Promise((resolve) => setTimeout(resolve, 200))
        form.remove()
        this.#error = undefined
        this.#result = result as CreateIssueResult

        // clear `codeSelection` and update state
        return this.#cancel()
    }
}
