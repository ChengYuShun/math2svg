// Import necessary modules.
const http = require('http');
const fs = require('fs').promises;
const { hideBin } = require('yargs/helpers');
const yargs = require('yargs/yargs');

// Parse arguments.
const argv = yargs(hideBin(process.argv))
      .usage('Usage: node client.js [OPTIONS]')
      .option('input', {
          alias: 'i',
          describe: 'Input TeX file path.',
          type: 'string',
      })
      .option('output', {
          alias: 'o',
          describe: 'Output SVG file path.',
          default: './output.svg',
          type: 'string',
      })
      .option('scale', {
          alias: 's',
          describe: 'Scaling factor for the output SVG.',
          default: 1.0,
          type: 'number',
      })
      .option('port', {
          alias: 'p',
          describe: 'Server port.',
          type: 'number',
      })
      .option('host', {
          alias: 'n',
          describe: 'Server host.',
          default: '127.0.0.1',
          type: 'string',
      })
      .help('help')
      .alias('help', 'h')
      .parse();

// Server details.
const PORT = argv.port;
const HOST = argv.host;

// Example client function to interact with the server.
async function sendRequest(input) {
    return new Promise((resolve, reject) => {
        // Prepare the POST request payload
        const postData = JSON.stringify(input);

        // Set up request options
        const options = {
            hostname: HOST, // Ensure this matches the server's host
            port: PORT,           // Ensure this matches the server's port
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        // Create the HTTP request
        const req = http.request(options, (res) => {
            let responseBody = '';

            // Collect the response data
            res.on('data', (chunk) => {
                responseBody += chunk;
            });

            // Handle the end of the response
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseBody);
                    resolve(parsedData);
                } catch (error) {
                    reject(new Error('Failed to parse server response.'));
                }
            });
        });

        // Handle request errors
        req.on('error', (error) => {
            reject(error);
        });

        // Send the request with the data
        req.write(postData);
        req.end();
    });
}

// Main operations.
fs.readFile(argv.input, 'utf-8')
    .then((inputTex) => {
        return sendRequest({ scale: argv.scale, tex: inputTex });
    })
    .then((response) => {
        if (response.svg === undefined) {
            throw new Error(response.error || 'Unknown error');
        } else {
            return fs.writeFile(argv.output, response.svg);
        }
    });
