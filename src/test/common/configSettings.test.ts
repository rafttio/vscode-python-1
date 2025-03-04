import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { IS_WINDOWS } from '../../client/common/platform/constants';
import { SystemVariables } from '../../client/common/variables/systemVariables';
import { getExtensionSettings } from '../common';
import { initialize } from './../initialize';

const workspaceRoot = path.join(__dirname, '..', '..', '..', 'src', 'test');

// Defines a Mocha test suite to group tests of similar kind together
suite('Configuration Settings', () => {
    setup(initialize);

    test('Check Values', (done) => {
        const systemVariables: SystemVariables = new SystemVariables(undefined, workspaceRoot);

        const pythonConfig = vscode.workspace.getConfiguration('python', (null as any) as vscode.Uri);
        const pythonSettings = getExtensionSettings(vscode.Uri.file(workspaceRoot));
        Object.keys(pythonSettings).forEach((key) => {
            let settingValue = pythonConfig.get(key, 'Not a config');
            if (settingValue === 'Not a config') {
                return;
            }
            if (settingValue) {
                settingValue = systemVariables.resolve(settingValue);
            }

            const pythonSettingValue = (pythonSettings as any)[key] as string;
            if (key.endsWith('Path') && IS_WINDOWS) {
                assert.strictEqual(
                    settingValue.toUpperCase(),
                    pythonSettingValue.toUpperCase(),
                    `Setting ${key} not the same`,
                );
            }
        });

        done();
    });
});
