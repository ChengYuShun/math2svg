// Load and configure MathJax.
MathJax = {
    startup: {
        typeset: false,
    },
    loader: {
        load: ['adaptors/liteDOM'],
        require: require,
    },
    tex: {
        macros: {
            // A few macros seem not to be working for no reason.
            bra: ['{\\langle {#1} \\vert}', 1],
            ket: ['{\\vert {#1} \\rangle}', 1],
            Bra: ['{\\left\\langle {#1} \right\\vert}', 1],
            Ket: ['{\\left\\vert {#1} \\right\\rangle}', 1],
            ketbra: ['{\\vert {#1} \\rangle \\langle {#2} \\vert}', 2],
            Ketbra: ['{\\left\\vert {#1} \\right\\rangle \\left\\langle {#2} \\right\\vert}', 2],
        },
    }
};
require('mathjax-full/components/src/tex-svg/tex-svg.js');
const mathPromise = MathJax.startup.promise;

// Regex patterns for matching TeX math.
const TEX_MATH_PATTERNS = [
    {
        name: 'inline-parenthesis',
        regex: /^\s*\\\((.*)\\\)[\s%]*$/sg,
        display: false,
    },
    {
        name: 'display-square-bracket',
        regex: /^\s*\\\[(.*)\\\][\s%]*$/sg,
        display: true,
    },
    {
        name: 'equation-env',
        regex: /^\s*\\begin{equation}(.*)\\end{equation}[%\s]*$/sg,
        display: true,
    },
    {
        name: 'equation-star-env',
        regex: /^\s*\\begin{equation\*}(.*)\\end{equation\*}[\s%]*$/sg,
        display: true,
    },
    {
        name: 'align-env',
        regex: /^\s*(\\begin{align}.*\\end{align})[\s%]*$/sg,
        display: true,
    },
    {
        name: 'align-star-env',
        regex: /^\s*(\\begin{align\*}.*\\end{align\*})[%\s]*$/sg,
        display: true,
    },
]

// Simply convert math into an SVG.
async function math2svg(texMath = '', scale = 1.0) {
    // Extract the portion that should be put in math mode.
    for (const pattern of TEX_MATH_PATTERNS) {
        for (const match of texMath.matchAll(pattern.regex)) {
            const options = { display: pattern.display };
            return mathPromise
                .then(() => {
                    return MathJax.tex2svgPromise(match[1].trim(), options);
                })
                .then((node) => {
                    // children[0] is where the SVG is.
                    let svg = node.children[0]
                    const oldWidth = svg.attributes['width'];
                    svg.attributes['width'] = oldWidth
                        .replace(/([\d.]+)ex/, (match, p1) => {
                            const newWidth = parseFloat(p1) * scale;
                            return `${newWidth}ex`;
                        });
                    const oldHeight = svg.attributes['height'];
                    svg.attributes['height'] = oldHeight
                        .replace(/([\d.]+)ex/, (match, p1) => {
                            const newHeight = parseFloat(p1) * scale;
                            return `${newHeight}ex`;
                        });
                    const oldVertAlign = svg.styles.styles['vertical-align']
                    svg.styles.styles['vertical-align'] = oldVertAlign
                        .replace(/(-?[\d.]+)ex/, (match, p3) => {
                            const newVertAlign = parseFloat(p3) * scale;
                            return `${newVertAlign}ex`;
                        });
                    svg.attributes['style'] = svg.styles.cssText;
                    const svgStr = MathJax.startup.adaptor.outerHTML(svg);
                    return svgStr;
                });
        }
    }
    throw new Error(`No math pattern found in "${texMath}".`);
}

// Parse arguments.
const { hideBin } = require('yargs/helpers');
const yargs = require('yargs/yargs');
const default_port = parseInt(process.env.MATH_TO_SVG_PORT);
const argv = yargs(hideBin(process.argv))
      .usage('Usage: node server.js [OPTIONS]')
      .option('port', {
          alias: 'p',
          describe: 'Port to listen to.',
          default: isNaN(default_port) ? undefined : default_port,
          type: 'number',
      })
      .option('host', {
          alias: 'n',
          describe: 'Host to bind to.',
          default: '127.0.0.1',
          type: 'string',
      })
      .help('help')
      .alias('help', 'h')
      .parse();

// Create HTTP server.
const http = require('http');
const url = require('url');
const server = http.createServer(async (req, res) => {
    try {
        // Only process POST requests.
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Only POST is allowed.' }));
        }
        // Handle request.
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                // Respond.
                const data = JSON.parse(body);
                const svg = await math2svg(data.tex, data.scale);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 'svg': svg }));
            } catch (error) {
                // Handle execution errors.
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 'error': error.message }));
            }
        });
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 'error': 'Internal server error.' }));
    }
});
server.listen(argv.port, argv.host, () => {
    console.log(`Server running at http://${argv.host}:${argv.port}/`);
});
