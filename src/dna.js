const { getRandomRarity } = require("./rarity");

// check the configured layer to find information required for rendering the layer
// this maps the layer information to the generated dna and prepares it for
// drawing on a canvas
const constructLayerToDna = (_dna = [], _layers = [], _rarity) => {
    let mappedDnaToLayers = _layers.map((layer, index) => {

    return {
      location: layer.location,
      position: layer.position,
      size: layer.size,
      selectedElement: { rarity: _rarity }
    };
  });
  return mappedDnaToLayers;
};

// check if the given dna is contained within the given dnaList
// return true if it is, indicating that this dna is already in use and should be recalculated
const isDnaUnique = (dnaList = [], dna = []) => {
  let foundDna = dnaList.find(i => i.join("") === dna.join(""));
  return foundDna == undefined ? true : false;
};

// create a dna based on the available layers for the given rarity
// use a random part for each layer
const createDna = (layers, rarity) => {
  let randNum = [];

  layers.forEach(layer => {
    let num = Math.floor(
      Math.random() * layer.elementIdsForRarity[rarity].length
    );
      randNum.push(layer.elementIdsForRarity[rarity][num]);
  });
  return randNum;
};

const createUniqueDna = (layers, rarity, dnaListByRarity) => {
  // calculate the NFT dna by getting a random part for each layer/feature
  // based on the ones available for the given rarity to use during generation
  let newDna = createDna(layers, rarity);
  while (!isDnaUnique(dnaListByRarity[rarity], newDna)) {
    // recalculate dna as this has been used before.
    console.log("found duplicate DNA " + newDna.join("-") + ", recalculate...");
    newDna = createDna(layers, rarity);
  }
  console.log("- dna: " + newDna.join("-"));

  return newDna;
};

module.exports = {
  constructLayerToDna,
  isDnaUnique,
  createDna,
  createUniqueDna
};
