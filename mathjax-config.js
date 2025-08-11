global.MathJax = {
    startup: { typeset: false },
    loader: {
        paths: { mathjax: '@mathjax/src/bundle' },
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
            // Added ingredients.
            tr: ['\\operatorname{tr}', 0],
            im: ['\\operatorname{im}', 0],
        },
    },
    options: {
        enableEnrichment: false,
    },
};

