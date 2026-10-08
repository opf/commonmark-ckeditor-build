# Changesets

Every pull request that changes the published build needs a changeset:

    npm run changeset

Pick patch, minor or major and write one line for the changelog. Commit the
generated file with your change. Pull requests that do not affect the build
get the label `skip changeset` instead.

See the "Releasing" section of the README for what happens next.
