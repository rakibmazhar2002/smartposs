# GitHub workflow

SmartPOS uses protected `main` deployments and Conventional Commits. Keep feature work in short-lived branches and open a pull request using `.github/pull_request_template.md`.

## Commit prefixes

- `feat:` — new product behavior
- `fix:` — defect correction
- `db:` — migration or index change
- `refactor:` — structure without behavior change
- `chore:` — tooling, docs, and maintenance

## CI behavior

`deploy-pages.yml` runs when frontend files change on `main`, then typechecks, lints, tests, builds, and deploys `dist` to Pages. `deploy-worker.yml` runs for Worker, migration, and Wrangler changes, performs the same checks, applies remote D1 migrations, writes the protected JWT secret, and deploys the production Worker.

`deploy-frontend.yml` is a manually callable frontend workflow for operators who need to re-publish the Pages artifact without changing the Worker.

## Secret hygiene

Keep `.env` and `.dev.vars` local. GitHub Actions consumes secrets through `${{ secrets.* }}` and exposes no credential value in source. Review workflow logs after adding a new command to ensure it does not echo a secret or full command line.

## Pull request checklist

Every schema or route change should explicitly describe tenant and branch isolation, migration impact, permissions, tests, and deployment variables. A PR is not ready to merge until `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` pass locally.
