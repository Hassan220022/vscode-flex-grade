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
import * as cp from 'child_process';

let client: LanguageClient;

// Track the current running process
let runningProcess: cp.ChildProcess | undefined;
let runningTerminal: vscode.Terminal | undefined;
let runningStatusBarItem: vscode.StatusBarItem;

export function activate(context: ExtensionContext) {
    console.log('Flex language extension is now active!');

    // Register formatter
    const formatProvider = registerFormattingProvider(context);

    // Register commands
    registerCommands(context);

    // Register refactoring providers
    registerRefactoringProviders(context);

    // Register AI commands
    registerAICommands(context);

    // Register run commands
    registerRunCommands(context);

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
    // Enhanced formatting implementation
    let formattedCode = '';
    let indentLevel = 0;
    const lines = code.split(/\r?\n/);
    
    // Track if we're inside a multiline comment
    let inMultilineComment = false;
    
    // Track if we're inside a string
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        // Skip empty lines
        if (line === '') {
            formattedCode += '\n';
            continue;
        }
        
        // Handle multiline comments
        if (inMultilineComment) {
            const commentEndIndex = line.indexOf('*/');
            if (commentEndIndex !== -1) {
                inMultilineComment = false;
                // Add the comment with current indent
                const indent = '    '.repeat(indentLevel);
                formattedCode += indent + line + '\n';
            } else {
                // Continue the multiline comment with current indent
                const indent = '    '.repeat(indentLevel);
                formattedCode += indent + line + '\n';
            }
            continue;
        }
        
        // Check for multiline comment start
        const commentStartIndex = line.indexOf('/*');
        if (commentStartIndex !== -1 && !line.includes('*/')) {
            inMultilineComment = true;
            // Add the comment with current indent
            const indent = '    '.repeat(indentLevel);
            formattedCode += indent + line + '\n';
            continue;
        }
        
        // Decrease indent for closing brackets/braces
        if (line.startsWith('}') || line.startsWith(')') || line.startsWith(']')) {
            indentLevel = Math.max(0, indentLevel - 1);
        }
        
        // Special case for else/elif statements
        if (line.startsWith('else') || line.startsWith('elif')) {
            // Decrease indent for else/elif
            indentLevel = Math.max(0, indentLevel - 1);
            
            // Add indent
            const indent = '    '.repeat(indentLevel);
            formattedCode += indent + line + '\n';
            
            // Increase indent if the line ends with an opening brace
            if (line.endsWith('{')) {
                indentLevel++;
            }
            // Also increase indent for else/elif without braces
            else if (!line.includes('{')) {
                indentLevel++;
            }
            
            continue;
        }
        
        // Add indent
        const indent = '    '.repeat(indentLevel);
        formattedCode += indent + line + '\n';
        
        // Increase indent after opening brackets/braces
        if (line.endsWith('{') || line.endsWith('(') || line.endsWith('[')) {
            indentLevel++;
        }
        
        // Handle if/for/while statements without braces
        if ((line.startsWith('if') || line.startsWith('cond') || 
             line.startsWith('for') || line.startsWith('loop') || 
             line.startsWith('while') || line.startsWith('karr')) && 
            !line.endsWith('{') && !line.includes('{')) {
            indentLevel++;
        }
        
        // Handle function declarations
        if ((line.startsWith('fun') || line.startsWith('sndo2')) && 
            line.includes('(') && !line.includes('{')) {
            // If the function declaration doesn't have an opening brace yet,
            // don't increase the indent level
        }
        else if ((line.startsWith('fun') || line.startsWith('sndo2')) && 
                 line.includes('(') && line.includes('{')) {
            // Function declaration with opening brace - indent already increased above
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

    // Run with AI command
    context.subscriptions.push(commands.registerCommand('flex.runWithAI', async () => {
        const editor = window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'flex') {
            return;
        }
        
        // Get Flex executable path from settings
        const config = workspace.getConfiguration('flex');
        let flexPath = config.get<string>('path', '');
        
        if (!flexPath) {
            window.showErrorMessage('Flex path not set. Please set it in the settings or run the regular run command first.');
            return;
        }
        
        // Save the document before running
        await editor.document.save();
        
        // Create a terminal and run the Flex file with AI enabled
        const terminal = window.createTerminal('Flex Run with AI');
        
        // Set the USE_AI environment variable to true for better error handling
        terminal.sendText('export USE_AI=true');
        
        // Set the AI model based on user settings
        const aiModel = config.get<string>('ai.model', 'qwen');
        terminal.sendText(`export FLEX_AI_MODEL=${aiModel}`);
        
        // If using OpenAI, set the API key
        if (aiModel === 'openai') {
            const apiKey = config.get<string>('ai.apiKey', '');
            if (!apiKey) {
                window.showWarningMessage('OpenAI API key not set. Please set it in the settings.');
            } else {
                terminal.sendText(`export OPENAI_API_KEY=${apiKey}`);
            }
        }
        
        terminal.sendText(`${flexPath} ${editor.document.fileName}`);
        terminal.show();
    }));

    // Create new Flex file command
    context.subscriptions.push(commands.registerCommand('flex.createNewFile', async (uri: vscode.Uri) => {
        // Get the target directory
        const targetDir = uri ? uri.fsPath : workspace.workspaceFolders?.[0].uri.fsPath;
        
        if (!targetDir) {
            window.showErrorMessage('No workspace folder open.');
            return;
        }
        
        // Ask for the file name
        const fileName = await window.showInputBox({
            placeHolder: 'Enter file name (without extension)',
            prompt: 'Enter the name for the new Flex file'
        });
        
        if (!fileName) {
            return;
        }
        
        // Add the .lx extension if not provided
        const fullFileName = fileName.endsWith('.lx') || fileName.endsWith('.flex') || fileName.endsWith('.fx') 
            ? fileName 
            : `${fileName}.lx`;
        
        // Create the file path
        const filePath = path.join(targetDir, fullFileName);
        
        // Check if file already exists
        if (fs.existsSync(filePath)) {
            window.showErrorMessage(`File ${fullFileName} already exists.`);
            return;
        }
        
        // Create a template for the new file
        const template = `// ${fileName} - Flex program
// Created on ${new Date().toLocaleDateString()}

// Your code here

`;
        
        // Write the file
        fs.writeFileSync(filePath, template);
        
        // Open the file in the editor
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
    }));

    // Go to definition command
    context.subscriptions.push(commands.registerCommand('flex.goToDefinition', async () => {
        const editor = window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'flex') {
            return;
        }
        
        // Execute the built-in go to definition command
        await commands.executeCommand('editor.action.revealDefinition');
    }));

    // Find references command
    context.subscriptions.push(commands.registerCommand('flex.findReferences', async () => {
        const editor = window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'flex') {
            return;
        }
        
        // Execute the built-in find references command
        await commands.executeCommand('editor.action.referenceSearch.trigger');
    }));
}

