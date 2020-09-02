/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

"use strict";

import * as vscode from "vscode";
import {
  WorkspaceFolder,
  DebugConfiguration,
  ProviderResult,
  CancellationToken,
} from "vscode";
import { SpinSyntaxChecker } from "./spinSyntaxChecker";

export function activate(context: vscode.ExtensionContext) {
  // register a configuration provider for 'mock' debug type
  context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider(
      "promela-debug",
      new MockConfigurationProvider()
    )
  );

  // register a syntax problem provider
  const ws = vscode.workspace;
  const diag = vscode.languages.createDiagnosticCollection("promela");
  const spinSyntaxChecker = new SpinSyntaxChecker(diag);
  context.subscriptions.push(diag);
  ws.onDidOpenTextDocument((e: vscode.TextDocument) => {
    spinSyntaxChecker.execute(e);
  });

  ws.onDidSaveTextDocument((e: vscode.TextDocument) => {
    spinSyntaxChecker.execute(e);
  });
}

export function deactivate() {
	// nothing to do
}

class MockConfigurationProvider implements vscode.DebugConfigurationProvider {

	/**
	 * Massage a debug configuration just before a debug session is being launched,
	 * e.g. add all missing attributes to the debug configuration.
	 */
	resolveDebugConfiguration(folder: WorkspaceFolder | undefined, config: DebugConfiguration, token?: CancellationToken): ProviderResult<DebugConfiguration> {

		// if launch.json is missing or empty
		if (!config.type && !config.request && !config.name) {
			const editor = vscode.window.activeTextEditor;
			if (editor && editor.document.languageId === 'promela' ) {
				config.type = 'promela-debug';
				config.name = 'Launch';
				config.request = 'launch';
				config.program = '${file}';
				config.stopOnEntry = true;
			}
		}

		if (!config.program) {
			return vscode.window.showInformationMessage("Cannot find a program to debug").then(_ => {
				return undefined;	// abort launch
			});
		}

		return config;
	}
}
