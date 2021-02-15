module.exports = {
  plugins: [
    require('postcss-import'),
    require('tailwindcss'),
    require('autoprefixer'),
    require('postcss-preset-env')({
        browsers: 'last 2 versions',
        stage: 0,
        features: {
            'focus-within-pseudo-class': false
        }
    }),
    require('cssnano')
  ]
}
