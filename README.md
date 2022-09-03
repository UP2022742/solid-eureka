# solid-eureka
WebGL v1 Experimental

## Pre-requisites
Install the debugging tools.

1. Install the extension [GLSL Lint](https://marketplace.visualstudio.com/items?itemName=dtoplak.vscode-glsllint).
2. Install the [debugger](https://github.com/KhronosGroup/glslang/releases/tag/master-tot)
3. Add this line to the settings.json file:
```json
{
    "glsllint.glslangValidatorPath": "C:\\path\\to\\bin\\glslangValidator.exe",
}
```
## Installation
```
npm install
```

## Usage
```
node index.js
```

Navigate to http://localhost:3000