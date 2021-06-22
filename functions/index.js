const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

// exports.scheduleAsyncMorningNotif = functions.pubsub.schedule('10 08 * * *')
exports.scheduleAsyncMorningNotif = functions.pubsub.schedule("every 5 minutes")
  .timeZone("America/Chicago")
  .onRun((context) => {
    const tsToMillis = admin.firestore.Timestamp.now().toMillis();
    const today = new Date(tsToMillis + 15 * 60 * 60 * 1000);

    const userPlants = db.collection("TestUserPlants");

    var lastVisible = null;
    // let totalSuccessCount = 0;
    var multipleUsers = [];

    function handleUserPlantsFCM() {
      const snapshot = !!lastVisible
        ? userPlants
            .where("nextWatering", "<=", today)
            .where("notificationsEnabled", "==", true)
            .orderBy("nextWatering")
            .startAfter(lastVisible)
            .limit(500)
            .get()
        : userPlants
            .where("nextWatering", "<=", today)
            .where("notificationsEnabled", "==", true)
            .orderBy("nextWatering")
            .limit(500)
            .get();

      if (snapshot.size === 0) {
        console.log("No matching documents.");
        return;
      }

      snapshot.then(querySnapshot => {
        console.log(
          "Query Snapshot of UserPlants showing as:",
          querySnapshot.size
        );
        if (querySnapshot.size === 0) {
          console.log("No matching documents.");
          console.log(
            "*****************************************Sending Messages*************************************************"
          );

          if (!!multipleUsers.length) {
            const matchedMultipleUsers = multipleUsers.filter(
              (plant) => plant.count > 2
            );
            if (!!matchedMultipleUsers.length) {
              const matchedNotifications = matchedMultipleUsers.map(
                (plant) => ({
                  notification: {
                    title: `You have ${plant.count} plants to water! 🌱 `,
                    body: `Your plants needs some water - make sure to take care of it! ☔️`,
                  },
                  token: plant.userFCMToken,
                  data: {
                    body: `Your plants needs some water - make sure to take care of it! ☔️`,
                  },
                })
              );
              if (!!matchedNotifications && matchedNotifications.length) {
                try {
                  admin
                    .messaging()
                    .sendAll(matchedNotifications)
                    .then((response) => {
                      const multipleSuccessCount = response.successCount;
                      console.log(
                        `${multipleSuccessCount} grouping messages are sent successfully.`
                      );
                      console.log(matchedMultipleUsers.length, matchedNotifications.length);
                    });
                } catch (err) {
                  console.log(err);
                }
              } else {
                console.log("There is no any grouping messages to be sent!");
              }
            } else {
              console.log("There is no any user who has multiple plants.");
            }

            const matchedOneOrTwoUsers = multipleUsers.filter(
              (plant) => plant.count < 3
            );
            if (!!matchedOneOrTwoUsers.length) {
              const matchedNotifications = matchedOneOrTwoUsers.map(
                (plant) => ({
                  notification: {
                    title: `You have a plant to save! 🌱 `,
                    body: `Your ${plant.plantName.toString()} plant needs some water - make sure to take care of it! ☔️`,
                  },
                  token: plant.userFCMToken,
                  data: {
                    body: `Your ${plant.plantName.toString()} needs some water - make sure to take care of it! ☔️`,
                  },
                })
              );
              if (!!matchedNotifications && matchedNotifications.length) {
                try {
                  admin
                    .messaging()
                    .sendAll(matchedNotifications)
                    .then((response) => {
                      const multipleSuccessCount = response.successCount;
                      console.log(
                        `${multipleSuccessCount} messages are sent successfully.`
                      );
                      console.log(matchedOneOrTwoUsers.length, matchedNotifications.length);
                    });
                } catch (err) {
                  console.log(err);
                }
              } else {
                console.log("There is no any messages to be sent!");
              }
            } else {
              console.log("There is no any user who has a plant.");
            }
          }
          return;
        }
        lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
        // var messages = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const { plantName, userFCMToken, userRef } = data;

          if (plantName && userFCMToken) {
            // check if user does not exist in multiple users
            if (!multipleUsers.some((plant) => plant.userRef === userRef)) {
              let arr = [];
              const userObj = {
                userRef: userRef,
                userFCMToken: userFCMToken,
                plantName: [plantName],
                count: 1,
              };
              console.log("==============NewUserPlant", plantName);
              multipleUsers.push(userObj);
            } else {
              const existingUserPlant = multipleUsers.find(
                (plant) => plant.userRef === userRef
              );
              console.log(
                "++++++++++++++existingUserPlant:",
                existingUserPlant.plantName[0]
              );
              let arr = [];
              const updatedUserPlant = {
                ...existingUserPlant,
                count: parseInt(existingUserPlant.count) + 1,
                plantName: Array.isArray(existingUserPlant.plantName)
                  ? existingUserPlant.plantName.push(plantName)
                  : [plantName],
              };
              const updatedMultipleUsers = multipleUsers.map((plant) => {
                if (plant.userRef === userRef) return updatedUserPlant;
                else return plant;
              });
              multipleUsers = updatedMultipleUsers;
            }
            
          } else {
            console.log("Nil/false on user token, skipping for now");
          }
        });
        
        handleUserPlantsFCM();
      });
      return null;
    }
    
    return handleUserPlantsFCM();
  });
