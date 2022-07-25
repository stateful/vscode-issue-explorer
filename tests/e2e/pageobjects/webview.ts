import { PageDecorator, IPageDecorator, BasePage } from 'wdio-vscode-service'
import * as locatorMap from './locators'
import { webview as webviewLocators } from './locators'

export interface Webview extends IPageDecorator<typeof webviewLocators> { }
@PageDecorator(webviewLocators)
export class Webview extends BasePage<typeof webviewLocators, typeof locatorMap> {
  /**
   * @private locator key to identify locator map (see locators.ts)
   */
  public locatorKey = 'webview' as const
}
