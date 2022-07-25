import { test, expect, vi } from 'vitest'
import { vscode } from '../../../src/components/constants'
import { updateState } from '../../../src/components/utils'

vi.mock('../../../src/components/constants', () => ({
    vscode: {
        getState: vi.fn().mockReturnValue({ foo: 'bar' }),
        setState: vi.fn()
    }
}))

test('updateState', () => {
    const client: any = { emit: vi.fn() }
    updateState(client, { bar: 'foo' } as any)

    const newState = { bar: 'foo', foo: 'bar' }
    expect(client.emit).toBeCalledWith('stateUpdate', newState)
    expect(vscode.setState).toBeCalledWith(newState)
})
