module.exports = {
    plugins: {
        autoprefixer: {
            grid: false,
        },
        cssnano: {
            preset: [
                "default",
                {
                    calc: false,
                    discardComments: {
                        removeAll: true,
                    },
                },
            ],
        },
    },
}
