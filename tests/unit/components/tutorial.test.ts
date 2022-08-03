/**
 * @vitest-environment jsdom
 */
import { test, expect, vi } from 'vitest'
import { fixture, assert } from '@open-wc/testing'
import { html } from 'lit'
import type { Link } from '@vscode/webview-ui-toolkit'

import { ExtensionTutorialComponent } from '../../../src/components/tutorial'

vi.mock('../../../src/components/constants', () => ({
    vscode: {
        getState: vi.fn().mockReturnValue({ foo: 'bar' }),
        setState: vi.fn()
    },
    config: {
        baseAppUri: '/foo/bar'
    }
}))

test('is defined', () => {
    const el = document.createElement('extension-tutorial')
    assert.instanceOf(el, ExtensionTutorialComponent)
})

test('is not open by default', async () => {
    const el = await fixture(html`<extension-tutorial></extension-tutorial>`)
    expect(el.shadowRoot!.querySelector('.tutorial')?.getAttribute('class'))
        .not.toContain('open')
})

test('should open tutorial', async () => {
    const el: ExtensionTutorialComponent = await fixture(html`<extension-tutorial></extension-tutorial>`)
    ;(el.shadowRoot!.querySelector('.footer-link') as Link).click()
    await el.updateComplete
    expect(el.shadowRoot!.querySelector('.tutorial')?.getAttribute('class'))
        .toContain('open')
})
