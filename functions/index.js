const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fs_export = require("node-firestore-import-export");

admin.initializeApp(functions.config().firebase);

exports.scheduleExportUserPlants = functions.pubsub.schedule('every 48 hours')
//exports.scheduleExportUserPlants = functions.pubsub.schedule("every 2 minutes")
  .timeZone("America/Chicago")
  .onRun((context) => {
    // admin.initializeApp({
    //   authDomain: "flora-test-63309.firebaseapp.com",
    //   databaseURL: "https://flora-test-63309.firebaseio.com",
    //   storageBucket: "flora-test-63309.appspot.com",
    // });

    const collectionRef = admin.firestore().collection("UserPlants");

    fs_export.firestoreExport(collectionRef).then((data) => {
      const timeString = admin.firestore.Timestamp.now().valueOf();

      const file = admin.storage().bucket().file(`backup-UserPlants/${timeString}-UserPlants.json`);
      file.save(JSON.stringify(data), {
          gzip: true,
        })
        .then(() => {
          console.log("**************Export Done***************");
        });
    });
  });
