const express = require('express');
const morgan = require("morgan");
const devConfig = require("./dev.config");
const axios = require("axios");
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
    onProxyReq(proxyReq, req, res) {
        if (!req.headers.cookie) {
            res.sendStatus(403);
            return
        }
        const cookies = req.headers.cookie.split(';')
        if (!cookies) {
            res.sendStatus(403)
            return
        }
        const tokenCookie = cookies.find(cookie => cookie.split('=')[0] === 'token');
        if (!tokenCookie) {
            res.sendStatus(403)
            return
        }
        const token = tokenCookie.split('=')[1];
        proxyReq.socket.pause();
        axios.get(config.authUrl + '/validate-token', {params: {token: token}})
            .then(isAuthenticated => {
                if (isAuthenticated) {
                    console.log("continue");
                    proxyReq.socket.resume();
                } else {
                    console.log("not authenticated")
                    res.sendStatus(403)
                }
            })
            .catch(() => {
                console.log("error authenticating")
                res.sendStatus(500);
            })
    }
}));

// Start the Proxy
app.listen(config.port, config.host, () => {
    console.log(`Starting Proxy at ${config.host}:${config.port}`);
});
