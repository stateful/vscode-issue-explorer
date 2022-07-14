import {
    html,
    css,
    CSSResult,
    LitElement,
    customElement
} from 'lit-element'
import Channel from 'tangle/webviews'
import type { Client } from 'tangle'

import { vscode } from './constants'
import { extensionName } from '../constants'

interface State {}

@customElement('issue-create')
export class IssueCreateForm extends LitElement {
    private _client: Client<State>
    private _state: State = {}

    static get styles(): CSSResult {
        return css/*css*/`
        vscode-radio-group {
            margin: 10px 0
        }
        `
    }

    constructor () {
        super()

        const channel = new Channel<State>(extensionName, this._state)
        this._client = channel.attach(vscode as any)
    }

    render() {
        return html/* html */`
        <h1>Hello World</h1>
        `
    }

    private _setState (name: keyof State, state: boolean) {
        // this._state[name] = state
        this.requestUpdate()
    }
}
