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

Lizard can be controlled with these settings. Each requires a positive integer.

* `lizard.limits.ccn`: The maximum modified cyclomatic complexity of a function.
  The default value is 10.
* `lizard.limits.arguments`: The maximum number of arguments for a function. The
  default value is 5.
* `lizard.limits.length`: The maximum length of a function. The default value is
  100.

## Known Issues

* A file cannot be scanned during editing. Lizard reads the file from disk, so
  you have save your changes which will trigger scanning the file.
* Only C++ is supported *by the extension*. Support for other languages will be
  added as soon as possible.

## Release Notes

### 0.1

Preview release of the extension.
