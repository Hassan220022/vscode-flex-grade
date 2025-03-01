import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { workspace, ExtensionContext, window, commands, TextDocument, Position, Range } from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
    console.log('Flex language extension is now active!');

    // Register formatter
    const formatProvider = registerFormattingProvider(context);

    // Register commands
    registerCommands(context);

    // Start language server
    startLanguageServer(context);
}

function registerFormattingProvider(context: ExtensionContext) {
    const formatProvider = vscode.languages.registerDocumentFormattingEditProvider('flex', {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            const text = document.getText();
            const formatted = formatFlexCode(text);
            
            const firstLine = document.lineAt(0);
            const lastLine = document.lineAt(document.lineCount - 1);
            const textRange = new vscode.Range(
                firstLine.range.start,
                lastLine.range.end
            );
            
            return [vscode.TextEdit.replace(textRange, formatted)];
        }
    });

    context.subscriptions.push(formatProvider);
    return formatProvider;
}

function formatFlexCode(code: string): string {
    // Basic formatting implementation
    let formattedCode = '';
    let indentLevel = 0;
    const lines = code.split(/\r?\n/);
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        // Decrease indent for closing brackets/braces
        if (line.startsWith('}') || line.startsWith(')') || line.startsWith(']')) {
            indentLevel = Math.max(0, indentLevel - 1);
        }
        
        // Add indent
        const indent = '    '.repeat(indentLevel);
        formattedCode += indent + line + '\n';
        
        // Increase indent after opening brackets/braces
        if (line.endsWith('{') || line.endsWith('(') || line.endsWith('[')) {
            indentLevel++;
        }
        
        // Handle if/else/for/while statements without braces
        if ((line.startsWith('if') || line.startsWith('cond') || 
             line.startsWith('for') || line.startsWith('loop') || 
             line.startsWith('while') || line.startsWith('karr')) && 
            !line.endsWith('{')) {
            indentLevel++;
        }
        
        // Handle closing statements
        if (line.startsWith('else') || line.startsWith('elif') && !line.endsWith('{')) {
            indentLevel++;
        }
    }
    
    return formattedCode;
}

function registerCommands(context: ExtensionContext) {
    // Format command
    context.subscriptions.push(commands.registerCommand('flex.format', () => {
        const editor = window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'flex') {
            return;
        }
        
        commands.executeCommand('editor.action.formatDocument');
    }));
    
    // Run command
    context.subscriptions.push(commands.registerCommand('flex.run', async () => {
        const editor = window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'flex') {
            return;
        }
        
        // Get Flex executable path from settings
        const config = workspace.getConfiguration('flex');
        let flexPath = config.get<string>('path', '');
        
        if (!flexPath) {
            // Try to find flex.sh in the Sindbad directory
            const defaultPath = path.join(path.dirname(path.dirname(context.extensionPath)), 'src', 'flex.sh');
            
            if (fs.existsSync(defaultPath)) {
                flexPath = defaultPath;
                await config.update('path', flexPath, true);
                window.showInformationMessage(`Found Flex interpreter at: ${flexPath}`);
            } else {
                const userInput = await window.showInputBox({
                    placeHolder: 'Enter path to Flex interpreter or compiler',
                    prompt: 'Flex path not set in settings. Please provide the path to the Flex executable.'
                });
                
                if (!userInput) {
                    return;
                }
                
                flexPath = userInput;
                await config.update('path', flexPath, true);
            }
        }
        
        // Save the document before running
        await editor.document.save();
        
        // Create a terminal and run the Flex file
        const terminal = window.createTerminal('Flex Run');
        
        // Set the USE_AI environment variable to true for better error handling
        terminal.sendText('export USE_AI=true');
        terminal.sendText(`${flexPath} ${editor.document.fileName}`);
        terminal.show();
    }));
    
    // Lint command
    context.subscriptions.push(commands.registerCommand('flex.lint', () => {
        if (client) {
            // Request linting from the language server
            client.sendNotification('flex/lint');
        }
    }));
}

function startLanguageServer(context: ExtensionContext) {
    // The server is implemented in Node
    const serverModule = context.asAbsolutePath(path.join('out', 'server', 'server.js'));
    
    // The debug options for the server
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
    
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: debugOptions
        }
    };
    
    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        // Register the server for Flex documents
        documentSelector: [{ scheme: 'file', language: 'flex' }],
        synchronize: {
            // Notify the server about file changes to files in the workspace
            fileEvents: workspace.createFileSystemWatcher('**/*.{flex,fx,lx}')
        }
    };
    
    // Create and start the client
    client = new LanguageClient(
        'flexLanguageServer',
        'Flex Language Server',
        serverOptions,
        clientOptions
    );
    
    // Start the client. This will also launch the server
    const disposable = client.start();
    context.subscriptions.push(disposable);
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
