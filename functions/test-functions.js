const { onRequest } = require("firebase-functions/v2/https");

exports.testOnScanDone = onRequest(
    async (req, res) => {
        try {
            const admin = require("firebase-admin");

            const path = require('path');
            const fs = require('fs');

            test_data = {
                app_name: "2048.apk",
                application_id: "test_id",
                developer_id: 8888,
                id: "test_id",
                scan_hash: "test_scan_hash",
                scan_score: 55,
                scanned_at: "test_scan_date"
            };

            // Specify the bucket name and file name
            const bucketName = 'future-console.appspot.com';
            const fileName = `developers/${test_data.developer_id}/apps/${test_data.application_id}/releases/${test_data.app_name}`;

            const bucket = admin.storage().bucket(bucketName);
            const db = admin.firestore();

            const apkPath = path.join(__dirname, '..', 'assets', test_data.app_name);
            const apkBuffer = fs.readFileSync(apkPath);

            const file = bucket.file(fileName);
            await file.save(apkBuffer);

            await db.collection('apps_scans').doc(test_data.id).set(test_data);

            console.log("✅ TestOnscanDone Function Called Successfully");

            res.status(200).send("Success");

        } catch (err) {
            console.error(err);
            res.status(500).send('Error Calling TestOnScanDone');
        }
    }
);

exports.testFaucet = onRequest(
    async (req, res) => {

        try {
            const axios = require('axios');

            const ADDRESS = '5GdgTJU6wyuZF1WUaWiBsZZ3TV3LcuM9va15cSQmhnE1eRNf';

            const response = await axios.get(`http://127.0.0.1:5001/future-console/us-central1/faucet?requester=${ADDRESS}`);

            console.log("✅ testFaucet Function Called Successfully");

            res.status(200).send(response.data);

        } catch (err) {
            console.error(err);
            res.status(500).send('Error Calling Faucet');
        }
    }
);

exports.testReviews = onRequest(
    async (req, res) => {

        try {
            const admin = require("firebase-admin");

            const db = admin.firestore();
            // Reference to the document
            const docRef = db.collection('reviews').doc('queue');

            // New array to set
            const newArray = [
                '5DU1bishWZUWHztQCNjQgXZLf3mECB7LMw9hsFNs8JDpgnPS/1/2e4ef9299c5d8d042f272a41094391b6d3aef678dbd4673e3dfc3c26c1027666d452f1bc202228880680a0c80124ed2bf1b622f3cc418c4532bde9a200557286',
                '5DU1bishWZUWHztQCNjQgXZLf3mECB7LMw9hsFNs8JDpgnPS/8/2ab02bfe36986b24308df55ee64026b7903654efa9c0d1fe4a50cfed61eb9f38c9bb89ab5a0dbcabe8bb10fc6a1c65e13f666908d809b8b4bb8ca8b24578ce8e'
            ];

            // Set the array in the document
            docRef.set({
                list: newArray
            }, { merge: true })
                .then(() => {
                    console.log('🟢 🟢 🟢 Array set in the document');
                })
                .catch((error) => {
                    console.error('🟣 🟣 🟣Error setting array in the document: ', error);
                });

            const axios = require('axios');

            const response = await axios.get(`http://127.0.0.1:5001/future-console/us-central1/reviews`);

            console.log("✅ testReviews Function Called Successfully");

            res.status(200).send(response.data);

        } catch (err) {
            console.error(err);
            res.status(500).send('Error Calling reviews');
        }
    }
);

exports.testClearReviews = onRequest(
    async (req, res) => {

        try {

            const axios = require('axios');

            const response = await axios.get(`http://127.0.0.1:5001/future-console/us-central1/clearReviews`);

            console.log("✅ testClearReviews Function Called Successfully");

            res.status(200).send(response.data);

        } catch (err) {
            console.error(err);
            res.status(500).send('Error Calling testClearReviews');
        }
    }
);