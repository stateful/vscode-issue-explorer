import {
    html,
    css,
    CSSResult,
    LitElement,
    customElement
} from 'lit-element'
import Channel from 'tangle/webviews'
import type { Client } from 'tangle'

import { vscode, config } from './constants'
import { issueCreateChannel } from '../constants'
import type { CodeSelection } from '../types'
import type { WebviewEvents } from '../webviews/issueCreate'

const MARKETPLACE_URL = 'https://marketplace.visualstudio.com/items?itemName=stateful.marquee'

@customElement('issue-create')
export class IssueCreateForm extends LitElement {
    private _client: Client<WebviewEvents>
    private _codeSelection?: CodeSelection[]

    static get styles(): CSSResult {
        return css/*css*/`
        vscode-radio-group {
            margin: 10px 0
        }

        a {
            color: #F52558
        }

        img, vscode-text-field, vscode-text-area {
            width: 100%
        }
        `
    }

    constructor() {
        super()

        const channel = new Channel<WebviewEvents>(issueCreateChannel)
        this._client = channel.attach(vscode as any)
        this._client.on('initIssueForm', this._initIssueForm.bind(this))
    }

    render() {
        if (!this._codeSelection) {
            return this.renderWelcomeView()
        }

        return html/* html */`
        <h3>Create Code Issue</h3>
        <p>
            <vscode-text-field name="title">Issue Title</vscode-text-field>
        </p>
        <p>
            <vscode-text-area name="description">Issue Description</vscode-text-area>
        </p>
        `
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
        this._codeSelection = codeSelection
        this.requestUpdate()
    }
}
