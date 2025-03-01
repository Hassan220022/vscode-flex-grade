#!/bin/bash

# Get the absolute path of the input file
INPUT_FILE="$1"
ABSOLUTE_PATH=$(realpath "$INPUT_FILE")

# Change to the Sindbad/src directory
cd /Users/mikawi/Developer/python/grad/Sindbad/src

# Run the Flex interpreter with the absolute path
python3 main.py "$ABSOLUTE_PATH" 