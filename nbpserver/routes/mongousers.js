var express = require('express');
var router = express.Router();
//const queryString = require('../constants/queryConstants');
//const query = require('../db/query');
const sha = require('sha.js');
const mongoDB = require('../db/mongoDB.js');

router.post('/register', async (req, res) => {
  let username = req.body.username;
  let password = sha('sha256').update(req.body.password).digest('hex');

  mongoDB.exec(req, res, mongoDB.REGISTER_USER(username, password));
});

router.post('/auth', async (req, res) => {
  let username = req.body.username;
  let password = sha('sha256').update(req.body.password).digest('hex');

 // query.execGet(req, res, queryString.AUTH_USER(username, password));
});

router.get('/', async (req, res) => {
  let id = req.query.id;

  //query.execUser(req, res, id);
});

router.get('/checkuser', async (req, res) => {
  let username = req.query.username;

  mongoDB.exec(req, res, mongoDB.CHECK_USERNAME(username));
})

module.exports = router;