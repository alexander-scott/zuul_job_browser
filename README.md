# Zuul Job Browser - VSCode Plugin

## How do I install the plugin?

Install from this VSCode Extension Marketplace: https://marketplace.visualstudio.com/items?itemName=alexander-scott.zuulplugin. Requires VSCode version ^1.44.0.

To uninstall follow [these](https://code.visualstudio.com/docs/editor/extension-gallery#_uninstall-an-extension) instructions.

## How do I effectively use the plugin?

The best way to use this framework is by creating a multi-root workspace that has all the repositories/folders than contain your job definitions.
For help creating a multi-root workspace follow [this](https://code.visualstudio.com/docs/editor/multi-root-workspaces) link.
This plugin will scan all folders that are added to the workspace and link any defined jobs in any of the folders together.

![Multi-Root Workspace](https://github.com/Alexander-Scott/zuulplugin/blob/master/images/multi-root-workspace.png?raw=true)

After the jobs have been parsed you're good to go! To see the number of jobs that have been parsed, look to the bottom left of the window:

![Status Bar Job Count](https://github.com/Alexander-Scott/zuulplugin/blob/master/images/status_bar.png?raw=true)

## What does the plugin allow me to do?

### Jump to Job defintion

Further information [here](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-definition). It is currently implemented for:

- Jumping to a parent job definition in any file in the workspace (Ctrl+Click / F12).
- Jumping to a job definition from a project template.

![Jump to Job definition](https://github.com/Alexander-Scott/zuulplugin/blob/master/images/jump_to_definition.gif?raw=true)

### Jump to Playbook from usage

This allows you to jump to the playbook from it's usage in a Job (Ctrl+Click / F12).

![Jump to playbook definition](https://github.com/Alexander-Scott/zuulplugin/blob/master/images/jump_to_playbook.gif?raw=true)

### Show Job Definitions

Further information [here](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-symbol). This currently allows you to:

- See all job definitions in a file (Outline Window).
- Quick search amongst job names.
- Quick search amongst job names from all files in a workspace (Ctrl+T).
- Jump quickly between the definitions.

![Outline window](https://github.com/Alexander-Scott/zuulplugin/blob/master/images/outline_window.png?raw=true)

![Search symbols](https://github.com/Alexander-Scott/zuulplugin/blob/master/images/search_symbols.gif?raw=true)

### Show Job Hierarchy

Show the call hierarchy between parent and child jobs (Ctrl+Shift+H). This currently allows you to:

- See the outgoing call hierarchy: currnt job to parent job.
- See the incoming call hierarchy: current job to child jobs.

![Job Hierarchy](https://github.com/Alexander-Scott/zuulplugin/blob/master/images/job_hierarchy.png?raw=true)

### Show all Job References

Further information [here](https://code.visualstudio.com/docs/editor/editingevolved#_peek). This currently allows you to:

- See all jobs that reference this job as a parent in any file in the workspace (Shift+Alt+F12).
- Peek at these jobs.
- Show jobs referenced in project templates.

![Find references](https://github.com/Alexander-Scott/zuulplugin/blob/master/images/find_references.gif?raw=true)

### Show Job Variables on hover

Hovers show information about the job that's below the mouse cursor. This currently allows you to see:

- The variables of the job and all parents job.
- Child jobs overwrite the variables of parent jobs.
- These variables can also be seen in project templates.

![Hover](https://github.com/Alexander-Scott/zuulplugin/blob/master/images/hover.gif?raw=true)

### Renaming all instances of a job with a single click

Further information [here](https://code.visualstudio.com/docs/editor/refactoring#_rename-symbol). This using this feature renames the job in the following places:

- The name attribute in the main job definition.
- All instances of this job being referenced from child jobs (through the parent attribute).
- ALl instances of this job in all project templates.

![Rename job](https://github.com/Alexander-Scott/zuulplugin/blob/master/images/rename_job.gif?raw=true)

## How does it work?

All yaml files in the Zuul.d folder are parsed to find jobs and job attributes. This light weight job hierarchy is then stored in memory and fetched when needed.
There are also file watchers present to see when a valid file is Saved, Created and Deleted.

## Future Features

- Show errors and warnings -> Duplicated job names, modifying jobs marked as final, running jobs marked as abstract.
- Code completion -> Auto complete variable names and job names
