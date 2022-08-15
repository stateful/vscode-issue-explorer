<p align="center">
    <img alt="VS Code Issue Explorer" src="assets/logo.jpg" width="100%">
</p>

<h1 align="center">VS Code Issue Explorer</h1>

<p align="center">
    <a href="https://github.com/stateful/vscode-issue-explorer/actions/workflows/tests.yaml">
        <img alt="Tests" src="https://github.com/stateful/vscode-issue-explorer/actions/workflows/tests.yaml/badge.svg">
    </a>
    <img alt="VS Code Version" src="https://vsmarketplacebadge.apphb.com/version/stateful.issue-explorer.svg">
    <img alt="Number of Installs" src="https://vsmarketplacebadge.apphb.com/installs/stateful.issue-explorer.svg">
    <img alt="Average Rating" src="https://vsmarketplacebadge.apphb.com/rating/stateful.issue-explorer.svg">
    <img alt="License" src="https://img.shields.io/github/license/stateful/vscode-issue-explorer.svg">
</p>

### Create and explore code issues directly within VS Code and help to provide missing context in your issues through code references.

A lot of issues that are created in a project are missing contextual information that help folks to better understand where the problems are located and what needs to be done to resolve an issue. With this extension to can __create better issue descriptions through code references__ and allow your contributor to __better explore these issues rigth within VS Code__.

<p align="center" style="padding: 20px 0">
  <a href="https://marketplace.visualstudio.com/items?itemName=stateful.issue-explorer&ssr=false#overview">
    <img src="https://img.shields.io/badge/Install-VSCode%20Marketplace-blue" />
  </a>
</p>

![Demo](./assets/demo.gif)

# Install from inside VS Code

1. Press `F1` or `⌘ + Shift + P` and type `install`.
1. Pick `Extensions: Install Extension`.
1. Type `issue-explorer` and hit `enter`.
1. Restart Visual Studio Code.
1. Enter your name, create todos and be happy.

# Features

- Create issues on GitHub that are connected to one or multiple code sections
- comment on individual code sections connected to an issue to provide individual context
- explore issues that are connected to specific code sections within VS Code
- [_more features to come_](https://github.com/stateful/vscode-issue-explorer/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)

# Usage

1. [Install](https://marketplace.visualstudio.com/items?itemName=stateful.issue-explorer&ssr=false#overview) this extension
1. Select a piece of code or multiple lines
1. Do a right click and select _"Create Issue From Selection"_
1. Add more code sections following step 2 and 3
1. Fill out issue form and provide individual comments to specific code sections
1. Press submit and review issue on GitHub

# Contribute

We appreicate your help!

To build the extension locally, clone this repository and run the following steps:

1. Open this folder in VS Code
1. Run `yarn install`
1. Press `F5` or run `Build & Run Extension`

After making changes to the extension you can use the restart button in the VSCode debug menu, this makes a new build and reloads the client.

# More

- For support or questions, you can [join our discord server](https://discord.gg/BQm8zRCBUY)
- Our privacy policy is available at [https://www.stateful.com/privacy](https://www.stateful.com/privacy).

---

<p align="center"><small>Copyright 2022 © <a href="http://stateful.com/">Stateful</a> – MIT License</small></p>
