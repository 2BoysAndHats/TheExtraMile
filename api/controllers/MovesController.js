/**
 * MovesController
 *
 * @description :: Server-side logic for managing Moves
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var serverKeys = require('../../serverKeys')
var request = require('request')
var classes = require('../../classList')
var jsonfile = require('jsonfile')

module.exports = {
    signup: function (req,res) {

        //Kick off the signup by redirecting to moves for auth code.
        if (req.device.type == 'tablet' || req.device.type == 'phone'){
            res.redirect(keys.moves.regURIs.mobile)   
        } else {
            res.redirect(keys.moves.regURIs.desktop)
        }

    }, 

    callback: function (req,res) {
        //Was there an error?
        if (req.allParams()['error']) { console.log (req.allParams()['error']); return res.redirect('/') }

        //Get the code
        code = req.allParams()['code']
        
        //Ping Moves with the code
        url = keys.moves.regURIs.codeURL + code
    
        request.post(url, function (err, res2, body) {
            if (err) { console.log (err); return res.redirect('/') }

            body = JSON.parse(body)

            if (body.error) {console.log(body.error); return res.redirect('/')}

            //We got the token! Save it to the session
            req.session.tokens = body;

            return res.view('finishSignup',{classes: classes})
        })
    },

    finishSignup: function (req,res) {


        //Check that they have the tokens        
        if (!req.session.tokens) {
            return res.redirect('/moves/signup')
        }

        //Grab their class
        params = req.allParams()
        c = params['class']


        //Check if they have a valid class
        cIsValid = false;
        classes.forEach(function (class2) {
            if (class2.id == c) { cIsValid = true;}
        })

        if (!cIsValid){
            return res.redirect('/moves/signup')
        }

        tokens = req.session.tokens;

        //Load the existing users
        ks = jsonfile.readFileSync('userKeys.json')

        //Loop through to make sure that they haven't registered before
        userIsNotNew = false;
        ks.forEach(function (k) {
            if (k.user_id == tokens.user_id){
                userIsNotNew = true;
            }
        })

        if (!userIsNotNew) {

            //If they haven't already registered, add them to the list

            ks.push ({
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                class: c,
                user_id: tokens.user_id,
            })

            //Write back to the user file
            jsonfile.writeFileSync('userKeys.json', ks, {spaces: 2})

        }
    
        //Finish up
        req.session.tokens = null;
        res.redirect('/moves/thankYou')
    },

    thankYou: function (req,res) {
        res.view('thankYou')
    }
};