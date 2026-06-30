# Teko Monorepo Architecture Rules

- **Strict Version Alignment:** Always respect the monorepo architecture. 
- **React Constraints:** All packages MUST use `react@19.1.4` and `react-dom@19.1.4`. Do NOT install any package that forces a downgrade or overrides these versions.
- **Expo SDK Constraints:** The `apps/mobile` workspace currently runs on **SDK 54.0.0**, despite the web or other workspaces running on newer versions (e.g., SDK 56). Always use the exact SDK 54 compatible versions for any mobile native modules (e.g., using `npx expo install <package>` from the mobile directory, while taking care not to break the global npm lockfile).
- **Workspace Commands:** Never run standalone `npm install` inside the `apps/web` or `apps/mobile` subdirectories. Use the root workspace directory with the `-w` flag (e.g., `npm install <package> -w apps/mobile`).

- **Minimal Dependencies:** Never install unnecessary frameworks or libraries just for aesthetic purposes (e.g., blur effects). Always prefer native CSS/styling capabilities of React and React Native over bloating the project with new dependencies.
