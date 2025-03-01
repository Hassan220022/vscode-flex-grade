#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Get the input file from command line arguments
const inputFile = process.argv[2];

if (!inputFile) {
    console.error('Error: No input file specified');
    process.exit(1);
}

// Determine the OS
const platform = os.platform();
const isWindows = platform === 'win32';

// Get the directory where this script is located
const scriptDir = __dirname;

// Determine which script to run based on OS
const scriptToRun = isWindows ? path.join(scriptDir, 'run-flex.bat') : path.join(scriptDir, 'run-flex.sh');

// Check if the script exists
if (!fs.existsSync(scriptToRun)) {
    console.error(`Error: Script ${scriptToRun} not found`);
    process.exit(1);
}

// Make the script executable on Unix-like systems
if (!isWindows) {
    try {
        fs.chmodSync(scriptToRun, '755');
    } catch (error) {
        console.warn(`Warning: Could not make ${scriptToRun} executable: ${error.message}`);
    }
}

// Run the appropriate script
const child = isWindows
    ? spawn('cmd.exe', ['/c', scriptToRun, inputFile], { stdio: 'inherit' })
    : spawn(scriptToRun, [inputFile], { stdio: 'inherit' });

// Handle process exit
child.on('exit', (code) => {
    process.exit(code);
});

// Handle errors
child.on('error', (error) => {
    console.error(`Error executing script: ${error.message}`);
    process.exit(1);
}); 