function registerRefactoringProviders(context: ExtensionContext) {
    // Register rename provider
    const renameProvider = vscode.languages.registerRenameProvider('flex', {
        provideRenameEdits(document, position, newName) {
            const wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) {
                return null;
            }
            
            const oldName = document.getText(wordRange);
            const edit = new vscode.WorkspaceEdit();
            
            // Find all occurrences of the symbol in the document
            const text = document.getText();
            const pattern = new RegExp(`\\b${oldName}\\b`, 'g');
            let match;
            
            while ((match = pattern.exec(text)) !== null) {
                const matchPos = document.positionAt(match.index);
                const matchRange = new vscode.Range(
                    matchPos,
                    matchPos.translate(0, oldName.length)
                );
                
                // Skip if it's in a comment or string
                const lineText = document.lineAt(matchPos.line).text;
                const linePrefix = lineText.substring(0, matchPos.character);
                
                // Skip if in a single-line comment
                if (linePrefix.includes('//')) {
                    continue;
                }
                
                // Add the edit
                edit.replace(document.uri, matchRange, newName);
            }
            
            return edit;
        }
    });
    
    // Register code actions provider for quick fixes and refactorings
    const codeActionsProvider = vscode.languages.registerCodeActionsProvider('flex', {
        provideCodeActions(document, range, context, token) {
            const actions: vscode.CodeAction[] = [];
            
            // Extract variable refactoring
            if (range.isSingleLine && !range.isEmpty) {
                const selectedText = document.getText(range);
                
                // Only offer to extract non-trivial expressions
                if (selectedText.length > 1 && 
                    !selectedText.startsWith('//') && 
                    !selectedText.includes('"') && 
                    !selectedText.includes("'")) {
                    
                    const extractAction = new vscode.CodeAction(
                        'Extract to variable', 
                        vscode.CodeActionKind.RefactorExtract
                    );
                    
                    extractAction.command = {
                        title: 'Extract to variable',
                        command: 'flex.extractVariable',
                        arguments: [document, range, selectedText]
                    };
                    
                    actions.push(extractAction);
                }
            }
            
            // Add quick fixes for diagnostics
            if (context.diagnostics.length > 0) {
                for (const diagnostic of context.diagnostics) {
                    if (diagnostic.message.includes('is used but not declared')) {
                        // Create a quick fix to declare the variable
                        const varName = diagnostic.message.match(/\'([^']+)\'/)?.[1];
                        if (varName) {
                            const declareAction = new vscode.CodeAction(
                                `Declare variable '${varName}'`,
                                vscode.CodeActionKind.QuickFix
                            );
                            
                            declareAction.command = {
                                title: `Declare variable '${varName}'`,
                                command: 'flex.declareVariable',
                                arguments: [document, diagnostic.range, varName]
                            };
                            
                            declareAction.diagnostics = [diagnostic];
                            declareAction.isPreferred = true;
                            
                            actions.push(declareAction);
                        }
                    }
                }
            }
            
            return actions;
        }
    });
    
    // Register commands for code actions
    context.subscriptions.push(
        commands.registerCommand('flex.extractVariable', (document: vscode.TextDocument, range: vscode.Range, expression: string) => {
            const editor = window.activeTextEditor;
            if (!editor || editor.document !== document) {
                return;
            }
            
            // Get the indentation of the current line
            const lineText = document.lineAt(range.start.line).text;
            const indentMatch = lineText.match(/^\s*/);
            const indent = indentMatch ? indentMatch[0] : '';
            
            // Create a variable name based on the expression
            let varName = 'extracted';
            if (/^\d+$/.test(expression)) {
                varName = 'num';
            } else if (/^\d+\.\d+$/.test(expression)) {
                varName = 'decimal';
            } else if (expression.includes('+') || expression.includes('-') || 
                       expression.includes('*') || expression.includes('/')) {
                varName = 'result';
            } else {
                // Try to create a camelCase name from the expression
                varName = expression.toLowerCase()
                    .replace(/[^\w]+(.)/g, (_, chr) => chr.toUpperCase())
                    .replace(/[^\w]/, '');
                
                if (varName.length === 0 || /^\d/.test(varName)) {
                    varName = 'extracted';
                }
            }
            
            // Create the edit
            const edit = new vscode.WorkspaceEdit();
            
            // Insert the variable declaration before the current line
            const declarationPos = new vscode.Position(range.start.line, 0);
            edit.insert(document.uri, declarationPos, `${indent}${varName} = ${expression}\n`);
            
            // Replace the selected expression with the variable name
            edit.replace(document.uri, range, varName);
            
            // Apply the edit
            return vscode.workspace.applyEdit(edit);
        }),
        
        commands.registerCommand('flex.declareVariable', (document: vscode.TextDocument, range: vscode.Range, varName: string) => {
            const editor = window.activeTextEditor;
            if (!editor || editor.document !== document) {
                return;
            }
            
            // Find the appropriate place to insert the declaration
            // For simplicity, we'll insert at the beginning of the file
            const edit = new vscode.WorkspaceEdit();
            
            // Get the first non-comment, non-empty line
            let insertLine = 0;
            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i).text.trim();
                if (line === '' || line.startsWith('//') || line.startsWith('/*')) {
                    insertLine = i + 1;
                } else {
                    break;
                }
            }
            
            const insertPos = new vscode.Position(insertLine, 0);
            edit.insert(document.uri, insertPos, `rakm ${varName} = 0\n`);
            
            // Apply the edit
            return vscode.workspace.applyEdit(edit);
        })
    );
    
    context.subscriptions.push(renameProvider, codeActionsProvider);
}

