import {
    html,
    css,
    unsafeCSS,
    CSSResult,
    LitElement,
    customElement
} from 'lit-element'
import Channel from 'tangle/webviews'
import type { Client } from 'tangle'

import { vscode, config, codiconCSSRules } from './constants'
import { issueCreateChannel } from '../constants'
import { shrinkPath } from './third_party/shring-path'
import type { CodeSelection } from '../types'
import type { WebviewEvents } from '../webviews/issueCreate'

const MARKETPLACE_URL = 'https://marketplace.visualstudio.com/items?itemName=stateful.marquee'

@customElement('issue-create')
export class IssueCreateForm extends LitElement {
    #client: Client<WebviewEvents>
    #codeSelection: CodeSelection[] = []
    #requestPending = false

    static get styles(): CSSResult[] {
        return [css/*css*/`
        vscode-radio-group {
            margin: 10px 0
        }

        a {
            color: #F52558
        }

        sub {
            display: block;
            margin-top: 5px;
        }

        img, vscode-text-field, vscode-text-area {
            width: 100%
        }

        .btnSection {
            display: flex;
            flex-direction: row;
            justify-content: flex-end;
            gap: 10px;
        }

        .codeSelection {
            padding-inline-start: 25px;
        }

        .codeSelection li {
            margin-bottom: 15px;
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

        const channel = new Channel<WebviewEvents>(issueCreateChannel)
        this.#client = channel.attach(vscode as any)
        this.#client.on('initIssueForm', this._initIssueForm.bind(this))
    }

    render() {
        if (!this.#codeSelection || this.#codeSelection.length === 0) {
            return this.renderWelcomeView()
        }

        return html/* html */`
        <h3>Create Code Issue</h3>
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
            <vscode-button @click=${() => this.#cancel()} appearance="secondary">Cancel</vscode-button>
            <vscode-button @click=${() => this.#submit()} ?disabled=${this.#requestPending}>
                Submit
                ${this.#requestPending && html`<span slot="start" class="codicon codicon-loading"></span>` || ''}
            </vscode-button>
        </p>
        <vscode-divider></vscode-divider>
        <h4>Selected Code Lines</h4>
        <ul class="codeSelection">
            ${this.#codeSelection.map((selection) => html/*html*/`
            <li>
                ${shrinkPath(selection.uri.path, 50)}
                <sub>${
                    selection.start === selection.end
                    ? html/*html*/`<b>Line:</b> ${selection.start + 1}</sub>`
                    : html/*html*/`<b>Lines:</b> ${selection.start + 1} - ${selection.end + 1}</sub>`
                }
            </li>
            `)}
        </ul>
        `
    }

    #cancel () {
        this.#requestPending = false
        this.#codeSelection = []
        this.requestUpdate()
    }

    #submit () {
        this.#requestPending = true
        this.requestUpdate()
    }

    renderWelcomeView() {
        return html/* html */`
        <h3>GitHub Issue Explorer</h3>
        <p>
            The <a href="${MARKETPLACE_URL}">GitHub Issue Explorer</a>
            allows you to quickly create GitHub issues while working on
            your code. Just select a line or multiple lines, do right
            click and pick <i>Create Issue From Selection</i>, e.g.:
        </p>
        <img src="${config.baseAppUri}/assets/img/demo.gif" />
        <p>
            Then fill out the issue form, press submit and done!
        </p>
        `
    }

    private _initIssueForm(codeSelection: CodeSelection[]) {
        this.#codeSelection = codeSelection
        this.requestUpdate()
    }
}
