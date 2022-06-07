import "./App.css";
import { useState } from "react";
import { create } from "ipfs-http-client";
import lit from "../lib/lit";

const client = create("https://ipfs.infura.io:5001/api/v0");

const decrypt = (encryptedUrlArr, encryptedKeyArr) => {
  if (encryptedKeyArr.length === 0 || encryptedUrlArr.length === 0) {
    return <h3>Upload data</h3>;
  }
  const decryptFiles = Promise.all(encryptedUrlArr.map((url, idx) => {
    return lit.decryptFile(url, encryptedKeyArr[idx]);
  }));

  console.log('decrypted files: ', decryptFiles);
  return ( decryptFiles.map((el) => <img src={el} alt="nfts" />)
  );
}

const App = () => {
  const [file, setFile] = useState(null);
  const [encryptedUrlArr, setEncryptedUrlArr] = useState([]);
  const [encryptedKeyArr, setEncryptedKeyArr] = useState([]);

  const retrieveFile = (e) => {
    const data = e.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(data);

    reader.onloadend = () => {
      setFile(Buffer(reader.result));
      //setFile(data);
    };

    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const created = await client.add(file);
      console.log('created: ', created);
      //const uploadEncrypted = await client.add(encrypted.encryptedFile);
      //const encryptedUrl = `https://ipfs.infura.io/ipfs/${uploadEncrypted.path}`;
      //const url = `https://ipfs.infura.io/ipfs/${created.path}`;

      // IPFS link to an image
      const url = 'https://bafybeiacvhcnqgorzkpodqyt4m7266yi7fucyhj6iso2atknhyftncfoaa.ipfs.infura-ipfs.io/';
      const encrypted = await lit.encryptString(url);

      console.log('encrypted file: ', encrypted);

      setEncryptedUrlArr((prev) => [...prev, encrypted.encryptedFile]);
      setEncryptedKeyArr((prev) => [...prev, encrypted.encryptedSymmetricKey]);
    } catch (error) {
      console.log(error.message);
    }
  };
  console.log('encrypted urls', encryptedUrlArr);
  console.log('encrypted keys', encryptedKeyArr);
  try {
    decrypt(encryptedUrlArr, encryptedKeyArr);
  } catch (error) {
    console.log(error.message);
  };

  return (
    <div className="App">
      <header className="App-header">IPFS + Lit</header>

      <div className="main">
        <form onSubmit={handleSubmit}>
          <input type="file" onChange={retrieveFile} />
          <button type="submit" className="button">Submit</button>
        </form>
      </div>

      <div className="display">
        {decrypt(encryptedUrlArr, encryptedKeyArr)}
      </div>
    </div>
  );
};

export default App;
