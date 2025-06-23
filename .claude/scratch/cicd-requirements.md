# CI\CD Pipeline design

I want to establish a robust ci\cd pipeline for SlideHeroes.

We currently use github, github actions, vercel, husky for pre-commit hooks, vitest for unit tests, playwright for UI tests, new relic for monitoring, and pino for logging. I want to build on top of those technologies.

## Requirements

- setup main (production), staging, and dev branches.
- a staging environment in vercel.
- clear phases for the ci\cd pipeline.
- align biome linting and formatting rules between local and ci\cd environments
- eventually use sonarqube and snyk
- have somesort of gating system that is part of our phases
- add yaml linting (yaml-lint)
- add markdown formating (markdownlint?)

I want to be able to run the following checks:

1. Linting
2. Type checking
3. Unit tests
4. Integration tests
5. End-to-end tests
6. Accessibility tests
7. Security tests
8. Performance tests
9. UI tests using playwright

## Lack of clarity in my mind

1. When should we run what tests?
2. How to use a PR request
3. Should all tests be run locally before pushing to github?
4. How do we / should we be leveraging logging?
5. I am not sure what these types of checks are and if we should run them:
   1. Bundle size tests
   2. Bundle budget tests
   3. Bundle analysis
   4. Bundle visualization
   5. Bundle optimization
   6. Bundle minification
6. Should we use something like CodeCov for code coverage?
7. Should we use something like TruffleHog OSS for security scanning?
8. Should we use something like <https://github.com/marketplace/actions/cache> to improve pipeline performance

## I don't know what I don't know

I want you to provide a recommendation on a slideheroes ci\cd pipeline based on best practices and the context of the slideheroes repo. Layout the overall design first. Make recommendations of tools and specific actions
