import {
    html,
    css,
    state,
    CSSResult,
    property,
    LitElement,
    customElement
} from 'lit-element'
import { when } from 'lit/directives/when.js'
import { config } from './constants'

@customElement('extension-tutorial')
export class ExtensionTutorialComponent extends LitElement {
    @property({ type: String })
    baseUri: string = ''

    @state()
    protected _isOpen = false

    static get styles(): CSSResult {
        return css/*css*/`
        .tutorial {
            transition: opacity .2s ease-out;
            display: none;
            opacity: 0;
            margin-bottom: 15px;
        }
        .tutorial.open {
            display: block;
            opacity: 1;
        }
        .footer-link:before {
            content: '→';
        }
        .footer-link.open:before {
            content: '✗';
        }
        img {
            width: 100%;
        }
        `
    }

    render () {
        const linkLabel = this._isOpen ? 'Close Tutorial' : 'Open Tutorial'
        return html/*html*/`
        <p>
            <vscode-link
                class="footer-link${when(this._isOpen, () => ' open')}"
                @click=${this.toggleTutorial.bind(this)}
            >
                ${linkLabel}
            </vscode-link>
        </p>
        <div class="tutorial${when(this._isOpen, () => ' open')}">
            <img src="${config.baseAppUri}/assets/img/select.gif" style="max-width: 594px" />
            <p>
                Then fill out the issue form and connect for code references if desired.
            </p>
            <img src="${config.baseAppUri}/assets/img/describe.gif" style="max-width: 269px" />
            <p>
                You can comment on individual code references to document
                what this piece of code is about and what changes you'ld expect.
            </p>
            <img src="${config.baseAppUri}/assets/img/details.gif" style="max-width: 269px" />
            <p>
                Lastly, click on submit and review your issue on GitHub:
            </p>
            <img src="${config.baseAppUri}/assets/img/view.gif" style="max-width: 717px" />
            <p>
                Or explore created issues within VS Code:
            </p>
            <img src="${config.baseAppUri}/assets/img/explore.gif" style="max-width: 671px" />
        </div>
        `
    }

    toggleTutorial () {
        this._isOpen = !this._isOpen
    }
}
