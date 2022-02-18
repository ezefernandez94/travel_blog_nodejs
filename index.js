const express = require( 'express' );
// este conjunto de expresiones simulara un servidor
const aplication = express();

//const bodyParser = require('body-parser');
const session = require( 'express-session' );
const flash = require( 'express-flash' );

const mysql = require( 'mysql' );

const welcomeRoutes = require('./routes/general');
const request_tracker = require('./middlewares/authentication');

aplication.use( express.urlencoded() );
aplication.use( express.json() );
aplication.use( session({ secret: 'token-muy-secreto', resave: true, saveUninitialized: true }) );
aplication.use(flash());
aplication.use( '/general', welcomeRoutes );

aplication.set( 'view engine', 'ejs' );

aplication.get( '/', function( request, response ) {
    response.render( 'pages/authentication', { error: request.flash( 'error' ) } );
});

aplication.post( '/authenticate', function( request, response ) {
    if( request.body.user == 'ezefer' && request.body.user_password == '123456' ){
        request.session.user = request.body.user;
        response.redirect( '/home' );
    } else {
        request.flash( 'error', 'El Usuario y/o la contraseña son incorrectos.' );
        response.redirect( '/' );
    }
});

aplication.get( '/home', function( request, response ) {
    response.render( 'pages/index', { nombre: request.session.user } );
});

aplication.get( '/form', function( request, response ) {
    response.render( 'pages/form' );
});

aplication.post( '/process', function( request, response ) {
    response.send( `Number: ${request.body.numero}` );
});

//aplication.get( '/home', ( request, response ) => {
//    response.sendFile( __dirname + '/views/home.html' );
//});

aplication.get( '/about', function( request, response ) {
    response.set( 'Content-Type', 'text/html' );
    response.sendFile( __dirname + '/public/about.html' );
});

aplication.get( '/exit', function( request, response ) {
    request.session.destroy();
    response.redirect('/');
});

aplication.use( request_tracker );

aplication.use( '/static', express.static( 'assets' ) );
//aplication.use( express.static( 'images' ) );

aplication.listen( 8080, function(){
    console.log( 'Server Started' );
});