function registerAICommands(context: ExtensionContext) {
    // AI Explain command
    const aiExplainCommand = vscode.commands.registerCommand('flex.aiExplain', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showInformationMessage('Please select code to explain');
            return;
        }

        const selectedText = editor.document.getText(selection);
        
        // Create and show the webview panel
        const panel = vscode.window.createWebviewPanel(
            'flexAIExplain',
            'Flex AI Explanation',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true
            }
        );

        // Set the HTML content
        panel.webview.html = getAIWebviewContent('Explaining Flex Code...', 'Analyzing your code...');

        try {
            // Simulate AI processing (in a real implementation, this would call an AI service)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Generate explanation (this would be replaced with actual AI-generated content)
            const explanation = generateExplanation(selectedText);
            
            // Update the webview with the explanation
            panel.webview.html = getAIWebviewContent('Flex Code Explanation', explanation);
        } catch (error) {
            panel.webview.html = getAIWebviewContent('Error', 'Failed to generate explanation: ' + error);
        }
    });

    // AI Generate command
    const aiGenerateCommand = vscode.commands.registerCommand('flex.aiGenerate', async () => {
        // Prompt the user for what they want to generate
        const prompt = await vscode.window.showInputBox({
            prompt: 'What Flex code would you like to generate?',
            placeHolder: 'E.g., A function to calculate factorial'
        });

        if (!prompt) {
            return; // User cancelled
        }

        // Create and show the webview panel
        const panel = vscode.window.createWebviewPanel(
            'flexAIGenerate',
            'Flex AI Code Generation',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true
            }
        );

        // Set the HTML content
        panel.webview.html = getAIWebviewContent('Generating Flex Code...', 'Processing your request...');

        try {
            // Simulate AI processing (in a real implementation, this would call an AI service)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Generate code (this would be replaced with actual AI-generated content)
            const generatedCode = generateCode(prompt);
            
            // Update the webview with the generated code
            panel.webview.html = getAIWebviewContent('Generated Flex Code', 
                `<p>Based on your prompt: "${prompt}"</p>
                <pre><code>${generatedCode}</code></pre>
                <button id="insertCode">Insert Code at Cursor</button>`);
            
            // Handle the insert code button click
            panel.webview.onDidReceiveMessage(message => {
                if (message.command === 'insertCode') {
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        editor.edit(editBuilder => {
                            editBuilder.insert(editor.selection.active, generatedCode);
                        });
                    }
                }
            });

            // Enable communication from the webview to the extension
            panel.webview.html = panel.webview.html.replace('</body>', `
                <script>
                    const vscode = acquireVsCodeApi();
                    document.getElementById('insertCode').addEventListener('click', () => {
                        vscode.postMessage({ command: 'insertCode' });
                    });
                </script>
                </body>
            `);
        } catch (error) {
            panel.webview.html = getAIWebviewContent('Error', 'Failed to generate code: ' + error);
        }
    });

    // AI Translate command
    const aiTranslateCommand = vscode.commands.registerCommand('flex.aiTranslate', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showInformationMessage('Please select code to translate');
            return;
        }

        const selectedText = editor.document.getText(selection);
        
        // Prompt for source language
        const sourceLanguage = await vscode.window.showQuickPick(
            ['JavaScript', 'Python', 'Java', 'C++', 'C#', 'Other'],
            { placeHolder: 'Select the source language' }
        );

        if (!sourceLanguage) {
            return; // User cancelled
        }

        // Create and show the webview panel
        const panel = vscode.window.createWebviewPanel(
            'flexAITranslate',
            'Translate to Flex',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true
            }
        );

        // Set the HTML content
        panel.webview.html = getAIWebviewContent('Translating to Flex...', `Translating from ${sourceLanguage}...`);

        try {
            // Simulate AI processing (in a real implementation, this would call an AI service)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Translate code (this would be replaced with actual AI-generated content)
            const translatedCode = translateToFlex(selectedText, sourceLanguage);
            
            // Update the webview with the translated code
            panel.webview.html = getAIWebviewContent('Translated Flex Code', 
                `<p>Translated from ${sourceLanguage}:</p>
                <pre><code>${translatedCode}</code></pre>
                <button id="insertCode">Replace Selected Code</button>`);
            
            // Handle the insert code button click
            panel.webview.onDidReceiveMessage(message => {
                if (message.command === 'insertCode') {
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        editor.edit(editBuilder => {
                            editBuilder.replace(selection, translatedCode);
                        });
                    }
                }
            });

            // Enable communication from the webview to the extension
            panel.webview.html = panel.webview.html.replace('</body>', `
                <script>
                    const vscode = acquireVsCodeApi();
                    document.getElementById('insertCode').addEventListener('click', () => {
                        vscode.postMessage({ command: 'insertCode' });
                    });
                </script>
                </body>
            `);
        } catch (error) {
            panel.webview.html = getAIWebviewContent('Error', 'Failed to translate code: ' + error);
        }
    });

    context.subscriptions.push(aiExplainCommand, aiGenerateCommand, aiTranslateCommand);
}

// Helper function to generate HTML content for the webview
function getAIWebviewContent(title: string, content: string): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    padding: 20px;
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                }
                h1 {
                    color: var(--vscode-editor-foreground);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 10px;
                }
                pre {
                    background-color: var(--vscode-textCodeBlock-background);
                    padding: 10px;
                    border-radius: 5px;
                    overflow: auto;
                }
                code {
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                }
                button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 12px;
                    border-radius: 2px;
                    cursor: pointer;
                    margin-top: 15px;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body>
            <h1>${title}</h1>
            <div>${content}</div>
        </body>
        </html>
    `;
}

// Mock function to generate code explanation (would be replaced with actual AI service)
function generateExplanation(code: string): string {
    // This is a placeholder. In a real implementation, this would call an AI service.
    return `
        <p>This Flex code does the following:</p>
        <ul>
            <li>Defines variables and functions</li>
            <li>Implements logic for data processing</li>
            <li>Handles user input and output</li>
        </ul>
        <p>The code structure follows standard Flex programming patterns and best practices.</p>
        <p>Here's a breakdown of the key components:</p>
        <pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
    `;
}

// Mock function to generate code (would be replaced with actual AI service)
function generateCode(prompt: string): string {
    // This is a placeholder. In a real implementation, this would call an AI service.
    if (prompt.includes('factorial')) {
        return `// Function to calculate factorial
fun factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

// Example usage
int result = factorial(5);
print("Factorial of 5 is: " + result);`;
    } else {
        return `// Generated Flex code based on your prompt
fun main() {
    print("Hello from Flex!");
    
    // Your implementation here
    // Based on: "${prompt}"
}`;
    }
}

// Mock function to translate code to Flex (would be replaced with actual AI service)
function translateToFlex(code: string, sourceLanguage: string): string {
    // This is a placeholder. In a real implementation, this would call an AI service.
    if (sourceLanguage === 'JavaScript') {
        return code
            .replace(/function\s+(\w+)\s*\(/g, 'fun $1(')
            .replace(/const\s+(\w+)\s*=/g, 'int $1 =')
            .replace(/let\s+(\w+)\s*=/g, 'int $1 =')
            .replace(/var\s+(\w+)\s*=/g, 'int $1 =')
            .replace(/console\.log/g, 'print')
            .replace(/\+\+/g, ' = $1 + 1');
    } else if (sourceLanguage === 'Python') {
        return code
            .replace(/def\s+(\w+)\s*\(/g, 'fun $1(')
            .replace(/print\s*\(/g, 'print(')
            .replace(/#/g, '//')
            .replace(/:\s*$/gm, ' {')
            .replace(/^\s*$/gm, '}');
    } else {
        // Generic translation attempt
        return `// Translated from ${sourceLanguage} to Flex
