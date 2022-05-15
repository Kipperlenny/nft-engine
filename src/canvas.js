const { loadImage } = require("canvas");

// adds a signature to the top left corner of the canvas for pre-production
const writeNumber = (ctx, sig) => {
    ctx.fillStyle = "#000000";
    ctx.font = "bold 40pt Helvetica";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillText(sig, 40, 300);
};

// adds a signature to the top left corner of the canvas for pre-production
const writeCollection = (ctx, sig) => {
    ctx.fillStyle = "#000000";
    ctx.font = "bold 50pt Helvetica";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillText(sig, 40, 450);
};

// loads an image from the layer path
// returns the image in a format usable by canvas
const loadLayerImg = async (layer, rarity) => {
    return new Promise(async resolve => {
        const image = await loadImage(`${layer.selectedElement.path}`);
        resolve({ layer: layer, loadedImage: image, rarity: rarity });
    });
};

const drawBackground = (ctx, width, height, rarity) => {
    switch (rarity) {
        case "founder":
            ctx.fillStyle = `hsl(302, 100%, 42%)`;
            break;
        case "gold":
            ctx.fillStyle = `hsl(43, 90%, 50%)`;
            break;
        case "silver":
            ctx.fillStyle = `hsl(1, 0%, 69%)`;
            break;
        case "bronze":
            ctx.fillStyle = `hsl(10, 34%, 42%)`;
            break;
        default:
            ctx.fillStyle = `hsl(0, 100%, 100%)`;
    }
    ctx.fillRect(0, 0, width, height);
};

const drawElement = (ctx, element) => {
  ctx.drawImage(
    element.loadedImage,
    element.layer.position.x,
    element.layer.position.y,
    element.layer.size.width,
    element.layer.size.height
  );
};

module.exports = {
    writeNumber,
    writeCollection,
    drawBackground,
    loadLayerImg,
  drawElement
};
