const express = require('express');
const router = express.Router();

router.get( '/welcome', function( request, response ) {
    response.send( 'Welcome!' )
});

router.get( '/bienvenido', function( request, response ) {
    response.send( 'Bienvenido!' );
});

module.exports = router