const express = require('express');
const router = express.Router();

//Midleware
router.use( '/write_request', ( request, response, target ) => {
    var date = new Date();
    console.log( date + ' ' + request.method + ' ' + request.url + ' ' + request.socket.remoteAddress + ' ' + request.headers['user-agent'] );
    response.redirect('/home');
});

module.exports = router;