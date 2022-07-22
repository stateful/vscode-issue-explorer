import vscode from 'vscode'

export const GUTTER_ICON = vscode.Uri.parse(
    `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 18 18'><rect fill='rgb(${[255, 0, 0].join(',',)})' x='15' y='0' width='3' height='18'/></svg>`,
    )}`
)

export const EDITOR_DECORATION_OPTION = vscode.window.createTextEditorDecorationType({
    isWholeLine: true,
    backgroundColor: 'rgba(255, 0, 0, .2)',
    gutterIconPath: GUTTER_ICON,
    gutterIconSize: 'contain',
    overviewRulerLane: vscode.OverviewRulerLane.Left,
})
