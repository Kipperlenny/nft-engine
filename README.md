# Aiamond Voting NFT Test creator
# based on: Moralis Mutants NFT Collection | Generative Art Engine

## Quick Launch 🚀

Via terminal, navigate to root directory:

```sh
npm install

```

Go to [Moralis.io](https://moralis.io/) to create your server instance. Then rename .env-example file to .env and add your Moralis server credentials.

_Note_: To find your xAPI key: https://deep-index.moralis.io/api-docs/#/storage/uploadFolder

Create your layered artwork and split into folders in `./input` and configure your collection to match your layer structure and preferences accordingly by editing `./input/config.js`:

Finally, via terminal in the project directory run:

```sh
node index.js

```