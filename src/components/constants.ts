import type { ExtensionConfiguration } from '../types'

export const vscode = acquireVsCodeApi()

const configDataProperty = 'data-extension-configuration'
export const config: ExtensionConfiguration = JSON.parse(
    document.querySelector(`meta[${configDataProperty}]`)?.getAttribute(configDataProperty) as string
)

const codiconStyleSheet: CSSStyleSheet = []
    .slice.call(document.styleSheets)
    .find((file: any) => file.href && file.href.endsWith('codicon.css'))!
export const codiconCSSRules: string[] = [].slice.call(codiconStyleSheet.cssRules).map((r: CSSFontFaceRule) => r.cssText)
