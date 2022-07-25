import type { ViewControl } from 'wdio-vscode-service'

describe('Issue Explorer', () => {
    let issueExplorterVC: ViewControl

    describe('extension', () => {
        before(async () => {
            const workbench = await browser.getWorkbench()
            const activityBar = await workbench.getActivityBar()
            await browser.waitUntil(async () => (
                Boolean(await activityBar.getViewControl('Issue Explorer')))
            )
            issueExplorterVC = await activityBar.getViewControl('Issue Explorer') as ViewControl
        })

        it('should show Issue Explorer Icon in Activity Bar', async () => {
            expect(await issueExplorterVC.getTitle()).toBe('Issue Explorer')
        })
    })
})
