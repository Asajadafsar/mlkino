# User-defined commands

When the user sends `/bz`, run the production build with `npm run build`.
Only after a successful build, create `build/build.zip` containing
the contents of `build/`, with `index.html` at the archive root (no enclosing
`build/` directory). Exclude the output ZIP itself from the archive. Verify the
ZIP archive and provide its download link.
Do not commit or publish the build artifacts unless the user requests it.

# Design requests

For UI/design requests, change frontend files only. Do not change backend code, APIs, models, migrations, or databases unless the user explicitly requests backend work. Use frontend demo data when backend support is unavailable.
