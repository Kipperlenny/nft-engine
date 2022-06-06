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

// import config
const {
    seller_fee_basis_points,
    fee_recipient
} = require("../input/config.js");

// import dna
const { constructLayerToDna, createUniqueDna } = require("./dna");

// import rarity
const { createDnaListByRarity, getRarity } = require("./rarity");

const constructLoadedElements = (
  layers,
  editionCount,
  editionSize,
    rarityName,
    rarityHumanName
) => {
  let dna = {
    loadedElements: [],
    newDna: null
  };

    let results = constructLayerToDna(dna.newDna, layers, rarityName);

    // load all images to be used by canvas
    results.forEach(layer => {
        dna.loadedElements.push(loadLayerImg(layer, rarityName, rarityHumanName));
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
    rarityHumanName,
    imageDataArray
) => {
  const dna = constructLoadedElements(
    layers,
    editionCount,
    editionSize,
      rarityName,
      rarityHumanName
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
            name: rarityHumanName + " " + editionCount,
            rarity: elementArray[0].rarity,
            "seller_fee_basis_points": seller_fee_basis_points,
            "fee_recipient": fee_recipient
        });

        // add an image signature as the edition count to the top left of the image
        if (elementArray[0].rarity < 4) {
            writeNumber(ctx, `#${editionCount}`);
        }

         // add an image signature as the edition count to the top left of the image
        writeCollection(ctx, elementArray[0].rarityHumanName);
    });

    // write the image to the output directory
    let paddedHex = (
        "000000000000000000000000000000000000000000000000000000000000000000" + editionCount.toString()
    ).slice(-64);
    let filename = paddedHex + ".png";
    let filetype = "image/png";

    // save locally as file
    fs.writeFileSync(`./output/${rarityName}/${filename}`, canvas.toBuffer(filetype));

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
            "000000000000000000000000000000000000000000000000000000000000000000" + id
        ).slice(-64);

        let url = `https://gateway.pinata.cloud/ipfs/${metaHash}/${rarityName}/${paddedHex}.json`;

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
