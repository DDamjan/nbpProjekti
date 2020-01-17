const webSocket = require('../socket/web-socket.js');
var redis = require("redis");
client = redis.createClient();
var geo = require('georedis').initialize(client);

client.on("error", function (err) {
    console.log("Error " + err);
});

//-------------------------------------------------------------------------------------

var pub = redis.createClient();
pub.publish("a nice channel", "I am sending a message.");

var subIncomingRequest = redis.createClient();
subIncomingRequest.subscribe("IncomingRequest");
subIncomingRequest.on("message", function (channel, clientID) {
    //console.log(channel + ": " + clientID);
    client.hget("requests", clientID, function (err, res) {
        webSocket.io.emit('User:', JSON.parse(res));
    });
});

var subAprovedRide = redis.createClient();
subAprovedRide.subscribe("AprovedRide");
subAprovedRide.on("message", function (channel, body) {
    //console.log(channel + ": " + req);
    console.log(body);
    body = JSON.parse(body);
    let clientID = body.clientID;
    let driverID = body.driverID;
    let operatorID = body.operatorID;

    client.hget("requests", clientID, (err, res) => {
        res = JSON.parse(res);
        res.driverID = driverID;
        webSocket.io.emit('User:', res);
        client.hmset("requests",clientID, JSON.stringify(res));
    });
    client.lrange("accepted:"+clientID, 0, -1, (err, driverList)=>{
        let driverIDlist = [];
        driverList.forEach((element, i) => {
            driverIDlist[i] = JSON.parse(element).driverID.toString();
        });
         geo.removeLocations(driverIDlist, function(err, reply){
            if(err) console.error(err)
            else console.log('removed locations', reply)
        })
    });
    client.del("accepted:" + clientID);
    client.del("denied:" + clientID);
    client.hdel("requests", clientID);
    console.log("DELETED request");
});

var subRideStatus = redis.createClient();
subRideStatus.subscribe("RideStatus");
subRideStatus.on("message", function (channel, body) {
    console.log(channel + ": " + body);
    let ride;
    ride.ID = body.ID;
    ride.isCanceled = body.isCanceled;
    ride.driverID = body.driverID;
    ride.clientID = body.clientID;
    client.lrange("operator", 0, -1, (err, operatorList)=>{
        operatorList.forEach(element => {
            console.log(element);
        });
    });
    webSocket.io.emit('User:', ride);
});

var subUserAuth = redis.createClient();
subUserAuth.subscribe("UserAuth");
subUserAuth.on("message", function (channel, user) {
    user = JSON.parse(user);
    console.log(user);
    switch(user.type){
        case "operator": 
            client.lpush("operator", user.id, JSON.stringify(user));
        break;
        case "driver": 
            client.lpush("driver", user.id, JSON.stringify(user));
        break;
        case "client": 
            client.lpush("client", user.id, JSON.stringify(user));
        break;
        default: break;
    }
    webSocket.io.emit('User:'+user.id, "AUTH USER emit TEST for DAMJAN");
});
 


//-------------------------------------------------------------------------------------

var options = {
    withCoordinates: false, // Will provide coordinates with locations, default false
    withHashes: false, // Will provide a 52bit Geohash Integer, default false
    withDistances: true, // Will provide distance from query, default false
    order: 'ASC', // or 'DESC' or true (same as 'ASC'), default false
    units: 'm', // or 'km', 'mi', 'ft', default 'm'
    count: 1, // Number of results to return, default undefined
    accurate: true // Useful if in emulated mode and accuracy is important, default false
  }

function RequestTest(req){
    let driver ={};
    driver.driverID = 5;
    driver.currentLat = 43.318058;
    driver.currentLng = 21.891996;
    driver.currentLocation = "neka";

    webSocket.io.emit('RequestTest',driver);
}

function makeRequest(req){
    //console.log(req.body);
    client.hmset("requests", req.body.clientID, JSON.stringify(req.body));

    //client.geopos("requests:"+req.body.clientID, req.body.destinationLng, req.body.destinationLat, "dest", req.body.startLat, req.body.startLng, "src",  redis.print);
    //geo.addLocation("dest:"+ req.body.clientID, {latitude: req.body.destinationLat, longitude: req.body.destinationLng});
    geo.addLocation("src:"+ req.body.clientID, {latitude: req.body.startLat, longitude: req.body.startLng});

    pub.publish("IncomingRequest", req.body.clientID);
    setTimeout(() => {sendOperatorRequest(req.body.clientID)},10000);
}

function requestAccepted(req){
    let driver = {};
    driver.driverID =  req.body.driverID;
    driver.destinationLat =  req.body.startLat;
    driver.destinationLng =  req.body.startLng;
    driver.destinationLocation =  req.body.startLocation;
    client.lpush("accepted:"+req.body.clientID, JSON.stringify(driver));
    geo.addLocation(req.body.driverID, {latitude: req.body.startLat, longitude: req.body.startLng});
}

function requestDenied(req){
    //console.log(req.body);
    client.lpush("denied:"+req.body.clientID, JSON.stringify(req.body.driverID));
    //client.lrange("denied:"+req.body.clientID, 0, -1, redis.print);
}

function sendOperatorRequest(clientID){
    client.hget("requests", clientID, function (err, request) {
        client.lrange("accepted:"+clientID, 0, -1, (err, driverList)=>{

            request = JSON.parse(request);
            driverList.forEach((element, i) => {
                driverList[i] = JSON.parse(element);
            });
            request.drivers = driverList;

            geo.location("src:"+ clientID, (err, location) => {
                if(err) console.error(err);
                else{
                    geo.removeLocation("src:"+ clientID);
                    //geo.removeLocation("dest:"+ clientID);
                    geo.nearby({latitude: location.latitude, longitude: location.longitude}, 10000, options, (err, locations) => {
                        request.closestDriver = locations[0];
                        webSocket.io.emit('User:', request);
                        console.error("Operator resolve request");
                    });
                }
            });
        });
    });
}

async function execPost(req, res, fun) {
    try {
        //console.log(fun);
        fun(req);
        res.json("Post successful");
        res.end();
    } catch (err) {
        res.status(500);
        res.send(err.message);
        res.end();
    }
}

module.exports = {
    redis: redis,
    client: client,
    execPost: execPost,
    makeRequest: makeRequest,
    requestAccepted: requestAccepted,
    requestDenied: requestDenied,
    pub: pub,
    RequestTest: RequestTest
}
