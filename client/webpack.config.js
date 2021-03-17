const ThreadsPlugin = require('threads-plugin')

module.exports = {
    plugins: [
        new ThreadsPlugin()
    ],
    externals: {
        "tiny-worker": "tiny-worker"
    }
}