// Note: This is a basic translation and may need adjustments

${code
    .replace(/\/\//g, '// ')
    .replace(/function|def|void|public static|private static/g, 'fun')
    .replace(/console\.log|System\.out\.println|print/g, 'print')
    .replace(/int|float|double|string|boolean/g, (match) => {
        const typeMap: {[key: string]: string} = {
            'int': 'int',
            'float': 'float',
            'double': 'float',
            'string': 'string',
            'boolean': 'bool'
        };
        return typeMap[match] || match;
    })
}`;
    }
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

// Function to register run-related commands
function registerRunCommands(context: vscode.ExtensionContext) {
    // Create status bar item
    runningStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    runningStatusBarItem.text = "$(stop) Stop Flex";
    runningStatusBarItem.command = 'flex.stopRun';
    runningStatusBarItem.tooltip = 'Stop the running Flex program';
    context.subscriptions.push(runningStatusBarItem);

    // Register run file command
    const runFileCommand = vscode.commands.registerCommand('flex.runFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        // Check if the file is saved
        if (editor.document.isDirty) {
            const saved = await editor.document.save();
            if (!saved) {
                vscode.window.showErrorMessage('Please save the file before running');
                return;
            }
        }

        const filePath = editor.document.uri.fsPath;
        
        // Check if we already have a running process
        if (runningProcess) {
            vscode.window.showInformationMessage('A Flex program is already running. Stop it first.');
            return;
        }

        try {
            // Create a new terminal or reuse existing one
            if (!runningTerminal) {
                runningTerminal = vscode.window.createTerminal('Flex Run');
            }
            
            runningTerminal.show();
            
            // Clear the terminal (if supported by the terminal)
            runningTerminal.sendText('clear || cls');
            
            // Run the file using the Flex interpreter
            // This is a placeholder. In a real implementation, you would use the actual Flex interpreter
            runningTerminal.sendText(`echo "Running ${path.basename(filePath)}..."`);
            runningTerminal.sendText(`echo "This is a simulated run. In a real implementation, you would use the actual Flex interpreter."`);
            runningTerminal.sendText(`echo ""`);
            
            // Read the file content and display it
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const lines = fileContent.split('\n');
            
            // Simulate running the program
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('print')) {
                    // Extract the content inside the print statement
                    const match = line.match(/print\s*\(\s*"([^"]*)"\s*\)/);
                    if (match) {
                        runningTerminal.sendText(`echo "${match[1]}"`);
                    }
                }
            }
            
            // Set context to show the stop button
            vscode.commands.executeCommand('setContext', 'flexRunning', true);
            runningStatusBarItem.show();
            
            // Create a timeout to simulate the program running
            setTimeout(() => {
                if (runningTerminal) {
                    runningTerminal.sendText(`echo ""`);
                    runningTerminal.sendText(`echo "Program execution completed."`);
                }
                
                // Reset the running state
                vscode.commands.executeCommand('setContext', 'flexRunning', false);
                runningStatusBarItem.hide();
                runningProcess = undefined;
            }, 5000);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to run Flex file: ${error}`);
            
            // Reset the running state
            vscode.commands.executeCommand('setContext', 'flexRunning', false);
            runningStatusBarItem.hide();
            runningProcess = undefined;
        }
    });

    // Register stop run command
    const stopRunCommand = vscode.commands.registerCommand('flex.stopRun', () => {
        if (runningProcess) {
            // Kill the process
            runningProcess.kill();
            runningProcess = undefined;
        }
        
        if (runningTerminal) {
            runningTerminal.sendText(`echo ""`);
            runningTerminal.sendText(`echo "Program execution stopped by user."`);
        }
        
        // Reset the running state
        vscode.commands.executeCommand('setContext', 'flexRunning', false);
        runningStatusBarItem.hide();
    });

    context.subscriptions.push(runFileCommand, stopRunCommand);
}
