# Contributing to OLED GUI Editor

Thanks for considering a contribution! This editor exists to make embedded UI design less tedious — every adapter, driver, and bug fix helps the next person targeting an OLED screen.

## How You Can Help

- **Report bugs** with a minimal repro using the [bug template](.github/ISSUE_TEMPLATE/bug_report.yml).
- **Propose features** (new drivers, fonts, MCU back-ends) with a [feature request](.github/ISSUE_TEMPLATE/feature_request.yml).
- **Add a new OLED driver** — see *Adding a Driver* below.
- **Improve generated code quality** — open a PR with before/after snippets so reviewers can see the diff.

## Development Setup

```bash
git clone https://github.com/dignifnrfb/oled-gui-editor.git
cd oled-gui-editor
npm install
npm run electron:dev   # Electron + Vite hot reload
```

For browser-only preview without Electron:

```bash
npm run dev
```

Build the desktop installer:

```bash
npm run electron:build
```

Tested with Node.js 18+ on Windows, macOS, and Linux.

## Project Layout

```
oled-gui-editor/
├── electron/            # Electron main + preload
├── src/                 # Vue 3 renderer (editor canvas, sidebar, code-gen)
├── screenshots/         # README assets
├── package.json
├── tsconfig*.json
└── vite.config.ts
```

The renderer is structured around three concerns: **canvas rendering** (Konva.js), **document state** (Pinia store), and **code generation** (driver-specific templates that consume the document model).

## Style & Conventions

- **TypeScript strict** is on; please don't relax it. Add proper types instead of `any`.
- **Vue 3 `<script setup>`** for new components.
- **Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`) for commit messages.
- **Generated C code** must compile under `-Wall -Wextra` on `arm-none-eabi-gcc 12+`.

## Adding a Driver

1. Add the driver descriptor under `src/drivers/<driver>.ts` (init sequence, page/column addressing, supported resolutions).
2. Register it in the driver index so it appears in *Project Settings → Driver*.
3. If the driver needs a non-standard interface, extend `src/drivers/interface.ts`.
4. Add a corresponding code-generation template at `src/codegen/templates/<driver>.ts`.
5. Manually verify generated output compiles for at least one MCU you have on hand. Attach the test setup to your PR.

## Pull Request Checklist

- [ ] `npm run build` completes without errors
- [ ] No new TypeScript or ESLint warnings introduced
- [ ] If a new driver/interface was added, generated code compiles cleanly
- [ ] If user-facing strings changed, both `README.md` and `README_CN.md` are updated
- [ ] Screenshots updated in `screenshots/` if the UI changed materially

## Reporting a Vulnerability

For security issues please open a private security advisory via *Security → Report a vulnerability* on this repo, or contact the maintainer through their GitHub profile. Don't disclose vulnerabilities in public issues.

## License

By contributing you agree your work is licensed under the [MIT License](LICENSE).
