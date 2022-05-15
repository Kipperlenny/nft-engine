/*******************************************************************
 * UTILITY FUNCTIONS
 * - scroll to BEGIN COLLECTION CONFIG to provide the config values
 ******************************************************************/
const fs = require("fs");
const dir = __dirname;

// adds a rarity to the configuration. This is expected to correspond with a directory containing the rarity for each defined layer
// @param _id - id of the rarity
// @param _from - number in the edition to start this rarity from
// @param _to - number in the edition to generate this rarity to
// @return a rarity object used to dynamically generate the NFTs
const addRarity = (_id, _from, _to) => {
  const _rarityWeight = {
    value: _id,
    from: _from,
    to: _to
  };
  return _rarityWeight;
};

// get the name without last 4 characters -> slice .png from the name
const cleanName = (_str) => {
  let name = _str.slice(0, -4);
  return name;
};

// reads the filenames of a given folder and returns it with its name and path
const getElements = (_path, _elementCount) => {
  return fs
    .readdirSync(_path)
    .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
    .map((i) => {
      return {
        id: _elementCount,
        name: cleanName(i),
        path: `${_path}/${i}`,
      };
    });
};

// adds a layer to the configuration. The layer will hold information on all the defined parts and
// where they should be rendered in the image
// @param _id - id of the layer
// @param _position - on which x/y value to render this part
// @param _size - of the image
// @return a layer object used to dynamically generate the NFTs
const addLayer = (_id, _position, _size) => {
  if (!_id) {
    console.log("error adding layer, parameters id required");
    return null;
  }
  if (!_position) {
    _position = { x: 0, y: 0 };
  }
  if (!_size) {
    _size = { width: width, height: height };
  }
  // add two different dimension for elements:
  // - all elements with their path information
  // - only the ids mapped to their rarity
  let elements = [];
  let elementCount = 0;
  let elementIdsForRarity = {};
  rarityWeights.forEach((rarityWeight) => {
    let elementsForRarity = getElements(`${dir}/${_id}/${rarityWeight.value}`);

    elementIdsForRarity[rarityWeight.value] = [];
    elementsForRarity.forEach((_elementForRarity) => {
      _elementForRarity.id = `${editionDnaPrefix}${elementCount}`;
      elements.push(_elementForRarity);
      elementIdsForRarity[rarityWeight.value].push(_elementForRarity.id);
      elementCount++;
    });
    elements[rarityWeight.value] = elementsForRarity;
  });

  let elementsForLayer = {
    id: _id,
    position: _position,
    size: _size,
    elements,
    elementIdsForRarity,
  };
  return elementsForLayer;
};


/**************************************************************
 * BEGIN COLLECTION CONFIG
 *************************************************************/

// image width in pixels
const width = 1000;
// image height in pixels
const height = 1000;
// description for NFT in metadata file
const description = "Aiamond Voting NFT Test";
// base url in case no unique metadata file i.e IPFS
const baseImageUri = process.env.SERVER_URL;
// prefix to add to edition dna ids (to distinguish dna counts from different generation processes for the same collection)
const editionDnaPrefix = 0;

// create required weights
// for each weight, call 'addRarity' with the id and from which to which element this rarity should be applied
let rarityWeights = [
    addRarity("founder", 1, 1),
    addRarity("gold", 1, 2),
    addRarity("silver", 1, 3),
    addRarity("bronze", 1, 4),
];

// create required layers
// for each layer, call 'addLayer' with the id and optionally the positioning and size
// the id would be the name of the folder in your input directory, e.g. 'ball' for ./input/ball
const layers = [
  addLayer("Background", { x: 0, y: 0 }, { width: width, height: height }),
];

module.exports = {
  layers,
  width,
  height,
  description,
  baseImageUri,
  rarityWeights,
};
