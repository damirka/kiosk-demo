// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import {
  JsonRpcProvider,
  SharedObjectRef,
  SuiObjectDataOptions,
  SuiObjectRef,
  TransactionArgument,
  TransactionBlock,
} from '@mysten/sui.js';
import { KioskData } from './query/kiosk';
import { DynamicFieldInfo } from '@mysten/sui.js/dist/types/dynamic_fields';

/**
 * A valid argument for any of the Kiosk functions.
 */
export type ObjectArgument =
  | string
  | TransactionArgument
  | SharedObjectRef
  | SuiObjectRef;

/**
 * Convert any valid input into a TransactionArgument.
 *
 * @param tx The transaction to use for creating the argument.
 * @param arg The argument to convert.
 * @returns The converted TransactionArgument.
 */
export function objArg(
  tx: TransactionBlock,
  arg: string | SharedObjectRef | SuiObjectRef | TransactionArgument,
): TransactionArgument {
  if (typeof arg === 'string') {
    return tx.object(arg);
  }

  if ('digest' in arg && 'version' in arg && 'objectId' in arg) {
    return tx.objectRef(arg);
  }

  if ('objectId' in arg && 'initialSharedVersion' in arg && 'mutable' in arg) {
    return tx.sharedObjectRef(arg);
  }

  if ('kind' in arg) {
    return arg;
  }

  throw new Error('Invalid argument type');
}

// helper to extract kiosk data from dynamic fields.
export const extractKioskData = (data: DynamicFieldInfo[]): KioskData => {
  return data.reduce<KioskData>(
    (acc: KioskData, val: DynamicFieldInfo) => {
      // e.g. 0x2::kiosk::Item -> kiosk::Item
      const type = val.name.type.split('::').slice(-2).join('::');

      switch (type) {
        case 'kiosk::Item':
          acc.itemIds.push(val.objectId);
          acc.items.push({
            itemId: val.objectId,
            itemType: val.objectType,
            bcsName: val.bcsName,
          });
          break;
        case 'kiosk::Listing':
          acc.listingIds.push(val.objectId);
          acc.listings.push({
            itemId: val.name.value.id,
            listingId: val.objectId,
            isExclusive: val.name.value.is_exclusive,
            bcsName: val.bcsName,
          });
          break;
      }
      return acc;
    },
    { listings: [], items: [], itemIds: [], listingIds: [] },
  );
}


// simple multiGetObjects wrapper to simplify cases on functions.
export const getObjects = async (provider: JsonRpcProvider, ids: string[], options: SuiObjectDataOptions) => {

  if (ids.length === 0) return [];

  return await provider.multiGetObjects({
    ids,
    options
  });
}
