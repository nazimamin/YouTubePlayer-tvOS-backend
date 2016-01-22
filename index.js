// Dependencies
var Youtube, Fs, ReadJson, Lien, Logger, Opn, Q, Firebase;
Youtube = require("./lib");
Fs = require("fs");
ReadJson = require("r-json");
Lien = require("lien");
Logger = require("bug-killer");
Opn = require("opn");
Q = require("q");
Firebase = require("firebase");

const CREDENTIALS = ReadJson("./credentials.json");

var FIREBASE_DATE_STORE = new Firebase(CREDENTIALS.web.firebase_url);

HOST_URL = CREDENTIALS.web.local_host;
PORT_INT = (process.env.PORT || 5000);

var server = new Lien({
    host: HOST_URL,
    port: PORT_INT
});

var oauth = Youtube.authenticate({
    type: "oauth",
    client_id: CREDENTIALS.web.client_id,
    client_secret: CREDENTIALS.web.client_secret,
    redirect_url: "http://" + HOST_URL + ":" + PORT_INT + "/oauth2callback"
});

Opn(oauth.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/youtube"]
}));

function getSubscribeList() {
    var d = Q.defer();
    Youtube.subscriptions.list({
        part: "snippet",
        mine: "true",
        order: "relevance",
        maxResults: "50",
        fields: "items/snippet"

    }, function (err, data) {

        if (err) {
            return lien.end(err, 400);
        }
        d.resolve(data);
    });
    return d.promise;
}

function getChannelLists(data) {
    var d = Q.defer();
    Youtube.channels.list({
        part: "contentDetails",
        id: data.snippet.resourceId.channelId,
        fields: "items/contentDetails"

    }, function (err, channelData) {
        if (err) {
            console.log(err)
        }
        d.resolve(channelData);
    });
    return d.promise;
}

function getPlayLists(channelData) {
    var d = Q.defer();
    Youtube.playlistItems.list({
        part: "snippet",
        playlistId: channelData.items[0].contentDetails.relatedPlaylists.uploads,
        maxResults: "50",
        fields: "items"
    }, function (err, channelVideo) {
        if (err) {
            console.log(err)
        }
        d.resolve(channelVideo);
    });
    return d.promise;
}
// Handle oauth2 callback
server.page.add("/oauth2callback", function (lien) {
    Logger.log("Trying to get the token using the following code: " + lien.search.code);
    oauth.getToken(lien.search.code, function (err, tokens) {
        if (err) {
            lien(err, 400);
            return Logger.log(err);
        }
        oauth.setCredentials(tokens);
        //chain promises 
        getSubscribeList()
            .then(function (response) {
                for (var i = 0; i < response.items.length; i++) {
                    getChannelLists(response.items[i])
                        .then(function (res) {
                            var items = "";
                            getPlayLists(res)
                                .then(function (videoResponse) {
                                    items = videoResponse.items;
                                    for (var i = 0; i < items.length; i++) {
                                        var id = items[i].snippet.resourceId.videoId;
                                        var obj = items[i];
                                        var video = FIREBASE_DATE_STORE.child(id);
                                        video.set({
                                            id: obj
                                        });
                                    }
                                });
                        });
                }
            });
        //just show data after auth completes
        FIREBASE_DATE_STORE.on("value", function (snapshot) {
            return lien.end(snapshot.val());
        }, function (errorObject) {
            lien(errorObject.code, 400);
        });
    });
});