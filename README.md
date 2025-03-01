# Flex Language Support for VS Code

This extension provides comprehensive language support for the Flex programming language, a flexible language designed to support multiple syntax styles, including Franko Arabic, English, and other common programming syntax conventions.

## Features

### Syntax Highlighting
- Full syntax highlighting for Flex language constructs
- Support for keywords in multiple variants (e.g., `fun`/`sndo2`, `if`/`cond`)
- Recognition of Flex-specific types (`rakm`, `kasr`, `nass`, `so2al`, `dorg`)

### Error Detection & Linting
- Real-time error detection for syntax errors
- Detection of unbalanced brackets and parentheses
- Variable usage checking
- Customizable linting rules

### Code Formatting
- Automatic formatting to maintain consistent code style
- Format on save or via command
- Configurable indentation and style settings

### Bracket Matching & Code Folding
- Automatic matching of brackets, braces, and parentheses
- Code folding for blocks enclosed in braces
- Smart indentation based on language structure

### Refactoring Tools
- Rename symbols across files
- Extract functions and methods
- Smart code actions for common refactorings

### Command Palette Integration
- Run Flex files directly from VS Code
- Format documents with a single command
- Run linting on demand

### Project Navigation
- Go to definition support
- Find all references
- Symbol search across projects

### Customization & Settings
- Configurable path to the Flex interpreter/compiler
- Enable/disable linting and formatting
- Customize code style preferences

## Getting Started

### Installation

1. Install the extension from the VS Code Marketplace
2. Configure the path to your Flex interpreter in the settings

### Configuration

Access the extension settings through VS Code's settings menu:

```json
{
  "flex.linting.enable": true,
  "flex.formatting.enable": true,
  "flex.path": "/path/to/your/flex/interpreter"
}
```

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
   - Open a Flex file (`.flex`, `.fx`, or `.lx`)
   - Press `F5` or use Command Palette > `Flex: Run Current File`
   - The file will be executed using the configured Flex interpreter
   - Any output or errors will appear in the integrated terminal

4. Using AI-enhanced features:
   - When errors occur in your code, the extension will use the Flex interpreter's AI capabilities to provide context-aware error messages and suggestions
   - This is particularly helpful for learning the language or debugging complex issues

## Usage Examples

### Running Flex Code

1. Open a Flex file (`.flex`, `.fx`, or `.lx`)
2. Use the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and select `Flex: Run Current File`
3. Alternatively, right-click in the editor and select `Run Flex File`

### Formatting Code

1. Use the keyboard shortcut `Shift+Alt+F` to format the current document
2. Alternatively, right-click and select `Format Document`
3. Enable format on save in VS Code settings

### Linting

Linting occurs automatically as you type. To manually trigger linting:

1. Use the command palette and select `Flex: Lint Current File`
2. Errors and warnings will appear in the Problems panel

## Keyboard Shortcuts

| Feature | Shortcut |
|---------|----------|
| Format Document | `Shift+Alt+F` |
| Run Current File | `F5` |
| Go to Definition | `F12` |
| Find References | `Shift+F12` |
| Rename Symbol | `F2` |

## Development

### Building and Running the Extension

1. Clone the repository:
   ```bash
   git clone https://github.com/YourUsername/vscode-flex.git
   cd vscode-flex
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run compile
   ```

4. Launch for development:
   - Press `F5` to launch a new VS Code window with the extension loaded
   - Changes to the extension will automatically be applied with a reload

### Packaging the Extension

To create a `.vsix` package that can be installed in VS Code:

```bash
npm install -g vsce
vsce package
```

This will create a `.vsix` file that can be installed via:
- VS Code Command Palette > "Extensions: Install from VSIX..."
- Select the generated `.vsix` file

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This extension is licensed under the MIT License.
