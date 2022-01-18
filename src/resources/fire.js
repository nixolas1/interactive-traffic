import firebase from 'firebase/app'
import 'firebase/database'
import 'firebase/functions'

// Add additional services that you want to use
// require("firebase/auth");
// require("firebase/firestore");
// require("firebase/messaging");


var config = {
    apiKey: "AIzaSyCCPqHDlfu_YRvHPfLTcFVWy4pi95izK_0",
    authDomain: "ruter-interactive.firebaseapp.com",
    databaseURL: "https://ruter-interactive.firebaseio.com",
    projectId: "ruter-interactive",
    storageBucket: "ruter-interactive.appspot.com",
    messagingSenderId: "70403763527"
};
var fire = firebase.initializeApp(config);
export default fire;