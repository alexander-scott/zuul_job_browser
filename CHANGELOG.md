# Change Log

All notable changes to the "zuulplugin" extension will be documented in this file.

## [0.3.0]

- Added the ability to jump to the definition of an ansible variable.

## [0.2.9]

- Serialise the parsed job hierarchy to a disk/cache and read from this cache instead of re-parsing the file.
- The cached files will be reparsed if the modification date of the file is later than the one in the cache.

## [0.2.8]

- More accurately determine the location of attributes

## [0.2.2]

- Added a logger that outputs text to an output channel

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
