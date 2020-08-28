module.exports = {
    presets: [
        [
            "@babel/env", {
                targets: {
                    browsers: '> 0.5%, ie >= 11'
                },
                modules: false,
                spec: true,
                useBuiltIns: 'usage',
                forceAllTransforms: true,
                corejs: {
                    version: 3,
                    proposals: false
                }
            }
        ]
    ]
}