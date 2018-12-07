/* @flow */

import type {
    TransactionInput,
    TransactionOutput,
} from '../../js/types/trezor.js';

declare module 'flowtype/tests/qtum-sign-transaction' {
    declare export type TestQtumSignTransactionPayload = {
        method: string,
        coin: string,
        inputs: Array<TransactionInput>,
        outputs: Array<TransactionOutput>,
    };

    declare export type ExpectedQtumSignTransactionResponse = {
        success?: boolean,
        payload?: {
            code?: string,
            serialized?: string,
            signatures?: Array<string>,
        }
    };
}
