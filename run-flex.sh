#!/bin/bash

# Path to the Sindbad directory
SINDBAD_DIR="/Users/mikawi/Developer/python/grad/Sindbad/src"

# Change to the Sindbad/src directory
cd "$SINDBAD_DIR"

# Run the Flex interpreter with the absolute path
python3 main.py "/Users/mikawi/Developer/vscode-flex/examples/demo.flex"