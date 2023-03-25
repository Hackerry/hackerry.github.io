---
layout: post
title:  "Professional Git Notes"
date:   2023-03-19 11:46:39 -0800
categories: summary
---

Notes on "Professional Git" by Brent Laster.

## Overview

Git is a snapshot based distributed version control system. Complete files are stored as they are tracked by git.

Git stores files in the `.git` directory with the following structure:
1. `config` file - local configurations for the repository
2. `description` file - description of the repository
3. `HEAD` file - pointer to the current commit in the current branch in working directory
4. `hooks` directory - contains hooks for the repository
5. `info` directory - stores files for git internal uses
6. `objects` directory - stores internal representation of the files, commits, etc
7. `refs` directory - stores references to the SHA1 value of the branch, tags, etc

The `.git` directory is a content-addressable data store. Internally files are stored as BLOBs which are anonymous containers for files. Directories are stored in TREEs that contain pointers to BLOBs for files and filenames.

Git maintains SHA1 hash for every object it stores in the `objects` directory. The subdirectory name is the first 2 hex value of the SHA1 with the rest stored in the file name.

To inspect content of an object: `git cat-file -p <SHA1>`.

To inspect the type of an object: `git cat-file -t <SHA1>`.

## Git Commands
Common git commands follow the format: `git <command> <command-options> <operands>`.

In case of ambiguous names, use `--` to separate command-options with operands to disambiguate. For example, `git <command> my-tag-name -- my-file-name`.

Git has 2 types of commands - porcelain commands (ie. init/commit) are meant to be used by users and have clean interfaces; plumbing commands (ie. cat-file) are lower-level commands used by porcelain commands and they can directly extract/modify internal content of git.

`git show` can be used to inspect files at different stages in a workflow.

`git grep` is faster than standard `grep` and allows searching in a specific revision/commit.

`git clean` can be used to remove untracked files in working directory.

`git notes` can attach notes to past commits without changing the SHA1 value. Notes can be stored in namespaces with `--ref=<namespace>` to allow easy search of notes.

`git rev-list` lists commits bounded by some range or condition.

`git bisect` implements binary search and uses user-marked good/bad tag to help locating where a bug is introduced.

`git rerere` can record past resolutions of a file and auto-merge files in the future.

## Git Configurations
Git has 3 level of configurations - `system` configurations are for all repos on a machine; `global` configurations are for all repos for a user; `project`  configurations are only for the current repo.

Git uses a template to generate new repos with `git init`. This template is at `/usr/share/git-core/templates`.

Git can use templates to format commit messages
1. Use `git commit -t <template_path>`
2. Set template in configurations: `git config --global commit.template <template_path>`
3. Use hooks to generate commit message with template

Git attributes file allows controlling git configurations and performing actions based on file types or filenames. For example, CRLF can be set in directory-specific `.gitattributes` files. Filters can be set on certain types of files. When files are checked out, they are smudged and the smudge filter action is performed. Similarly, when they are checked in, the clean action is performed.

Git allows alias commands. To define parameterized alias, use `! f() { git cat-file -p \$1; }; f`. The semi-colons and spaces between curly braces are necessary. Exclamation mark signals going to the shell. To add the alias locally, use `git config --local alias.<name> "<! command>"`.

## Branches, Merging and Rebasing
Git branches are snapshots with names. They are easy to create by pointing to existing snapshots.

HEAD is stored in `.git/HEAD` and new branches has references stored in `.git/logs/refs/heads`.

Git has 2 ways of incorporating changes from one branch to another: **merging** and **rebasing**.

There are 2 cases when merging: **fast-forward** or **three way merging**. Fast-forward is an optimization when there aren't any conflict changes. Three way merging is the more common case.

Rebasing moves the new pointer forward and allows for reconstructing the history of the branch being merged. In case of conflicts while rebasing, `.git/rebase-apply/patch` has the operation that git rebase is intending to do.

Cherry-picking allows choosing which commits to merge.

Once a merging or rebasing is issued, git goes into a state that can be exited only by a successful merge or abort with `--abort`. Use `git mergetool` to get an interactive session that can perform git operations.

Git automatically uses the recursive strategy to merge. Use the `-X` option to, for example, ignore white-space changes or to blindly take incoming or current changes. For example, `git cherry-pick -Xtheirs <SHA1>`.

After conflict is resolved but before committing, use `git checkout --conflict=merge` to revert the conflict resolution process.

## Git Remote
Git uses remote tracking branch to track a remote branch. Git has different pushing behaviors:
1. nothing - don't push anything
2. matching - push matching branches with local-remote setup

