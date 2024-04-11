# Backend Cloud Functions used in Relai Network

The following functions are available:

`encryptFile`: Rest API endpoint that can be called to encrypt an asset (apk, ebook,...) using symmetric encryption and storing 
the encryption key on Firestore database

`onScanDone`: A trigger function that executes when a scan is done after an apk is submitted and scanned through
the [SAST/DAST MobSF Gateway](https://github.com/RELAI-Network/sast-dast-gateway) and called by
the [Futur Console](https://github.com/RELAI-Network/futur-console-react)  is done and is successful.
In this case a document is created in the Firestore Database with the scan data.
After the encryption is done the asset can be stored through IPFS and pinned.

`reviews`: Rest API endpoint that is called by the Relai Network Offchain Worker the fetch reviews made by FuturStore app
users and store them onchain 

`faucet`: Rest API endpoint that serves as a faucet to request tokens to be used in the Relai Network via [FuturStore](https://github.com/RELAI-Network/futurstore-app) 
mobile app or the [Futur Console](https://github.com/RELAI-Network/futur-console-react) web app.
