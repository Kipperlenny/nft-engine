const fs = require("fs");
const Moralis = require("moralis/node");
const request = require("request");

// import canvas
const {
    writeNumber,
    writeCollection,
  drawBackground,
  loadLayerImg
} = require("./canvas");

// import dna
const { constructLayerToDna, createUniqueDna } = require("./dna");

// import rarity
const { createDnaListByRarity, getRarity } = require("./rarity");

const constructLoadedElements = (
  layers,
  editionCount,
  editionSize,
    rarityName
) => {
  let dna = {
    loadedElements: [],
    newDna: null
  };

  // holds which dna has already been used during generation and prepares dnaList object
    const dnaListByRarity = createDnaListByRarity(rarityName);

  // get rarity from to config to create NFT as
  let rarity = getRarity(editionCount, editionSize);

  // create unique Dna
  dna.newDna = createUniqueDna(layers, rarity, dnaListByRarity);
    dnaListByRarity[rarityName].push(dna.newDna);

  // propagate information about required layer contained within config into a mapping object
  // = prepare for drawing
    let results = constructLayerToDna(dna.newDna, layers, rarityName);

  // load all images to be used by canvas
    results.forEach(layer => {
        dna.loadedElements.push(loadLayerImg(layer, rarityName));
  });

  return dna;
};

// create image files and return back image object array
const createFile = async (
  canvas,
  ctx,
  layers,
  width,
  height,
  editionCount,
  editionSize,
  rarityName,
    imageDataArray
) => {
  const dna = constructLoadedElements(
    layers,
    editionCount,
    editionSize,
      rarityName
  );

  let attributesList = [];

    await Promise.all(dna.loadedElements).then(elementArray => {
        // create empty image
        ctx.clearRect(0, 0, width, height);
        // draw a random background color
        drawBackground(ctx, width, height, elementArray[0].rarity);
        // store information about each layer to add it as meta information
        attributesList = [];

        attributesList.push({
            name: editionCount,
            rarity: elementArray[0].rarity
        });

        // add an image signature as the edition count to the top left of the image
        writeNumber(ctx, `#${editionCount}`);

         // add an image signature as the edition count to the top left of the image
        writeCollection(ctx, elementArray[0].rarity);
    });

    // write the image to the output directory
    let filename = rarityName + "_" + editionCount.toString() + ".png";
    let filetype = "image/png";

        // save locally as file
    fs.writeFileSync(`./output/${filename}`, canvas.toBuffer(filetype));

    console.log(`Created #${editionCount.toString()} from ${rarityName}`);

    imageDataArray.push({
        editionCount: editionCount,
        newDna: dna.newDna,
        attributesList: attributesList,
        rarity: rarityName
    });

  return imageDataArray;
};

// upload to database
const saveToDb = async (metaHash, imageHash, imageDataArray) => {

    for (var i = 0; i < imageDataArray.length; i++) {
        let imageElement = imageDataArray[i];
        let id = imageElement.editionCount.toString();
        let rarityName = imageElement.rarity.toString();
        let paddedHex = (
            "0000000000000000000000000000000000000000000000000000000000000000" + rarityName + "00" + id
        ).slice(-64);

        let url = `https://ipfs.moralis.io:2053/ipfs/${metaHash}/metadata/${paddedHex}.json`;

        let options = { json: true };
        request(url, options, (error, res, body) => {

            if (error) {
                return console.log(error);
            }

            if (!error && res.statusCode == 200) {
                // Save file reference to Moralis
                const FileDatabase = new Moralis.Object("Metadata");
                FileDatabase.set("edition", body.edition);
                FileDatabase.set("name", body.name);
                FileDatabase.set("dna", body.dna);
                FileDatabase.set("image", body.image);
                FileDatabase.set("attributes", body.attributes);
                FileDatabase.set("meta_hash", metaHash);
                FileDatabase.set("image_hash", imageHash);
                FileDatabase.save();
            }
        });
    }
};

module.exports = {
  createFile,
  saveToDb
};
