import "./App.css";
import { useState } from "react";
import { create } from "ipfs-http-client";
import lit from "../lib/lit";
import Header from "./Header";

const client = create('https://pin.valist.io');

function App() {
  const [file, setFile] = useState(null);
  const [encryptedUrlArr, setEncryptedUrlArr] = useState([]);
  const [encryptedKeyArr, setEncryptedKeyArr] = useState([]);
  const [decryptedFileArr, setDecryptedFileArr] = useState([]);

  function retrieveFile(e) {
    const data = e.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(data);

    reader.onloadend = () => {
      setFile(Buffer(reader.result));
    };

    e.preventDefault();
  }

  function decrypt() {
    if (encryptedUrlArr.length !== 0) {
      Promise.all(encryptedUrlArr.map((url, idx) => {
        return lit.decryptString(url, encryptedKeyArr[idx]);
      })).then((values) => {
        setDecryptedFileArr(values.map((v) => {
          return v.decryptedFile;
        }));
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const created = await client.add(file);
      const url = `https://gateway.valist.io/ipfs/${created.path}`;

      const encrypted = await lit.encryptString(url);
      console.log('IPFS URL: ', url);
      console.log('Encrypted String: ', encrypted.encryptedFile);

      setEncryptedUrlArr((prev) => [...prev, encrypted.encryptedFile]);
      setEncryptedKeyArr((prev) => [...prev, encrypted.encryptedSymmetricKey]);
    } catch (error) {
      console.log(error.message);
    }
  }

  return (
    <div className="App">
      <Header
        title="Here's an example of how to use Lit with IPFS"
      />

      <div className="main">
        <form onSubmit={handleSubmit}>
          <input type="file" onChange={retrieveFile} />
          <button type="submit" className="button">Submit</button>
        </form>
      </div>
      <div>
        <button className="button" onClick={decrypt}>Decrypt</button>
        <div className="display">
          {decryptedFileArr.length !== 0
            ? decryptedFileArr.map((el) => <img src={el} alt="nfts" />) : <h3>Upload data, please! </h3>}
        </div>
      </div>
    </div>
  );
}

export default App;
