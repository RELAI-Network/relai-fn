const { onRequest } = require("firebase-functions/v2/https");
const functions = require('firebase-functions');
const admin = require("firebase-admin");
const crypto = require('crypto');
const crustPin = require('@crustio/crust-pin').default;
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');


const C_ACCOUNT_SEEDS = process.env.crust_seed;
const CW3AUTH = process.env.crust_auth
const RL_FAUCET_SEED = process.env.rl_faucet_seed;

const RL_Amount = 20_000_000_000;

const crust = new crustPin(`${C_ACCOUNT_SEEDS}`);

admin.initializeApp();

// Create a Cloud Storage client
const storage = admin.storage();

// Get a Firestore instance
const db = admin.firestore();

exports.encryptFile = onRequest(
    async (req, res) => {

        // Check for POST request
        if (req.method !== "POST") {
            res.status(400).send('Please send a POST request');
            return;
        }

        // Retrieve filepath from query parameters
        const filePath = req.query.filePath;

        // Check if parameters are missing
        if (!filePath) {
            return res.status(400).send('Missing required filePath parameter');
        }

        try {
            // Specify the bucket name and file name
            const bucketName = 'future-console.appspot.com';
            const fileName = 'developers/' + filePath;

            // Get the file from Cloud Storage
            const bucket = storage.bucket(bucketName);
            const file = bucket.file(fileName);
            const [fileData] = await file.download();


            // Generate a symmetric key
            const key = crypto.randomBytes(32); // 256 bits

            // Convert the key to a base64 string
            const keyString = key.toString('base64');

            // Encrypt the file
            const cipher = crypto.createCipheriv('aes-256-cbc', key, Buffer.alloc(16, 0)); // Assuming a 16-byte IV
            let encrypted = cipher.update(fileData);
            encrypted = Buffer.concat([encrypted, cipher.final()]);

            // Extract the directory path and file name from the full path
            const pathArray = fileName.split("/");
            const originalFileName = pathArray[pathArray.length - 1];
            const directoryPath = pathArray.slice(0, -1).join("/");

            // Extract the file extension from the original file name
            const fileExtension = originalFileName.split('.').pop();

            // Append the original file name and the file extension to the encrypted file name
            const fileName2 = `${directoryPath}/${originalFileName}.${fileExtension}.encrypt`;
            const destinationFile = bucket.file(fileName2);
            await destinationFile.save(encrypted);

            // Store the encryption key in Firestore
            await db.collection('encryptionKeys').add({
                filePath: fileName2,
                key: keyString
            });

            res.status(200).send(`Encryption Successful`);

        } catch (err) {
            console.error(err);
            res.status(500).send('Error Encrypting File');
        }
    }
);

exports.onScanDone = functions.firestore
    .document('/apps_scans/{docId}')
    .onCreate(async (snap, context) => {
        const data = snap.data();

        // Specify the bucket name and file name
        const bucketName = 'future-console.appspot.com';
        const fileName = `developers/${data.developer_id}/apps/${data.application_id}/releases/${data.app_name}`;


        // Get the file from Cloud Storage
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(fileName);
        const [fileData] = await file.download();

        //-------------ENCRYPTION-------------
        // Generate a symmetric key
        const key = crypto.randomBytes(32); // 256 bits

        // Convert the key to a base64 string
        const keyString = key.toString('base64');

        // Encrypt the file
        const cipher = crypto.createCipheriv('aes-256-cbc', key, Buffer.alloc(16, 0)); // Assuming a 16-byte IV
        let encrypted = cipher.update(fileData);
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        // Extract the directory path and file name from the full path
        const pathArray = fileName.split("/");
        const originalFileName = pathArray[pathArray.length - 1];
        const directoryPath = pathArray.slice(0, -1).join("/");

        // Append the original file name and the file extension to the encrypted file name
        const fileName2 = `${directoryPath}/${originalFileName}.encrypt`;

        const destinationFile = bucket.file(fileName2);
        await destinationFile.save(encrypted);

        // Store the encryption key in Firestore
        await db.collection('encryptionKeys').add({
            application_id: data.application_id,
            filePath: fileName2,
            key: keyString
        });

        //-------------IPFS-------------

        //Upload Encrypted asset to IPFS via Crust API and ipfs-http-client

        const client = await import('ipfs-http-client');
        const authHeader = `Basic ${CW3AUTH}`;

        const ipfsW3GW = 'https://crustipfs.xyz';

        const ipfs = client.create({
            url: `${ipfsW3GW}/api/v0`,
            headers: {
                authorization: authHeader
            }
        });

        const { cid } = await ipfs.add(encrypted);

        const docRef = admin.firestore().collection('apps').doc(data.application_id);
        await docRef.set({
            cid: cid.toV0().toString()
        }, { merge: true }); // Use { merge: true } to update the document if it already exists

        return Promise.resolve();
    });


exports.reviews = onRequest(
    async (req, res) => {
        try {
   
            const docRef = admin.firestore().collection('reviews').doc('queue');
            const doc = await docRef.get();
    
            if (!doc.exists) {
                res.status(404).send('Document not found');
                return;
            }
    
            const data = doc.data();
    
            res.status(200).send({
                reviews: data.list
            });
    
        } catch (err) {
            console.error(err);
            res.status(500).send('Error fetching document');
        }
    }
);


exports.faucet = onRequest(
    async (req, res) => {

        // Retrieve filepath from query parameters
        const requester = req.query.requester;

        // Check if parameters are missing
        if (!requester) {
            return res.status(400).send('Missing required wallet Address parameter');
        }
        try {

            const wsProvider = new WsProvider('wss://rpc1.relai.network');
            const api = await ApiPromise.create({ provider: wsProvider });

            const keyring = new Keyring({ type: 'sr25519' });
            const mnemonic = RL_FAUCET_SEED; 
            const account = keyring.addFromMnemonic(mnemonic);
            const txHash = await api.tx.balances
                .transfer(requester, RL_Amount)
                .signAndSend(account);


            res.status(200).send({
                faucet: "Token Sending Initiation Successful"
            });

        } catch (err) {
            console.error(err);
            res.status(500).send('Error Calling Faucet');
        }
    }
);