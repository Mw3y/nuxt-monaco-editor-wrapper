import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override'
import getEditorServiceOverride from '@codingame/monaco-vscode-editor-service-override'
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override'
import type { WrapperConfig } from 'monaco-editor-wrapper'
import { useOpenEditorStub } from 'monaco-editor-wrapper/vscode/services'
import { Uri } from 'vscode'

export const createDefaultWrapperConfig = (workspacePath: string): WrapperConfig => ({
  editorAppConfig: {
    $type: 'extended',
    useDiffEditor: false,
    codeResources: {},
    userConfiguration: {
      json: JSON.stringify({
        'workbench.colorTheme': 'GitHub Light',
        'editor.guides.bracketPairsHorizontal': 'active',
        'editor.wordBasedSuggestions': 'off',
        'editor.quickSuggestionsDelay': 200,
      }),
    },
  },
  serviceConfig: {
    userServices: {
      ...getConfigurationServiceOverride(),
      ...getEditorServiceOverride(useOpenEditorStub),
      ...getKeybindingsServiceOverride(),
    },
    workspaceConfig: {
      workspaceProvider: {
        trusted: true,
        workspace: {
          workspaceUri: Uri.file(workspacePath),
        },
        async open() {
          return false
        },
      },
    },
    debugLogging: import.meta.dev,
  },
})
