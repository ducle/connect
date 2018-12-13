/* @flow */
// Qtum types

import type { $Common } from './params';
import type { Unsuccessful$ } from './response';

import type {
    SignedTx,
} from './trezor';

export type $QtumSignTransaction = $Common & {
    inputs: Array<TransactionInput>,
    outputs: Array<TransactionOutput>,
    coin: string,
    push?: boolean,
}

export type QtumSignTransaction$ = {
    success: true,
    payload: SignedTx,
} | Unsuccessful$;
