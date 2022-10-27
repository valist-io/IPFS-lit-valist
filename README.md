# Example App using IPFS and Lit

![Image for application](/public/UnlockableContent.png)
To show how to use Lit, we’ll build a DApp with a React frontend. The DApp connects to [IPFS (InterPlanetary File System)](https://docs.ipfs.tech/concepts/what-is-ipfs/) to upload files, stores the Lit encrypted IPFS content identifier (CID) to the application’s state, and decrypts the CID to display the uploaded file. The access control conditions for encrypting and decrypting the file will be whether or not the connected wallet holds a [Monster Suit NFT](https://opensea.io/collection/monster-suit).

Currently, there are a few platforms that support NFTs with unlockable content. Generally, content that is unlockable is only unlockable on the platform it was created on. What is unlockable on OpenSea is not unlockable on Zora.

Using Lit Protocol, it's possible to provision decryption keys so any content can be decentralized and private, essentially encrypted and unlockable. Imagine a future where an NFT that is unlockable on OpenSea is unlockable on SolSea. Additionally, Lit Protocol makes it possible to have unlockable content accessible outside of traditional NFT platforms. One example is token gating items in a Shopify store.

**What is IPFS**

[IPFS](https://ipfs.io/) is a communication protocol that uses peer-to-peer networking to store, retrieve, and share data through a distributed file system mechanism. 

On IFPS, when you upload data to an existing node on the protocol, the data is distributed into smaller chunks, then hashed and given a unique content identifier (CID). For every new upload of new data or previously uploaded data, a new cryptographic hash (CID) is generated, making every upload to the network unique.

Use of IPFS in the wild:

- [Ceramic](https://ceramic.network/), which builds and extends IPFS to create open source data streams.

This guide starts with a base React application with IPFS set up. You can fork [this branch of the project](https://github.com/debbly/IPFS-lit/tree/without-lit) and follow along or see the complete code with Lit [here](https://github.com/debbly/IPFS-lit).

![Lit site GIF](/public/lit.gif)

The full process for uploading and viewing the files should not change significantly from the base IPFS application to the application that uses Lit Protocol. The main visual addition is the decryption button.

## **Installation and Initializing Lit** 

Update the IPFS projectID and projectSecret to your IPFS project information. If you do not have an Infura account, go [here](https://infura.io/) to sign up.

Add the Lit JS SDK to your project.

```jsx
yarn add lit-js-sdk
```

Within your /src folder, create a lib folder and create a lit.js file.

At the top of the lit.js file, include the Lit JS SDK

```jsx
import * as LitJsSdk from "lit-js-sdk";
```

 The SDK requires an active connection to the LIT nodes to store and retrieve encryption keys and signing requests. We’ll initialize a LitNodeClient and set it within the connect function.

```jsx
const client = new LitJsSdk.LitNodeClient();

class Lit {
  litNodeClient;

  async connect() {
    await client.connect();
    this.litNodeClient = client;
  }
}

export default new Lit();
```

Before the Lit class, we are going to set a global access control condition. [Access control conditions](https://developer.litprotocol.com/coreConcepts/accessControl/intro) are how on-chain conditions are set. Examples of on-chain conditions are:

- User is a member of a DAO
- User holds an NFT in a collection
- User holds at least 0.1 ETH
- User owns a specific wallet address
- Using boolean operations (AND + OR) for any of the above

For this example, we are going to set the access control on if the wallet contains at least one [Monster Suit NFT](https://opensea.io/collection/monster-suit).

```jsx
const chain = 'ethereum'

// Must hold at least one Monster Suit NFT ([https://opensea.io/collection/monster-suit](https://opensea.io/collection/monster-suit))
const accessControlConditionsNFT = [
	{
		contractAddress: '0x89b597199dAc806Ceecfc091e56044D34E59985c',
		standardContractType: 'ERC721',
		chain,
		method: 'balanceOf',
		parameters: [
			':userAddress'
		],
		returnValueTest: {
			comparator: '>',
			value: '0'
		}
	}
];
```

The contract address of the NFT collection is: `0x89b597199dAc806Ceecfc091e56044D34E59985c` and the contract type is `ERC721`.

Within the returnValueTest is where we check that the wallet contains at least one Monster Suit NFT.

## **Encrypt and Upload**

![Encrypt with Lit](/public/encrypt.png)

Within your lit.js file, add an encryptString function. 

```jsx
async encryptString(str) {
    if (!this.litNodeClient) {
      await this.connect();
    }
  }
```

Within the encryptString function, we will encrypt the string and tell the Lit Node Client to save the relationship between the access control condition(s) and the symmetric key. This will be necessary for decrypting.

Lit functions explained:

- **checkAndSignAuthMessage**: Checks for an existing cryptographic authentication signature and creates one if it doesn’t exist. This is used to prove ownership of a given wallet address to the Lit nodes.
- **encryptString**: Encrypts any string.
- **saveEncryptionKey**: Securely saves the association between access control conditions and the content we want to decrypt.
- **uint8arrayToString**: Helper function that converts a Uint8Array to a string.

```jsx
const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(str);

const encryptedSymmetricKey = await this.litNodeClient.saveEncryptionKey({
  accessControlConditions: accessControlConditionsNFT,
  symmetricKey,
  authSig,
  chain,
});

return {
  encryptedFile: encryptedString,
  encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16")
};
```

Go to the App.js file. Within the App function, add in two states to keep track of the encrypted URL array and the encrypted symmetric key array. 

```jsx
const [encryptedUrlArr, setEncryptedUrlArr] = useState([]);
const [encryptedKeyArr, setEncryptedKeyArr] = useState([]);
```

Within the handleSubmit function, add in your call to encrypt the URL. This should happen after the file has been uploaded to IPFS and a path is obtained. The created variable will hold a CID (a unique content identifier) and a string path. In order to obtain the URL to IPFS, we will use the path to construct the URL. 

Your handleSubmit function should look like this:

```jsx
async function handleSubmit(e) {
    e.preventDefault();

    try {
       const created = await client.add(file);
      const url = `https://infura-ipfs.io/ipfs/${created.path}`;

      const encrypted = await lit.encryptString(url);

      setEncryptedUrlArr((prev) => [...prev, encrypted.encryptedFile]);
      setEncryptedKeyArr((prev) => [...prev, encrypted.encryptedSymmetricKey]);
    } catch (error) {
      console.log(error.message);
    }
  }
```

To check if we’re on the correct path, we can add in a few console logs to check the encrypted output. 

For the following IPFS url:

[`https://infura-ipfs.io/ipfs/QmZDBKSsgRaESLH3TZJgwShubQo5omuoy1yoRn1ksTDnjm`](https://infura-ipfs.io/ipfs/QmZDBKSsgRaESLH3TZJgwShubQo5omuoy1yoRn1ksTDnjm)

The Lit encrypted object returned from encryptString( ) should look like:

![Encrypted obj view](/public/encrypted_obj.png)

## **Decrypt and Display**

![Decrypt](/public/decrypt.png)

Within our lit.js file, we create a decryptString function that will take in the encrypted string and the encrypted symmetric key and pass back a decrypted file if we hold the correct conditions to decrypt. 

Lit functions explained:

- **checkAndSignAuthMessage**: Checks for an existing cryptographic authentication signature and creates one if it doesn’t exist. This is used to prove ownership of a given wallet address to the Lit nodes.
- **getEncryptionKey**: Retrieves the symmetric encryption key from the LIT nodes. 
Note that this will only work if the current wallet meets the access control conditions specified when the data was encrypted.
- **decryptString**: Decrypt a string that was encrypted using the Lit Node Client encryptString function.

```jsx
async decryptString(encryptedStr, encryptedSymmetricKey) {
    if (!this.litNodeClient) {
      await this.connect()
    }

    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain })

    const symmetricKey = await this.litNodeClient.getEncryptionKey({
      accessControlConditions: accessControlConditionsNFT,
      toDecrypt: encryptedSymmetricKey,
      chain,
      authSig
    })

    const decryptedFile = await LitJsSdk.decryptString(
      encryptedStr,
      symmetricKey
    );

    return { decryptedFile }
  }
```

Go back to the App.js file. Within the App function, add in a state to keep track of the decrypted URLs. Feel free to remove `const [urlArr, setUrlArr] = useState([]);` , we will not be using that state.

```jsx
const [decryptedFileArr, setDecryptedFileArr] = useState([]);
```

Within the App function, add in a decrypt helper function. This helper function is called when the `decrypt` button is pressed.

```jsx
function decrypt() {
    Promise.all(encryptedUrlArr.map((url, idx) => {
      return lit.decryptString(url, encryptedKeyArr[idx]);
    })).then((values) => {
      setDecryptedFileArr(values.map((v) => {
        return v.decryptedFile;
      }));
    });
  }
```

Finally, within the JSX at the bottom of the App.js file, update the div labeled display to take into account the new decrypted array. Allow a few moments for the decrypt function to work and you should see your image shortly! Be patient :).

```jsx
<div className="display">
  {decryptedFileArr.length !== 0
    ? decryptedFileArr.map((el) => <img src={el} alt="nfts" />) : <h3>Upload data</h3>}
</div>
```

Congrats! We now have a decentralized application that utilizes Lit to encrypt and decrypt files stored on IPFS. 

### Additional Examples Using Lit Protocol

If you want to an environment to upload files to IPFS and set access controls through an interface, check out the [Lit Gateway IPFS application](https://litgateway.com/files). From this interface, you will be able to share links to files with custom access controls. 

![Lit Gateway](/public/litGateway.png)

Here is a [link](https://litgateway.com/files/view/176269be-e905-4c12-8cfc-aa580d244f19) to a file that you can only view if you have at least one Monster Suit NFT. 

Check out [Lit Token Access](https://litgateway.com/apps/shopify), a way to add token-gating to your Shopify store.

## The Lit Future

So you’re thinking, Lit Protocol is pretty cool and can do some awesome things around privacy that is widely missing from the decentralized web. It gets better; imagine smart contracts that can read and write from any HTTP endpoint, blockchain, state machine, or decentralized storage system. Let's say this smart contract could also have its own public and private key pair, just like a blockchain wallet.

We're calling these super-powered smart contracts [Lit Actions](https://developer.litprotocol.com/coreConcepts/LitActionsAndPKPs/litActions). They are Javascript smart contracts that have network access and can make HTTP requests. The public and private keys are called [programmable key pairs (PKPs)](https://developer.litprotocol.com/coreConcepts/LitActionsAndPKPs/PKPs).

**How does it work?**

A user can generate a new PKP and can grant a Lit Action the right to sign using the PKP. Lit Actions are like smart contracts with a secret key that can be used to sign or decrypt content.

**How does this tie in with unlockable content?**

A wallet now becomes programmable. If unlockable content with NFTs opens up a world for decentralized, encryptable content Lit Actions and PKPs add in programmable, private actions to that landscape. An NFT becomes an authorization signature to run a smart contract.

![Lit Actions & PKP's](/public/litActionsPKPs.png)

### Possibilities of Lit Actions and PKPs

Web3 Social
Social applications that empower users with privacy and true data ownership.
- Credentialing systems for privacy-preserving web3 login.
- User owned social graphs.
- Account abstraction with support for web2 auth methods (i.e. Apple Passkey).
- Decentralized chat bots.
- Verifiable, on-chain reputation building.

DeFi
Condition-based transaction execution (ex. on-chain limit orders).
- Automated, recurring payments.
- Liquid staking solutions.
- Frictionless transaction execution (signing abstraction).
- Vault applications for seamlessly trading asset “bundles”.

Infrastructure
- Cross-chain bridges.
- Oracles for off-chain data.
- Event listening and condition-based execution.
- Privacy-preserving transactions.
- Decentralized key custodians.