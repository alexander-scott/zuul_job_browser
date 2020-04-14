# Zuul VSCode Plugin

## How do I install the plugin?

Download the latest release from Github

```
wget https://github.com/Alexander-Scott/zuulplugin/releases/download/0.1/zuulplugin-0.0.1.vsix
```

Install it:

```
code --install-extension zuulplugin-0.0.1.vsix
```

To uninstall follow [these](https://code.visualstudio.com/docs/editor/extension-gallery#_uninstall-an-extension) instructions.

## What does the plugin allow me to do?

### Jump to defintion

Further information [here](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-definition). It is currently implemented for:

- Jumping to a parent job definition in any file in the workspace (Ctrl+Click / F12).
- Jumping to a job definition from a project template.

### Show Job Definitions

Further information [here](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-symbol). This currently allows you to:

- See all job definitions in a file (Outline Window).
- Quick search amongst job names.
- Quick search amongst job names from all files in a workspace (Ctrl+T).
- Jump quickly between the definitions.

### Show Job Hierarchy

Show the call hierarchy between parent and child jobs (Ctrl+Shift+H). This currently allows you to:

- See the outgoing call hierarchy: currnt job to parent job.
- See the incoming call hierarchy: current job to child jobs.

### Show all Job References

Further information [here](https://code.visualstudio.com/docs/editor/editingevolved#_peek). This currently allows you to:

- See all jobs that reference this job as a parent in any file in the workspace (Shift+Alt+F12).
- Peek at these jobs.
- Show jobs referenced in project templates.

### Show Job Variables on hover

Hovers show information about the job that's below the mouse cursor. This currently allows you to see:

- The variables of the job and all parents job.
- Child jobs overwrite the variables of parent jobs.
- These variables can also be seen in project templates.

## How does it work?

All yaml files in the Zuul.d folder are parsed to find jobs and job attributes. This light weight job hierarchy is then stored in memory and fetched when needed.
There are also file watchers present to see when a valid file is Saved, Created and Deleted.

## Future Features

- Fast symbol renaming -> Rename all jobs with a single click.
- Show errors and warnings -> Duplicated job names, modifying jobs marked as final, running jobs marked as abstract.
- Code completion -> Auto complete variable names and job names

## Known bugs

- When parsing job information and job attributes, if there is an empty line (such as in a long description), the parser will think it has reached the end of the job and attributes may be missed.
