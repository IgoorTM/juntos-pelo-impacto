// eslint-disable-next-line @typescript-eslint/no-require-imports
const { config } = require('dotenv');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

config({ path: path.resolve(__dirname, '../.env.test') });
