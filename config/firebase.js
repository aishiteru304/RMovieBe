import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyB1JkspJaztg_hfQ4rkdZHn63YJg_K9n64",
    authDomain: "final-9e50f.firebaseapp.com",
    projectId: "final-9e50f",
    storageBucket: "final-9e50f.appspot.com",
    messagingSenderId: "946023519565",
    appId: "1:946023519565:web:8a6ac1e1b46f5b2ea49304",
    measurementId: "G-248LW40T2G"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage };
