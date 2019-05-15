let { User } = require('./../models/user');


let authenticateAdmin = ( req, res, next) => {
    let token = req.header('x-auth');

    User.findByToken( token ).then( ( user ) => {
        if ( !user ) {
            return Promise.reject()
        }

        if (user._doc.role === 'Admin') {
            req.user = user;
            req.token = token;

            next();
        }else {
            return Promise.reject()
        }

    }).catch( ( e ) =>
    {
        res.status( 401 ).send( )
    });
};

module.exports = { authenticateAdmin };
