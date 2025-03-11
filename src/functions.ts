import { Emulator, Lucid, SignedMessage, fromText, generateSeedPhrase } from "@lucid-evolution/lucid";

export const init_get_wallet_address = async (): Promise<[string, string]> => {
  const emulator = new Emulator([]);
  const offlineLucid = await Lucid(emulator, "Preview");
  const seedPhrase = generateSeedPhrase();
  offlineLucid.selectWallet.fromSeed(seedPhrase);
  const address = await offlineLucid.wallet().address();
  return [address, seedPhrase];
}

export const signup = async (recipientAddress: string, senderSeed: string, ws: WebSocket) => {
  const payload = fromText(JSON.stringify({
    recipient: recipientAddress,
    extraMsg: "this is another field"
  }));

  const lucid = await Lucid(new Emulator([]), "Preview");
  lucid.selectWallet.fromSeed(senderSeed);
  const address = await lucid.wallet().address();

  const signedMessage: SignedMessage = await lucid.wallet().signMessage(address, payload);
  ws.send(JSON.stringify({
    type: "signup",
    address,
    signedMessage,
    payload
  }));
}

export const signTransaction = async (txData: any, senderSeed: string | null, ws: WebSocket, previewLucid: any = null) => {
  console.log("Signing transaction:", txData);
  try {
    let witness;
    if (previewLucid) {
      // For Preview network, use the connected wallet
      witness = await previewLucid.fromTx(txData.tx).partialSign.withWallet();
    } else {
      // For Local network, use the seed phrase
      const lucid = await Lucid(new Emulator([]), "Preview");
      lucid.selectWallet.fromSeed(senderSeed!);
      witness = await lucid.fromTx(txData.tx).partialSign.withWallet();
    }

    // Send the witness back to the server
    ws.send(JSON.stringify({
      type: "submit_signature",
      data: {
        witness,
        address: previewLucid ? await previewLucid.wallet().address() : null
      }
    }));

    return true;
  } catch (error) {
    console.error("Error signing transaction:", error);
    return false;
  }
}


