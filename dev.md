# Release Instructions

### Release process

Follow these steps to create a new release of the web app, [Deepsyence](https://github.com/iishiishii/deepsyence).

1. Create a new release on GitHub as `pre-release`. Set the release `tag` to the value of target application version and prefix it with `v` (for example `v1.0.0` for Deepsyence version `1.0.0`). Enter release title and release notes. Release needs to stay as `pre-release` for GitHub Actions to be able to attach installers to the release.

2. Make sure that application is building, installing and running properly.

3. In the main branch, create a branch preferably with the name `release-v<new-version>`.

4. Change the version in package.json file. This is necessary for GitHub Actions to be able to attach installers to the release. (for example `"version": "1.0.0"`).

5. GitHub Actions will upload the built assets to GH Page only if a release of type `pre-release` with tag matching the Deepsyence's version with a `v` prefix is found. For example, if the Deepsyence version in the PR is `1.0.0`, the installers will be uploaded to a release that is flagged as `pre-release` and has a tag `v1.0.0`. New commits to this branch will overwrite the installer assets of the release.

6. Once all the changes are complete, and installers are uploaded to the release then publish the release.

### Upload ONNX model and preprocessing.json to Nectar