By default, push doesn't push tags. Add `--tag` to include them.

When issuing a `git fetch`, git advances the remote tracking branch in case of newer commits. The user can choose to incorporate the new changes in the newer commit.

## Git Worktree
Git worktrees allow having different branches checked out in different directories so that user can work on different branches at the same time. However, git warns about checking out the same branch in different directories.

Git tracks worktrees in `.git/worktrees/<path>`. Use `git worktree add <path> <branch>` to create a new worktree. Use `git worktree add --detach ../tmparea` to create a new worktree without any branch in detached HEAD mode.

Use `git worktree prune` to remove worktrees **after** the path to the worktree has been removed.

## Git Submodules
A repository may contain subdirectories that refer to other repositories called submodules. Git tracks submodule information in `.git/modules`.

Use `git submodule add <url> <dir>` to add a submodule. Use `git submodule status` to show the status:
1. `-` means submodule is not initialized
2. `+` means the current submodule version that is checked out is different from the SHA1 tracked by the repo
3. `U` means there are merge conflicts in submodule

After adding a repo as submodule, the directory is empty and not populated. Use `git submodule init` to generate the configuration. Then use `git submodule update` to clone the full repo, default to using the `master` branch.

To update a submodule, do one of the following:
1. go into individual submodules and run `git pull/fetch/merge`
2. run `git pull --recursive`
3. use `git submodule update -- remote`
4. use `git submodule foreach git pull origin master`

Then add and commit the changes so that git tracks them. This add and merge must be done in both submodules and the superproject. When pushing to remote, add `--recursive-submodules=check/on-demand` to check for unpushed changes or ask git to try to push the changes.

To remove a submodule, use `git submodule deinit`.

## Git Logging
Both git `reflog` and `log` gives record of past commits but `reflog` is private and `log` is public.

Merge conflicts can be shown with conflict markers in local files (ie. `>` and `<` repeated multiple times) or with `git log --merge -p file.txt`. To include the change in common ancestor for comparison, set `merge.conflictStyle` to `diff3`.

Git log allows searching past commits for particular line changes. The `-S` (pickaxe) option searches for changes that affect the number of occurrences of certain text or regex. The `-G` option searches for changes that affect text or regex. The `-L` option searches for changes of certain lines in a file or changes to a function name. For example, `-L <start>,<end>:<file>` or `-L :<funcname>:<file>`.

## Git Stash
Git stash temporarily stores modified and **tracked** files in working directory and staging area in a separate area, and cleans the working directory to the HEAD of current branch. To include untracked files, use `-u` option or add them to staging area to be tracked.

Multiple stashes can be made and they are stored in a stack-like structure with the newest stash at index 0.

Use `git stash save <comment>` to attach a message. Use `git stash apply stash@{1}` to attempt applying the stash to working directory. Use `git pop` to pop and apply the most recent stash. Both `apply` and `stash` may put git into merging state if conflicts occur.

## Git File Sharing
Git archive creates a zip or tarball off of a specific commit. It also allows archiving a specific subdirectory.

Git bundle creates a package with the `.git` directory. It works well as an offline remote repository and can be shared via email or USB.

Git patches can be shared over email and can apply incremental changes to a repository.

## Miscellaneous
When adding new files to git, the mode is a 16-bit octal value constructed from 4-bit object type - 1000 regular file, 1010 sym link, 1110 gitlink, etc; 3-bit unused 0; 9-bit unix-permissions.

Git can compress object data by grouping snapshots into packs. A pack stores the most recent snapshot in time and diffs with previous snapshots since git assumes newer commits are referenced more often than older ones. Packs are stored in the `.git/objects/pack` directory.

Use `git gc` to invoke git to compress storage and remove dangling commits.

`git reset` has 3 modes:
1. **soft** - only updates HEAD of local repo
2. **mixed** (default) - updates HEAD of local and staging area
3. **hard** - HEAD of local, staging area and working directory

Git has 4 protocols for connecting to a remote repository:
1. **Local** - provides shared access to directory. Clone with `git clone /dir/proj/repo.git`
2. **Git** - needs a special daemon program that offers service on a dedicated port. It's an all-or-none access with no authentication.
3. **SSH** - needs authentication key pair setup
4. **HTTP** - dumb HTTP is read-only; smart HTTP is readable and writable with authentication or anonymous access

Git subtree maintains a private copy of a repo and avoids the complexity of managing submodules.

Git hooks extends the functionality of git. They are stored in `.git/hooks`.

Git allows signing commits with GPG.