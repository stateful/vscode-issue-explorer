/**
 * @vitest-environment jsdom
 */
import { EventEmitter } from 'events'
import { test, expect, vi, beforeEach } from 'vitest'
import { fixture, assert } from '@open-wc/testing'
import { html } from 'lit'
import type { Link, TextField, TextArea, Button } from '@vscode/webview-ui-toolkit'
// @ts-expect-error mock feature
import { emitter } from 'tangle/webviews'

import { IssueCreateForm } from '../../../src/components/issueCreate'

vi.mock('tangle/webviews', () => {
    let emitter = new EventEmitter()
    const origEmit = emitter.emit.bind(emitter)
    emitter.emit = vi.fn().mockImplementation(origEmit)
    return {
        emitter,
        default: class TangleMock {
            public attach = vi.fn().mockReturnValue(emitter)
        }
    }
})

vi.mock('../../../src/components/constants', () => ({
    vscode: {
        getState: vi.fn().mockReturnValue({ foo: 'bar' }),
        setState: vi.fn()
    },
    config: {
        baseAppUri: '/foo/bar'
    },
    codiconCSSRules: []
}))

const EXAMPLE_SELECTION = {
    start: 1,
    end: 2,
    uri: '/foo/bar',
    fileType: 'js',
    code: 'console.log("foobar")'
}

const EXAMPLE_RESULT = {
    issueUrl: '/url/to/issue',
    issueLabel: 'some title',
    authorUrl: '/url/to/author',
    authorLabel: 'some author'
}

beforeEach(() => {
    vi.mocked(emitter.emit).mockClear()
})

test('is defined', () => {
    const el = document.createElement('issue-create')
    assert.instanceOf(el, IssueCreateForm)
})

test('renders as default the intro screen', async () => {
    const el = await fixture(html`<issue-create></issue-create>`)
    expect(el.shadowRoot!.innerHTML).toContain('<h2>GitHub Issue Explorer</h2>')
})

test('should switch to form once a selection was made', async () => {
    const el: IssueCreateForm = await fixture(html`<issue-create></issue-create>`)
    emitter.emit('initIssueForm', [EXAMPLE_SELECTION, EXAMPLE_SELECTION])
    await el.updateComplete
    expect(el.shadowRoot!.innerHTML).toContain('<h2>Create Code Issue</h2>')
    expect(el.shadowRoot!.querySelectorAll('.codeSelection li').length).toBe(2)

    const codeContent = el.shadowRoot!.querySelector('.codeSelection li')!.textContent?.trim()
    expect(codeContent).toContain('/foo/bar')
    expect(codeContent).toContain('Lines: 2 - 3')
})

test('cancel should lead back to start screen', async () => {
    const el: IssueCreateForm = await fixture(html`<issue-create></issue-create>`)
    emitter.emit('initIssueForm', [EXAMPLE_SELECTION, EXAMPLE_SELECTION])
    await el.updateComplete
    expect(el.shadowRoot!.innerHTML).toContain('<h2>Create Code Issue</h2>')
    ;(el.shadowRoot!.querySelector('vscode-button[appearance="secondary"]') as Link).click()
    await el.updateComplete
    expect(el.shadowRoot!.innerHTML).toContain('<h2>GitHub Issue Explorer</h2>')
})

test('renders error', async () => {
    const el: IssueCreateForm = await fixture(html`<issue-create></issue-create>`)
    emitter.emit('initIssueForm', [EXAMPLE_SELECTION, EXAMPLE_SELECTION])
    emitter.emit('issueCreateResult', { error: 'ups!' })
    await el.updateComplete
    expect(el.shadowRoot!.querySelector('.errorMessage b')!.textContent).toBe('ups!')
})

test('can remove code reference', async () => {
    const el: IssueCreateForm = await fixture(html`<issue-create></issue-create>`)
    emitter.emit('initIssueForm', [EXAMPLE_SELECTION, EXAMPLE_SELECTION])
    await el.updateComplete
    expect(el.shadowRoot!.querySelectorAll('.codeSelection li').length).toBe(2)
    ;(el.shadowRoot!.querySelector('button[title="Remove Code Reference"]') as Link).click()
    await el.updateComplete
    expect(el.shadowRoot!.querySelectorAll('.codeSelection li').length).toBe(1)
})

test('shows success message', async () => {
    const el: IssueCreateForm = await fixture(html`<issue-create></issue-create>`)
    emitter.emit('initIssueForm', [EXAMPLE_SELECTION, EXAMPLE_SELECTION])
    await el.updateComplete
    emitter.emit('issueCreateResult', EXAMPLE_RESULT)
    await new Promise((resolve) => setTimeout(resolve, 200))
    await el.updateComplete
    expect(el.shadowRoot!.innerHTML).toContain('Issue successfully created')
    expect([...el.shadowRoot!.querySelectorAll('vscode-link')].map((l) => l.textContent))
        .toEqual(['some title', 'some author'])
})

test('should be able to submit something', async () => {
    const el: IssueCreateForm = await fixture(html`<issue-create></issue-create>`)
    emitter.emit('initIssueForm', [EXAMPLE_SELECTION, EXAMPLE_SELECTION])
    await el.updateComplete
    ;([...el.shadowRoot!.querySelectorAll('vscode-text-area')]).forEach(
        ((elem: TextField, i) => { elem.value = `some text ${i}`}) as any)
    ;(el.shadowRoot!.querySelector('vscode-text-field') as TextArea).value = 'some long description'
    ;(el.shadowRoot!.querySelector('button[title="Add Comment to Code Reference"') as Button).click()
    ;(el.shadowRoot!.querySelectorAll('.btnSection vscode-button')[1] as Button).click()
    await el.updateComplete
    expect(emitter.emit.mock.calls.pop()).toMatchSnapshot()
})
