/* @flow */
'use strict';

import AbstractMethod from './AbstractMethod';
import { validateParams } from './helpers/paramsValidator';
import { getCoinInfoByCurrency } from '../../data/CoinInfo';
import { getLabel } from '../../utils/pathUtils';
import { NO_COIN_INFO } from '../../constants/errors';
import { Transaction as BitcoinJsTransaction } from 'bitcoinjs-lib-zcash';

import * as helper from './helpers/signtx';

import {
    validateTrezorInputs,
    validateTrezorOutputs,
    inputToHD,
    transformReferencedTransactions,
} from './tx';

import type {
    TransactionInput,
    TransactionOutput,
    SignedTx,
} from '../../types/trezor';

import type {
    BuildTxInput,
} from 'hd-wallet';

import type { CoinInfo } from 'flowtype';
import type { CoreMessage } from '../../types';

type Params = {
    inputs: Array<TransactionInput>,
    hdInputs: Array<BuildTxInput>,
    outputs: Array<TransactionOutput>,
    coinInfo: CoinInfo,
    prevTxHexList: Array<string>,
    push: boolean,
}

export default class QtumSignTransaction extends AbstractMethod {
    params: Params;

    constructor(message: CoreMessage) {
        super(message);
        this.requiredPermissions = ['read', 'write'];
        this.info = 'Sign transaction';

        const payload: Object = message.payload;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'inputs', type: 'array', obligatory: true },
            { name: 'outputs', type: 'array', obligatory: true },
            { name: 'coin', type: 'string', obligatory: true },
            { name: 'push', type: 'boolean' },
        ]);

        const coinInfo: ?CoinInfo = getCoinInfoByCurrency(payload.coin);
        if (!coinInfo) {
            throw NO_COIN_INFO;
        } else {
            // set required firmware from coinInfo support
            this.requiredFirmware = [ coinInfo.support.trezor1, coinInfo.support.trezor2 ];
            this.info = getLabel('Sign #NETWORK transaction', coinInfo);
        }

        payload.inputs.forEach(utxo => {
            validateParams(utxo, [
                { name: 'amount', type: 'string' },
            ]);
        });

        payload.outputs.forEach(utxo => {
            validateParams(utxo, [
                { name: 'amount', type: 'string' },
            ]);
        });

        const inputs: Array<TransactionInput> = validateTrezorInputs(payload.inputs, coinInfo);
        const hdInputs: Array<BuildTxInput> = inputs.map(inputToHD);
        const outputs: Array<TransactionOutput> = validateTrezorOutputs(payload.outputs, coinInfo);

        const total: number = outputs.reduce((t, r) => t + r.amount, 0);
        if (total <= coinInfo.dustLimit) {
            throw new Error('Total amount is too low.');
        }

        this.params = {
            inputs,
            hdInputs,
            outputs: payload.outputs,
            coinInfo,
            prevTxHexList: payload.prevTxHexList,
            push: payload.hasOwnProperty('push') ? payload.push : false,
        };
    }

    async run(): Promise<SignedTx> {
        const bjsRefTxs = this.params.prevTxHexList.map(item => {
            return BitcoinJsTransaction.fromHex(item, false);
        });

        const refTxs = transformReferencedTransactions(bjsRefTxs);

        const response = await helper.signTx(
            this.device.getCommands().typedCall.bind(this.device.getCommands()),
            this.params.inputs,
            this.params.outputs,
            refTxs,
            this.params.coinInfo,
        );

        return response;
    }
}
