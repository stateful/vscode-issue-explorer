import type { Client } from 'tangle'

import { vscode } from './constants'
import type { WebViewState, WebviewEvents } from '../types'

export const updateState = (client: Client<WebviewEvents>, stateChange: Partial<WebViewState>) => {
    const currentState: WebViewState = vscode.getState() || <WebViewState>{}
    const newState: WebViewState = { ...currentState, ...stateChange }
    vscode.setState(newState)
    return client.emit('stateUpdate', newState)
}
