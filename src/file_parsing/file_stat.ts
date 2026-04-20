/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from "vscode";
import * as fs from "fs";
// @ts-ignore: No implicit any
import * as rimraf from "rimraf";
// @ts-ignore: No implicit any
import * as mkdirp from "mkdirp";

export class FileStatHelpers {
  stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
    return this.getStat(uri.fsPath);
  }

  async getStat(path: string): Promise<vscode.FileStat> {
    const fileStatAndLink = await FileSystemUtils.statLink(path);
    return new FileStat(fileStatAndLink.stat, fileStatAndLink.isSymbolicLink);
  }
}

export function deactivate() {}

//#region Utilities

export interface IStatAndLink {
  stat: fs.Stats;
  isSymbolicLink: boolean;
}

namespace FileSystemUtils {
  function handleResult<T>(
    resolve: (result: T) => void,
    reject: (error: Error) => void,
    error: Error | null | undefined,
    result: T | undefined
  ): void {
    if (error) {
      reject(messageError(error));
    } else {
      resolve(result!);
    }
  }

  function messageError(error: Error & { code?: string }): Error {
    if (error.code === "ENOENT") {
      return vscode.FileSystemError.FileNotFound();
    }

    if (error.code === "EISDIR") {
      return vscode.FileSystemError.FileIsADirectory();
    }

    if (error.code === "EEXIST") {
      return vscode.FileSystemError.FileExists();
    }

    if (error.code === "EPERM" || error.code === "EACCESS") {
      return vscode.FileSystemError.NoPermissions();
    }

    return error;
  }

  export function checkCancellation(token: vscode.CancellationToken): void {
    if (token.isCancellationRequested) {
      throw new Error("Operation cancelled");
    }
  }

  export function normalizeNFC(items: string): string;
  export function normalizeNFC(items: string[]): string[];
  export function normalizeNFC(items: string | string[]): string | string[] {
    if (process.platform !== "darwin") {
      return items;
    }

    if (Array.isArray(items)) {
      return items.map((item) => item.normalize("NFC"));
    }

    return items.normalize("NFC");
  }

  export function readdir(path: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      fs.readdir(path, (error, children) =>
        handleResult(resolve, reject, error, normalizeNFC(children))
      );
    });
  }

  export function readfile(path: string): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      fs.readFile(path, (error, buffer) =>
        handleResult(resolve, reject, error, buffer)
      );
    });
  }

  export function writefile(path: string, content: Buffer): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(path, content, (error) =>
        handleResult(resolve, reject, error, void 0)
      );
    });
  }

  export function exists(path: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      fs.exists(path, (exists) => handleResult(resolve, reject, null, exists));
    });
  }

  export function rmrf(path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // @ts-ignore: No implicit any
      rimraf(path, (error) => handleResult(resolve, reject, error, void 0));
    });
  }

  export function mkdir(path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // @ts-ignore: No implicit any
      mkdirp(path, (error) => handleResult(resolve, reject, error, void 0));
    });
  }

  export function rename(oldPath: string, newPath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.rename(oldPath, newPath, (error) =>
        handleResult(resolve, reject, error, void 0)
      );
    });
  }

  export function unlink(path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.unlink(path, (error) => handleResult(resolve, reject, error, void 0));
    });
  }

  export function statLink(path: string): Promise<IStatAndLink> {
    return new Promise<IStatAndLink>((resolve, reject) => {
      fs.lstat(path, (error, lstat) => {
        if (error || lstat.isSymbolicLink()) {
          fs.stat(path, (error, stat) => {
            if (error) {
              return handleResult(resolve, reject, error, void 0);
            }

            handleResult(resolve, reject, error, {
              stat,
              isSymbolicLink: lstat && lstat.isSymbolicLink(),
            });
          });
        } else {
          handleResult(resolve, reject, error, {
            stat: lstat,
            isSymbolicLink: false,
          });
        }
      });
    });
  }
}

export class FileStat implements vscode.FileStat {
  constructor(private fileSystemStat: fs.Stats, private symbolicLink: boolean) {}

  get type(): vscode.FileType {
    let type: number;
    if (this.symbolicLink) {
      type =
        vscode.FileType.SymbolicLink |
        (this.fileSystemStat.isDirectory()
          ? vscode.FileType.Directory
          : vscode.FileType.File);
    } else {
      type = this.fileSystemStat.isFile()
        ? vscode.FileType.File
        : this.fileSystemStat.isDirectory()
        ? vscode.FileType.Directory
        : vscode.FileType.Unknown;
    }

    return type;
  }

  get isFile(): boolean | undefined {
    return this.fileSystemStat.isFile();
  }

  get isDirectory(): boolean | undefined {
    return this.fileSystemStat.isDirectory();
  }

  get isSymbolicLink(): boolean | undefined {
    return this.symbolicLink;
  }

  get size(): number {
    return this.fileSystemStat.size;
  }

  get ctime(): number {
    return this.fileSystemStat.ctime.getTime();
  }

  get mtime(): number {
    return this.fileSystemStat.mtime.getTime();
  }
}

//#endregion
