# Install [Rain][rain] action

![Release version][badge_release_version]
[![Build Status][badge_build]][link_build]
[![License][badge_license]][link_license]

> [!WARNING]
> **This action is deprecated.** AWS archived Rain on 2026-07-29, and Rain gets no more releases. This action continues to install Rain, so your workflows do not break. But it shows a warning on each run.
>
> Use [awesome-foundation/install-cfnrain](https://github.com/awesome-foundation/install-cfnrain) in its place. It installs [cfnrain](https://github.com/awesome-foundation/cfnrain), the community fork of Rain, and it verifies the download. Change the step:
>
> ```yaml
> - uses: awesome-foundation/install-cfnrain@v1
>   with:
>     rain-alias: true # scripts that call rain keep working
> ```

This action installs [Rain][rain] (AWS CloudFormation development toolkit) as a binary file into your workflow. It can be run on **Linux** (`ubuntu-latest`), **macOS** (`macos-latest`) or **Windows** (`windows-latest`).

- Rain releases page: <https://github.com/aws-cloudformation/rain/releases>

Additionally, this action uses the GitHub **caching mechanism** to speed up your workflow execution time!

## Usage

```yaml
jobs:
  install-rain:
    runs-on: ubuntu-latest
    steps:
      - uses: allixsenos/install-rain@v1
        #with:
        #  version: 1.24.2 # `latest` by default, but you can set a specific version to install

      - run: rain --version # any rain command can be executed
```

## Customizing

### Inputs

The following inputs can be used as `step.with` keys:

| Name      |   Type   | Default  | Required | Description          |
|-----------|:--------:|:--------:|:--------:|----------------------|
| `version` | `string` | `latest` |    no    | Rain version to install |

### Outputs

| Name       |   Type   | Description                |
|------------|:--------:|----------------------------|
| `rain-bin` | `string` | Path to the Rain binary file |

## Releasing

[release-please](https://github.com/googleapis/release-please) makes the releases. It reads the [Conventional Commits](https://www.conventionalcommits.org/) on `master`:

- `feat:` makes a minor release, and `fix:` makes a patch release.
- Dependabot uses `fix(deps):` for production dependencies, because they ship inside `dist/`. Development dependencies use `build(deps):` and do not make a release.
- Other types (`build:`, `ci:`, `docs:`, `refactor:`, `chore:`) do not make a release.

To release a new version:

1. Commit the source changes and the rebuilt `dist/` directory to `master`. The `dist/` directory is important, because the action runs from it.
2. release-please opens or updates a release PR with the version bump and the `CHANGELOG.md` entry.
3. Merge the release PR. release-please creates the `vX.Y.Z` tag and the GitHub release. The same workflow then moves the major and minor git tags (`v1` and `v1.2` for a `v1.2.Z` release).

To force a version, add a `Release-As: X.Y.Z` footer to a commit on `master`.

> [!TIP]
> Use [Dependabot](https://bit.ly/45zwLL1) to keep this action updated in your repository.

## Support

[![Issues][badge_issues]][link_issues]
[![Pull Requests][badge_pulls]][link_pulls]

If you find any errors in the action, please [create an issue][link_create_issue] in this repository.

## Acknowledgements

This action is based on [gacts/install-dnscontrol](https://github.com/gacts/install-dnscontrol), which provided the foundation and inspiration for this project. Thank you to the original authors for their excellent work!

## License

This is open-source software licensed under the [MIT License][link_license].

[badge_build]:https://img.shields.io/github/actions/workflow/status/allixsenos/install-rain/tests.yml?branch=master&maxAge=30
[badge_release_version]:https://img.shields.io/github/release/allixsenos/install-rain.svg?maxAge=30
[badge_license]:https://img.shields.io/github/license/allixsenos/install-rain.svg?longCache=true
[badge_release_date]:https://img.shields.io/github/release-date/allixsenos/install-rain.svg?maxAge=180
[badge_commits_since_release]:https://img.shields.io/github/commits-since/allixsenos/install-rain/latest.svg?maxAge=45
[badge_issues]:https://img.shields.io/github/issues/allixsenos/install-rain.svg?maxAge=45
[badge_pulls]:https://img.shields.io/github/issues-pr/allixsenos/install-rain.svg?maxAge=45

[link_build]:https://github.com/allixsenos/install-rain/actions
[link_license]:https://github.com/allixsenos/install-rain/blob/master/LICENSE
[link_issues]:https://github.com/allixsenos/install-rain/issues
[link_create_issue]:https://github.com/allixsenos/install-rain/issues/new
[link_pulls]:https://github.com/allixsenos/install-rain/pulls

[rain]:https://github.com/aws-cloudformation/rain
