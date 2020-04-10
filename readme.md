# lizard

This is an extension for Visual Studio Code to run
[Lizard](https://github.com/terryyin/lizard) cyclomatic complexity analysis on
your project.

## Features

This extension reports diagnostics for functions that:

* are too long,
* have too many parameters, or
* have too many branches.

The limits can be specified in your configuration JSON file.

## Requirements

You must already have Lizard installed, and available in your `PATH`.

## Extension Settings

Lizard can be controlled with these settings.

* `lizard.ccn`: The maximum modified cyclomatic complexity of a function. Set
  this 0 to disable scanning CCN. The default value is 0.
* `lizard.arguments`: The maximum number of arguments for a function. Set this
  to 0 to disable scanning function arguments. The default value is 0.
* `lizard.length`: The maximum length of a function. Set this to 0 to disable
  scanning function length. The default value is 0.
* `lizard.modified_ccn`: Use modified CCN analysis. This treats switch
  statements as complexity 1 regardless of the number of cases. The default is
  off.
* `lizard.whitelist`: The path to a whitelist file. The path is relative to the
  workspace. See the lizard documentation for details.

## Commands

* `Lizard: Scan the Current Document`: Use this command manually scan the
  current file with Lizard. Note that a file is scanned automatically when it is
  saved, and when the settings are updated. This command is most useful when an
  external change is made, such as editing the whitelist file.

## Known Issues

* A file cannot be scanned during editing. Lizard reads the file from disk, so
  you have save your changes which will trigger scanning the file.
* Only C++ is supported *by the extension*. Support for other languages will be
  added as soon as possible.

## Release Notes

### 0.1

Preview release of the extension.
