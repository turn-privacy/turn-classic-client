import { Card } from "./Card";
import { Button } from "./Button";
import { WalletInfo } from "./WalletInfo";
import { TransactionSigningUI } from "./TransactionSigningUI";
import { signTransaction } from "../functions";
import { fromText, SignedMessage, UTxO } from "@lucid-evolution/lucid";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setRecipientType } from "../store/recipientSlice";

export interface PreviewNetworkProps {
    walletError: string | null;
    walletSelectList: string[];
    previewWallet: any;
    previewAddress: string | null;
    walletBalance: { lovelace: bigint } | null;
    recipientAddress: string | null;
    recipientSeedPhrase: string | null;
    pendingTransaction: any;
    isSigning: boolean;
    signStatus: string | null;
    socket: WebSocket | null;
    faucetSent: boolean;
    faucetTxHash: string | null;
    previewLucid: any;
    previewWalletApi: any;
    onSelectWallet: (walletName: string) => void;
    setError: (error: string | null) => void;
    setIsSigning: (signing: boolean) => void;
    setSignStatus: (status: string | null) => void;
    setManualRecipientAddress: (address: string) => void;
    manualRecipientAddress: string | null;
}

export const PreviewNetwork: React.FC<PreviewNetworkProps> = ({
    walletError,
    walletSelectList,
    previewWallet,
    previewAddress,
    walletBalance,
    recipientAddress,
    recipientSeedPhrase,
    pendingTransaction,
    isSigning,
    signStatus,
    socket,
    faucetSent,
    faucetTxHash,
    previewLucid,
    previewWalletApi,
    onSelectWallet,
    setError,
    setIsSigning,
    setSignStatus,
    setManualRecipientAddress,
    manualRecipientAddress,
}) => {
    const dispatch = useAppDispatch();
    const recipientType = useAppSelector(state => state.recipient.recipientType);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {walletError ? (
                <Card title="Error" error>
                    <p>{walletError}</p>
                </Card>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem" }}>
                    {walletSelectList.map(wallet => (
                        <Button
                            key={wallet}
                            onClick={() => onSelectWallet(wallet)}
                            style={{
                                backgroundColor: previewWallet && (window as any).cardano[wallet] === previewWallet ? "#00aaff" : "transparent"
                            }}
                        >
                            {wallet}
                        </Button>
                    ))}
                </div>
            )}

            {previewAddress && (
                <>
                    <WalletInfo
                        address={previewAddress}
                        seedPhrase=""
                        emoji="💳"
                        balance={walletBalance}
                        faucetInfo={{
                            sent: faucetSent,
                            txHash: faucetTxHash
                        }}
                        onRequestFunds={() => {
                            if (socket && previewAddress) {
                                socket.send(JSON.stringify({ type: "faucet", address: previewAddress }));
                            }
                        }}
                        onSignup={() => {
                            if (socket && previewAddress && recipientAddress && previewLucid) {
                                const payload = fromText(JSON.stringify({
                                    recipient: recipientAddress,
                                    extraMsg: "this is another field"
                                }));

                                previewLucid.wallet().signMessage(previewAddress, payload)
                                    .then((signedMessage: SignedMessage) => {
                                        socket.send(JSON.stringify({
                                            type: "signup",
                                            address: previewAddress,
                                            signedMessage,
                                            payload
                                        }));
                                    })
                                    .catch((error: Error) => {
                                        console.error("Error signing signup message:", error);
                                        setError("Failed to sign signup message");
                                    });
                            }
                        }}
                        socket={socket}
                    />

                    <TransactionSigningUI
                        pendingTransaction={pendingTransaction}
                        isSigning={isSigning}
                        signStatus={signStatus}
                        onSign={async () => {
                            if (socket && previewLucid && !isSigning) {
                                setIsSigning(true);
                                try {
                                    const success = await signTransaction(pendingTransaction, null, socket, previewLucid);
                                    if (success) {
                                        setSignStatus("Sending signature to server...");
                                    } else {
                                        setSignStatus("Failed to sign transaction. Please try again.");
                                    }
                                } catch (error) {
                                    console.error("Error in signing process:", error);
                                    setSignStatus("An error occurred during signing.");
                                } finally {
                                    setIsSigning(false);
                                }
                            }
                        }}
                    />

                    <div className="recipient-wallet-parent">
                        <Card title="Choose How You Want To Create Your Recipient Wallet">
                            <div style={{ display: "flex", flexDirection: "row", gap: "1rem" }}>
                                <Button onClick={() => {
                                    dispatch(setRecipientType("random"));
                                }}>
                                    Random Thow-Away Wallet
                                </Button>
                                <Button onClick={() => {
                                    dispatch(setRecipientType("fresh"));
                                }}>
                                    Enter A Fresh Wallet Address
                                </Button>
                            </div>
                        </Card>

                        {recipientType === "random" && (
                            <WalletInfo
                                address={recipientAddress || ""}
                                seedPhrase={recipientSeedPhrase || ""}
                                emoji="🌆"
                                showRecycle={true}
                                onRecycleTada={async () => {
                                    if (recipientSeedPhrase && previewLucid) {
                                        // Switch to recipient wallet
                                        previewLucid.selectWallet.fromSeed(recipientSeedPhrase);
                                        try {
                                            const tx = await previewLucid
                                                .newTx()
                                                .pay.ToAddress(
                                                    "addr_test1qryvgass5dsrf2kxl3vgfz76uhp83kv5lagzcp29tcana68ca5aqa6swlq6llfamln09tal7n5kvt4275ckwedpt4v7q48uhex",
                                                    {
                                                        lovelace: (await previewLucid.wallet().getUtxos().then((utxos: UTxO[]) =>
                                                            utxos.reduce((acc: bigint, utxo: UTxO) => acc + utxo.assets.lovelace, BigInt(0)))) - BigInt(2_000_000)
                                                    }
                                                )
                                                .complete();
                                            const signedTx = await tx.sign.withWallet().complete();
                                            const txHash = await signedTx.submit();
                                            console.log("Sent all ADA from recipient wallet. Tx:", txHash);
                                        } catch (error) {
                                            console.error("Failed to send ADA:", error);
                                        } finally {
                                            // Switch back to original wallet
                                            previewLucid.selectWallet.fromAPI(previewWalletApi);
                                        }
                                    }
                                }}
                            />
                        )}
                        {recipientType === "fresh" && (
                            <ManualRecipientWallet
                                manualRecipientAddress={manualRecipientAddress}
                                setManualRecipientAddress={setManualRecipientAddress}
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

interface ManualRecipientWalletProps {
    setManualRecipientAddress: (address: string) => void;
    manualRecipientAddress: string | null;
}

const ManualRecipientWallet: React.FC<ManualRecipientWalletProps> = ({ setManualRecipientAddress, manualRecipientAddress }) => {
    return <Card title="Manual Recipient Wallet">
        Manual Recipient Wallet
        <input type="text" value={manualRecipientAddress || ""} onChange={(e) => setManualRecipientAddress(e.target.value)} />
        



    </Card>;
};