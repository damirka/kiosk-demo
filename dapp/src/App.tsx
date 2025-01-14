// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import './App.css';
import { SuiConnectButton } from './components/SuiConnectButton';
import { useWalletKit } from '@mysten/wallet-kit';
import { useRpc } from './hooks/useRpc';
import { KIOSK_OWNER_CAP, createKioskAndShare } from '@mysten/kiosk';
import { useEffect, useState } from 'react';
import { TransactionBlock, getObjectFields, getObjectId } from '@mysten/sui.js';
import { useTransactionExecution } from './hooks/useTransactionExecution';
import { KioskData } from './components/KioskData';
import { Loading } from './components/Loading';

function App() {
  const { currentAccount } = useWalletKit();
  const [kioskIds, setKioskIds] = useState<string[]>([]);
  const [kioskOwnerCaps, setKioskOwnerCaps] = useState<string[]>([]);
  const [loadingCap, setLoadingCap] = useState<boolean>(false);
  const { signAndExecute } = useTransactionExecution();
  const [kioskId, setKioskId] = useState<string | null>(null);
  const provider = useRpc();

  const findUserKiosks = async () => {
    if (!currentAccount?.address) return;

    setLoadingCap(true);

    // get kiosk owner Cap objects
    const kiosks = await provider.getOwnedObjects({
      owner: currentAccount.address,
      filter: { StructType: `${KIOSK_OWNER_CAP}` },
      options: {
        showContent: true,
      },
    });

    setKioskIds(kiosks?.data?.map((x) => getObjectFields(x)?.for));
    setKioskOwnerCaps(kiosks?.data.map((x) => getObjectId(x)));

    setLoadingCap(false);
  };

  const createNewKiosk = async () => {
    if (!currentAccount?.address) return;

    const tx = new TransactionBlock();
    const kiosk_cap = createKioskAndShare(tx);

    tx.transferObjects(
      [kiosk_cap],
      tx.pure(currentAccount?.address, 'address'),
    );

    await signAndExecute({ tx });
    findUserKiosks();
  };

  useEffect(() => {
    if (!currentAccount?.address) {
      setKioskIds([]);
    }
    findUserKiosks();
  }, [currentAccount?.address]);

  return (
    <div className="container min-h-screen">
      <div>
        {!kioskId && (
          <div className=" mb-12 min-h-screen flex items-center justify-center">
            <div>
              <SuiConnectButton></SuiConnectButton>

              {loadingCap && <Loading />}

              {!loadingCap && (
                <>
                  {kioskIds.length > 0 && (
                    <div className="mb-20 mt-6 text-center">
                      <button
                        onClick={() => {
                          setKioskId(kioskIds[0]);
                        }}
                      >
                        View Kiosk
                      </button>
                    </div>
                  )}

                  {currentAccount && (
                    <div className="flex gap-4 mt-6 justify-center">
                      {kioskIds.length < 1 && (
                        <button onClick={createNewKiosk}>
                          Create New Kiosk
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {kioskId && (
          <KioskData
            kioskOwnerCap={kioskOwnerCaps[0]}
            kioskId={kioskId}
            setSelectedKiosk={setKioskId}
          />
        )}
      </div>

      <div className="mt-6 border-t border-primary text-center py-6">
        Copyright © 2023 by Mysten Labs
      </div>
    </div>
  );
}

export default App;
