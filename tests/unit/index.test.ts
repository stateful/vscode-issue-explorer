import vscode from "vscode"
import telemetry from '../../src/telemetry'
import { activate, deactivate } from '../../src'
// @ts-expect-error
import { getLastInstance } from '../../src/controller/extension'
import { vi, test, expect } from "vitest"

vi.mock('../../src/controller/extension', () => {
    let lastInstance
    return {
        getLastInstance: () => lastInstance,
        default: class ExtensionControllerMock {
            activate = vi.fn()
            deactivate = vi.fn()
            constructor () {
                lastInstance = this
            }
        }
    }
})

vi.mock('../../src/telemetry', () => ({
    default: {
        sendTelemetryEvent: vi.fn()
    }
}))

test('can activate', async () => {
    await activate({} as any)
    expect(getLastInstance().activate).toBeCalledTimes(1)
    expect(telemetry.sendTelemetryEvent).toBeCalledWith('extensionActivated')
})

test('can deactivate', async () => {
    await deactivate()
    expect(getLastInstance().deactivate).toBeCalledTimes(1)
    expect(telemetry.sendTelemetryEvent).toBeCalledWith('extensionDeactivated')
})
