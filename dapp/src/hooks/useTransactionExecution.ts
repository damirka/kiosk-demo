// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useWalletKit } from '@mysten/wallet-kit';
import { useRpc } from './useRpc';
import {
  SuiTransactionBlockResponseOptions,
  TransactionBlock,
} from '@mysten/sui.js';

import { toast } from 'react-hot-toast';

// A helper to execute transactions by:
// 1. Signing them using the wallet
// 2. Executing them using the rpc provider
export function useTransactionExecution() {
  const provider = useRpc();

  // sign transaction from the wallet
  const { signTransactionBlock } = useWalletKit();

  // tx: TransactionBlock
  const signAndExecute = async ({
    tx,
    options = { showEffects: true },
  }: {
    tx: TransactionBlock;
    options?: SuiTransactionBlockResponseOptions | undefined;
  }) => {
    try {
      const signedTx = await signTransactionBlock({ transactionBlock: tx });

      const res = await provider.executeTransactionBlock({
        transactionBlock: signedTx.transactionBlockBytes,
        signature: signedTx.signature,
        options,
      });

      return res;
    } catch (e: unknown) {
      if (typeof e === 'string') toast.error(e);
      if (e instanceof Error) toast.error(e.message);
      return false;
    }
  };

  return { signAndExecute };
}
