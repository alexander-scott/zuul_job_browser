import * as vscode from "vscode";

export class Logger {
	private static instance: Logger;

	constructor() {
		if (Logger.instance) {
			throw new Error("Error - use Singleton.getInstance()");
		}
		this.output_channel = vscode.window.createOutputChannel("zuulplugin");
	}

	static getInstance(): Logger {
		Logger.instance = Logger.instance || new Logger();
		return Logger.instance;
	}

	output_channel: vscode.OutputChannel;

	log(message: string) {
		this.output_channel.appendLine(message);
		console.log(message);
	}

	debug(message: string) {
		console.log(message);
	}
}
