# Flex Language Support for VS Code

This extension provides comprehensive language support for the Flex programming language, a flexible language designed to support multiple syntax styles, including Franko Arabic, English, and other common programming syntax conventions.

## Features

The Flex extension provides the following features:

### Syntax Highlighting
Syntax highlighting for Flex language files (`.lx`, `.flex`, `.fx`).

### Code Completion
Intelligent code completion for Flex keywords, types, and built-in functions.

### Error Checking
Real-time error checking and diagnostics for Flex code.

### Go to Definition
Navigate to the definition of variables, functions, and parameters.

### Find References
Find all references to a symbol throughout your code.

### Hover Information
Hover over symbols to see type information and documentation.

### Code Actions
Quick fixes and refactoring options for common code issues.

### Run and Debug
Run Flex files directly from the editor with the Run button in the editor toolbar.

### AI-Powered Features
The extension includes several AI-powered features to help you write Flex code:

- **Explain Code**: Select code and use the context menu to get an explanation of what the code does.
- **Generate Code**: Generate Flex code based on a natural language description.
- **Translate to Flex**: Translate code from other languages (JavaScript, Python, etc.) to Flex.

## Getting Started

1. Install the Flex extension from the VS Code marketplace
2. Open a Flex file (`.lx`, `.flex`, or `.fx`) or create a new one
3. Start coding with full language support

## Usage

### Running Flex Code
1. Open a Flex file (`.lx`, `.flex`, or `.fx`)
2. Click the Run button in the editor toolbar or right-click and select "Run Flex File"
3. The output will be displayed in a terminal window

### Using AI Features
- **Explain Code**: Select code, right-click, and choose "Flex: Explain Code"
- **Generate Code**: Right-click in the editor and select "Flex: Generate Code", then enter a description
- **Translate to Flex**: Select code in another language, right-click, and choose "Flex: Translate to Flex"

### Navigation
- **Go to Definition**: Right-click on a symbol and select "Go to Definition" or press F12
- **Find References**: Right-click on a symbol and select "Find All References" or press Shift+F12

## Integration with Flex Interpreter

To fully utilize this extension with the Sindbad Flex language interpreter:

1. Configure the path to the Flex interpreter in VS Code settings:
   - Open VS Code settings: `Ctrl+,` (or `Cmd+,` on Mac)
   - Search for "Flex"
   - Enter the path to the Flex interpreter in the "Flex > Path" setting
   - Example: `/Users/username/Developer/python/grad/Sindbad/src/flex.sh`

2. Configure environment for AI assistance:
   - The extension can integrate with the Flex interpreter's AI assistance features
   - Make sure the `USE_AI` environment variable is set correctly in your system
   - The extension will use this to provide enhanced error handling and suggestions

3. Testing the integration:
   - Open a Flex file (`.lx`, `.flex`, or `.fx`)
   - Press `F5` or use Command Palette > `Flex: Run Current File`
   - The file will be executed using the configured Flex interpreter
   - Any output or errors will appear in the integrated terminal

4. Using AI-enhanced features:
   - When errors occur in your code, the extension will use the Flex interpreter's AI capabilities to provide context-aware error messages and suggestions
   - This is particularly helpful for learning the language or debugging complex issues

## Usage Examples

### Formatting Code

1. Use the keyboard shortcut `