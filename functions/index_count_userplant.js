const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

//counts >= 1000
exports.scheduleCountUserPlants = functions.pubsub.schedule('every 168 hours')
// exports.scheduleCountUserPlants = functions.pubsub.schedule("every 2 minutes")
  .timeZone("America/Chicago")
  .onRun((context) => {
    const userPlants = db.collection("UserPlants");

    var lastVisible = null;
    var lastVisible = null;
    var total = 0;

    function countUserPlants() {
      const snapshot = !!lastVisible
        ? userPlants
            .startAfter(lastVisible)
            .limit(500)
            .get()
        : userPlants
            .limit(500)
            .get();

      snapshot.then(querySnapshot => {
        if (querySnapshot.size === 0) {
          console.log(
            "*****************************************Total UserPlants Counts*************************************************"
          , total);
          return total;
        }
        total += querySnapshot.size;
        lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

        countUserPlants();
      });
    }

    return countUserPlants();
  });



// //counts < 1000
// exports.scheduleCountUserPlants = functions.pubsub
//   .schedule("every 2 minutes")
//   .timeZone("America/Chicago")
//   .onRun((context) => {
//     return db.collection("UserPlants")
//       .get()
//       .then((snap) => {
//         size = snap.size // will return the collection size
//         console.log('*****', size);
//       });
//   });