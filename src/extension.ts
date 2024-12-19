import * as vscode from "vscode";
import { PythonExtension } from "@vscode/python-extension";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
var kill = require("tree-kill");

var logger: vscode.LogOutputChannel;
var proc: ChildProcessWithoutNullStreams;

export function activate(context: vscode.ExtensionContext) {
  const launch = vscode.commands.registerCommand(
    "mlflow-vscode.launchMLflow",
    async () => {
      logger = vscode.window.createOutputChannel("MLflow", { log: true });
      const pythonApi = await PythonExtension.api();
      const interpreter = pythonApi.environments.getActiveEnvironmentPath();
      if (!interpreter) {
        logger.appendLine("No Python interpreter found");
        return;
      }
      logger.appendLine(`Python interpreter found at ${interpreter.path}`);

      proc = spawn(interpreter.path, ["-m", "mlflow", "ui"], {
        cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath,
      });
      proc.stdout.on("data", (data) => {
        logger.appendLine(`${data}`);
      });
      proc.stderr.on("data", (data) => {
        logger.appendLine(`${data}`);
      });
      var run = true;
      proc.stderr.on("data", (data) => {
        var ready =
          data.includes("Listening") || data.includes("Connection in use");
        if (ready && run) {
          run = false;
          vscode.commands.executeCommand(
            "simpleBrowser.show",
            "http://localhost:5000"
          );
        }
      });

      logger.appendLine("MLflow launched at http://localhost:5000");
    }
  );
  context.subscriptions.push(launch);

  const stop = vscode.commands.registerCommand(
    "mlflow-vscode.stopMLflow",
    () => {
      kill(proc.pid);
      logger.appendLine("MLflow stopped");
      logger.dispose();
    }
  );
  context.subscriptions.push(stop);
}
