# Change Log

All notable changes to the "zuulplugin" extension will be documented in this file.

## [0.2.1]

- Job attributes and project-template attributes now have accurate locations in vscode space.
- Added the ability to rename job-names in a single click.

## [0.2.0]

- Fixed parsing some yaml files by creating a schema that recognises wierd tags

## [0.1.9]

- Add the ability to jump to playbook definition from a job.
- Use yaml.Load instead of yaml.safeLoad

## [0.1.8]

- Big code refactor.
- Majority of parsing now done using `js-yaml` third party plugin
- Started adding some tests.

## [0.1.4]

- Warning fix: Add document scheme to extension as mentioned [here](https://code.visualstudio.com/api/references/document-selector#document-scheme).

## [0.1.3]

- Bug fix: Parse jobs properly which have multi-line attributes and empty lines.

## [0.1.2]

- Bug fix: Parse all workspace folders.

## [0.1.1]

- Initial release
