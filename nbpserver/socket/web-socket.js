const app = require('../app.js');
const www = require('../bin/www');
var redis = require("redis");
var client = redis.createClient();

var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 4201;
var server = http.listen(port, function () {
    console.log("Express server listening on port " + port);
});


require('socketio-auth')(io, {
  authenticate: function (socket, data, callback) {
    //get credentials sent by the client
    var username = data.username;
    var password = data.password;
 
  }
});

io.on('connection', function (socket) {
    console.log('new user connected');
    console.log(socket.handshake.query.id);
    console.log(socket.handshake.query.type);
    let  user = {id:"", type:""};
    user.id = socket.handshake.query.id;
    user.type = socket.handshake.query.type;
    // socket.emit('ngdispatcher-connection', 'Connected to the server');
    // socket.on('UserConnected', function(body) {
    //   if(!user){
    //     user = body;
    //     console.log('connected'+user);
    //   }
    // });

    socket.on('disconnecting', (reason) => {
        console.log('user disonnected');
        client.hdel(user.type, user.id);
        console.log(user.type +" deleted");
      });
});

exports.io = io; 