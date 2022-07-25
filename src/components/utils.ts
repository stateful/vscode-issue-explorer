import type { Client } from 'tangle'

import { vscode } from './constants'
import type { WebViewState } from '../types'
import type { WebviewEvents } from '../webviews/issueCreate'

export const updateState = (client: Client<WebviewEvents>, stateChange: Partial<WebViewState>) => {
    const currentState: WebViewState = vscode.getState() || <WebViewState>{}
    const newState: WebViewState = { ...currentState, ...stateChange }
    vscode.setState(newState)
    return client.emit('stateUpdate', newState)
}
