import * as LitJsSdk from "lit-js-sdk";

const client = new LitJsSdk.LitNodeClient()
const chain = 'ethereum'
const accessControlConditions = [
  {
    contractAddress: '',
    standardContractType: '',
    chain,
    method: 'eth_getBalance',
    parameters: [
      ':userAddress',
      'latest'
    ],
    returnValueTest: {
      comparator: '>=',
      value: '10000000000000'
    }
  }
]

const hexStringToArrayBuffer = (hexString) => {
  hexString = hexString.replace(/^0x/, '');
  if (hexString.length % 2 !== 0) {
    // eslint-disable-next-line no-console
    console.log('WARNING: expecting an even number of characters in the hexString');
  }
  const bad = hexString.match(/[G-Z\s]/i);
  if (bad) {
    // eslint-disable-next-line no-console
    console.log('WARNING: found non-hex characters', bad);
  }
  const pairs = hexString.match(/[\dA-F]{2}/gi);
  const integers = pairs.map(function (s) {
    return parseInt(s, 16);
  });
  const array = new Uint8Array(integers);
  return array.buffer;
}

class Lit {
  litNodeClient

  async connect() {
    await client.connect()
    this.litNodeClient = client
  }

  async encryptString(str) {
    if (!this.litNodeClient) {
      await this.connect()
    }
    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain })
    //const fileAsArrayBuffer = new Blob([file.buffer]);
    //console.log('File Array Buffer: ', fileAsArrayBuffer);
    //console.log('array buffer: ', fileAsArrayBuffer.arrayBuffer());

    const { encryptedFile, symmetricKey } = await LitJsSdk.encryptString(str)

    const encryptedSymmetricKey = await this.litNodeClient.saveEncryptionKey({
      accessControlConditions,
      symmetricKey,
      authSig,
      chain,
    })

    return {
      encryptedFile: await encryptedFile.arrayBuffer(),
      encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16")
    }
  }

  async decryptString(encryptedStr, encryptedSymmetricKey) {
    if (!this.litNodeClient) {
      await this.connect()
    }
    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain })
    const symmetricKey = await this.litNodeClient.getEncryptionKey({
      accessControlConditions,
      toDecrypt: encryptedSymmetricKey,
      chain,
      authSig
    })
    const decryptedFile = await LitJsSdk.decryptString(
      new Blob([hexStringToArrayBuffer(encryptedStr)]),
      symmetricKey
    );
    // eslint-disable-next-line no-console
    console.log({
      decryptedFile
    })
    return { decryptedFile }
  }
}

export default new Lit()
