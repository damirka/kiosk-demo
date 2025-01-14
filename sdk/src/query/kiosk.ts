// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import {
  JsonRpcProvider,
  PaginationArguments,
  SuiAddress,
  SuiObjectDataOptions,
  SuiObjectResponse,
} from '@mysten/sui.js';
import { extractKioskData, getObjects } from '../utils';

/**
 * A dynamic field `Listing { ID, isExclusive }` attached to the Kiosk.
 * Holds a `u64` value - the price of the item.
 */
export type KioskListing = {
  /** The ID of the Item */
  itemId: string;
  /**
   * Whether or not there's a `PurchaseCap` issued. `true` means that
   * the listing is controlled by some logic and can't be purchased directly.
   *
   * TODO: consider renaming the field for better indication.
   */
  isExclusive: boolean;

  /** The ID of the listing */
  listingId: string;
  /** Can be used to query a dynamic field */
  bcsName: string;
};

/**
 * A dynamic field `Item { ID }` attached to the Kiosk.
 * Holds an Item `T`. The type of the item is known upfront.
 */
export type KioskItem = {
  /** The ID of the Item */
  itemId: string;
  /** The type of the Item */
  itemType: string;
  /** Can be used to query a dynamic field */
  bcsName: string;
};

/**
 * Aggregated data from the Kiosk.
 */
export type KioskData = {
  items: KioskItem[] | SuiObjectResponse[];
  listings: KioskListing[] | SuiObjectResponse[];
  itemIds: string[];
  listingIds: string[];
};

export type PagedKioskData = {
  data: KioskData;
  nextCursor: string | null;
  hasNextPage: boolean;
};

export type FetchKioskOptions = {
  includeItems?: boolean;
  itemOptions?: SuiObjectDataOptions;
  includeListings?: boolean;
  listingOptions?: SuiObjectDataOptions;
}

/**
 * 
 */
export async function fetchKiosk(
  provider: JsonRpcProvider,
  kioskId: SuiAddress,
  pagination: PaginationArguments<string>,
  {
    includeItems = false,
    includeListings = false,
    itemOptions = { showDisplay: true, showType: true },
    listingOptions = { showContent: true }
  }: FetchKioskOptions
): Promise<PagedKioskData> {
  provider.multiGetObjects
  const { data, nextCursor, hasNextPage } = await provider.getDynamicFields({
    parentId: kioskId,
    ...pagination,
  });

  // extracted kiosk data.
  const kioskData = extractKioskData(data);

  // split the fetching in two queries as we are most likely passing different options for each kind.
  // For items, we usually seek the Display.
  // For listings we usually seek the DF value (price) / exclusivity.
  const [itemObjects, listingObjects] = await Promise.all([
    includeItems ? getObjects(provider, kioskData.itemIds, itemOptions) : Promise.resolve([]),
    includeListings ? getObjects(provider, kioskData.listingIds, listingOptions) : Promise.resolve([]),
  ]);

  if (includeItems) kioskData.items = itemObjects;
  if (includeListings) kioskData.listings = listingObjects;

  return {
    data: kioskData,
    nextCursor,
    hasNextPage,
  };
}
