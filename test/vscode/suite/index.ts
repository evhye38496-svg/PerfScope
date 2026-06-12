import * as assert from 'assert';
import * as vscode from 'vscode';

export async function run(): Promise<void> {
  const extension = vscode.extensions.getExtension('Evhye.turbo-vscode') ?? vscode.extensions.getExtension('evhye.turbo-vscode');
  assert.ok(extension, 'One-Click Turbo extension should be discoverable');

  await extension.activate();

  const commands = await vscode.commands.getCommands(true);
  assert.ok(commands.includes('turbo.dashboard.focus'), 'turbo.dashboard.focus should be contributed by the side bar view');
  assert.ok(commands.includes('turbo.runFullScan'), 'turbo.runFullScan should be registered');
  assert.ok(commands.includes('turbo.showDashboard'), 'turbo.showDashboard should be registered');
  assert.ok(commands.includes('turbo.quickAudit'), 'turbo.quickAudit should be registered');
  assert.ok(commands.includes('turbo.exportReport'), 'turbo.exportReport should be registered');
  assert.ok(commands.includes('turbo.applySafeFixes'), 'turbo.applySafeFixes should be registered');
  assert.ok(commands.includes('turbo.undoLastFix'), 'turbo.undoLastFix should be registered');

  await vscode.commands.executeCommand('turbo.exportReport');
  await vscode.commands.executeCommand('turbo.showDashboard');
  await vscode.commands.executeCommand('turbo.runFullScan');
  await vscode.commands.executeCommand('turbo.quickAudit');
  await vscode.commands.executeCommand('turbo.undoLastFix');
  assert.ok(extension.isActive, 'extension should be active after running a Turbo command');
}
