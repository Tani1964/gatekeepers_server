const admin = require('firebase-admin');
const serviceAccount = require('../../privateKeys/gatekeepers-31241-firebase-adminsdk-fbsvc-8e8e978a3c.json'); // Replace with the path to your downloaded key file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
