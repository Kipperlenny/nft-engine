const fs = require("fs");
const Moralis = require("moralis/node");
const { default: axios } = require("axios");
const { saveToDb } = require("./filesystem");

const { description, baseImageUri } = require("../input/config.js");

// write metadata locally to json files
const writeMetaData = (metadataList) => {
  fs.writeFileSync("./output/_metadata.json", JSON.stringify(metadataList));
};

// add metadata for individual nft edition
const generateMetadata = (dna, edition, attributesList, path) => {
  let dateTime = Date.now();
  let tempMetadata = {
    name: `#${edition}`,
    description: description,
    image: path || baseImageUri,
    edition: edition,
    date: dateTime,
    attributes: attributesList,
  };
  return tempMetadata;
};

// upload metadata
const uploadMetadata = async (
  apiUrl,
  xAPIKey,
  imageCID,
  imageDataArray
) => {
  const ipfsArray = []; // holds all IPFS data
  const metadataList = []; // holds metadata for all NFTs (could be a session store of data)
  const promiseArray = []; // array of promises so that only if finished, will next promise be initiated

    for (var i = 0; i < imageDataArray.length; i++) {
        let imageElement = imageDataArray[i];
        let id = imageElement.editionCount.toString();
        let rarityName = imageElement.rarity.toString();
        let paddedHex = (
            "000000000000000000000000000000000000000000000000000000000000000000" + id
        ).slice(-64);
        let filename = paddedHex + ".json";

    let filetype = "base64";
    imageDataArray[
      i
    ].filePath = `https://gateway.pinata.cloud/ipfs/${imageCID}/${rarityName}/${paddedHex}.png`;
    //imageDataArray[i].image_file = res.data[i].content;

    // do something else here after firstFunction completes
    let nftMetadata = generateMetadata(
      imageDataArray[i].newDna,
        id,
      imageDataArray[i].attributesList,
      imageDataArray[i].filePath
    );
    metadataList.push(nftMetadata);

    // upload metafile data to Moralis
    const metaFile = new Moralis.File(filename, {
      base64: Buffer.from(
        JSON.stringify(metadataList.find((meta) => meta.edition == id))
      ).toString("base64"),
    });

    // save locally as file
    fs.writeFileSync(
        `./output/${rarityName}/${filename}`,
        JSON.stringify(metadataList.find((meta) => meta.edition == id))
    );

    // reads output folder for json files and then adds to IPFS object array
    promiseArray.push(
      new Promise((res, rej) => {
          fs.readFile(`./output/${rarityName}/${filename}`, (err, data) => {
            if (err) rej();
            if (typeof data == "undefined") {
                console.log("undefined", `./output/${rarityName}/${filename}`);
            }
            ipfsArray.push({
                path: `${rarityName}/${filename}`,
                content: data.toString("base64"),
            });
            res();
        });
      })
    );
  }

    // once all promises back then save to IPFS and Moralis database
    await new Promise(resolve => setTimeout(resolve, 1005));
    Promise.all(promiseArray).then(async () => {
        const chunkSize = 100;
        for (let i = 0; i < ipfsArray.length; i += chunkSize) {
            await new Promise(resolve => setTimeout(resolve, 1005));
            const chunk = ipfsArray.slice(i, i + chunkSize);
            axios.post(apiUrl, chunk, {
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                headers: {
                    "X-API-Key": xAPIKey,
                    "content-type": "application/json",
                    accept: "application/json",
                },
            }).then(async (res) => {
                let metaCID = res.data[0].path.split("/")[4];
                console.log("META FILE PATHS:", res.data);
                saveToDb(metaCID, imageCID, imageDataArray);
                await new Promise(resolve => setTimeout(resolve, 1005));
                writeMetaData(metadataList);
            }).catch((err) => {
                console.log(err);
            });
        }
    });
    await new Promise(resolve => setTimeout(resolve, 1005));
};

// compile metadata (reads output folder images)
const compileMetadata = async (
    apiUrl,
    xAPIKey,
    imageDataArray
) => {
    ipfsArray = [];
    promiseArray = [];

    for (var i = 0; i < imageDataArray.length; i++) {
        let imageElement = imageDataArray[i];
        let id = imageElement.editionCount.toString();
        let rarityName = imageElement.rarity.toString();
        let paddedHex = (
            "000000000000000000000000000000000000000000000000000000000000000000" + id
        ).slice(-64);

        // reads output folder for images and adds to IPFS object metadata array (within promise array)
        promiseArray.push(
            new Promise((res, rej) => {
                fs.readFile(`./output/${rarityName}/${paddedHex}.png`, (err, data) => {
                    if (err) rej();
                    if (!data) {
                        console.log(`./output/${rarityName}/${paddedHex}.png`);
                    }
                    ipfsArray.push({
                        path: `${rarityName}/${paddedHex}.png`,
                        content: data.toString("base64"),
                    });
                    res();
                });
            })
        );
    }

    // once all promises then upload IPFS object metadata array
    await new Promise(resolve => setTimeout(resolve, 2010));
    Promise.all(promiseArray).then(async () => {
        const chunkSize = 100;
        for (let i = 0; i < ipfsArray.length; i += chunkSize) {
            const chunk = ipfsArray.slice(i, i + chunkSize);
            await new Promise(resolve => setTimeout(resolve, 1005));
            axios.post(apiUrl, chunk, {
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                headers: {
                  "X-API-Key": xAPIKey,
                  "content-type": "application/json",
                  accept: "application/json",
                }
            })
            .then(async (res) => {
                console.log("IMAGE FILE PATHS:", res.data);
                let imageCID = res.data[0].path.split("/")[4];
                console.log("IMAGE CID:", imageCID);

                // pass folder CID to meta data
                await new Promise(resolve => setTimeout(resolve, 2010));
                uploadMetadata(apiUrl, xAPIKey, imageCID, imageDataArray);
            })
            .catch((err) => {
                console.log(err);
            });
        }
  });
};

module.exports = {
  generateMetadata,
  writeMetaData,
  uploadMetadata,
  compileMetadata,
};
