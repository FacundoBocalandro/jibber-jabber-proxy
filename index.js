const express = require('express');
const morgan = require("morgan");
const devConfig = require("./dev.config");
// const axios = require("axios");
const {prodConfig} = require("./prod.config");
const { createProxyMiddleware } = require('http-proxy-middleware');

// Create Express Server
const app = express();

// Configuration
const config = process.env.ENVIRONMENT === 'dev' ? devConfig : prodConfig;

// Logging
app.use(morgan('dev'));

// Proxy endpoints
app.use('/auth', createProxyMiddleware({
    target: config.authUrl,
    changeOrigin: true,
    pathRewrite: {
        [`^/auth`]: '',
    },
}));

app.use('/posts', createProxyMiddleware({
    target: config.postsUrl,
    changeOrigin: true,
    pathRewrite: {
        [`^/posts`]: '',
    },
}));

// Start the Proxy
app.listen(config.port, config.host, () => {
    console.log(`Starting Proxy at ${config.host}:${config.port}`);
});
