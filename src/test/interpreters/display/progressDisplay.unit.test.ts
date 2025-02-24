// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { expect } from 'chai';
import { anything, capture, instance, mock, when } from 'ts-mockito';
import { CancellationToken, Disposable, Progress, ProgressOptions } from 'vscode';
import { ApplicationShell } from '../../../client/common/application/applicationShell';
import { createDeferred, Deferred } from '../../../client/common/utils/async';
import { Interpreters } from '../../../client/common/utils/localize';
import { IComponentAdapter } from '../../../client/interpreter/contracts';
import { InterpreterLocatorProgressStatubarHandler } from '../../../client/interpreter/display/progressDisplay';
import { noop } from '../../core';

type ProgressTask<R> = (
    progress: Progress<{ message?: string; increment?: number }>,
    token: CancellationToken,
) => Thenable<R>;

suite('Interpreters - Display Progress', () => {
    let refreshingCallback: (e: void) => unknown | undefined;
    let refreshDeferred: Deferred<void>;
    let componentAdapter: IComponentAdapter;
    setup(() => {
        refreshDeferred = createDeferred<void>();
        componentAdapter = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onRefreshStart(listener: (e: void) => any): Disposable {
                refreshingCallback = listener;
                return { dispose: noop };
            },
            refreshPromise: refreshDeferred.promise,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
    });
    teardown(() => {
        refreshDeferred.resolve();
    });
    test('Display discovering message when refreshing interpreters for the first time', async () => {
        const shell = mock(ApplicationShell);
        const statusBar = new InterpreterLocatorProgressStatubarHandler(instance(shell), [], componentAdapter);
        when(shell.withProgress(anything(), anything())).thenResolve();

        await statusBar.activate();
        refreshingCallback(undefined);

        const options = capture(shell.withProgress as never).last()[0] as ProgressOptions;
        expect(options.title).to.be.equal(Interpreters.discovering());
    });

    test('Display refreshing message when refreshing interpreters for the second time', async () => {
        const shell = mock(ApplicationShell);
        const statusBar = new InterpreterLocatorProgressStatubarHandler(instance(shell), [], componentAdapter);
        when(shell.withProgress(anything(), anything())).thenResolve();

        await statusBar.activate();
        refreshingCallback(undefined);

        let options = capture(shell.withProgress as never).last()[0] as ProgressOptions;
        expect(options.title).to.be.equal(Interpreters.discovering());

        refreshingCallback(undefined);

        options = capture(shell.withProgress as never).last()[0] as ProgressOptions;
        expect(options.title).to.be.equal(Interpreters.refreshing());
    });

    test('Progress message is hidden when loading has completed', async () => {
        const shell = mock(ApplicationShell);
        const statusBar = new InterpreterLocatorProgressStatubarHandler(instance(shell), [], componentAdapter);
        when(shell.withProgress(anything(), anything())).thenResolve();

        await statusBar.activate();
        refreshingCallback(undefined);

        const options = capture(shell.withProgress as never).last()[0] as ProgressOptions;
        const callback = capture(shell.withProgress as never).last()[1] as ProgressTask<void>;
        const promise = callback(undefined as never, undefined as never);

        expect(options.title).to.be.equal(Interpreters.discovering());

        refreshDeferred.resolve();
        // Promise must resolve when refreshed callback is invoked.
        // When promise resolves, the progress message is hidden by VSC.
        await promise;
    });
});
