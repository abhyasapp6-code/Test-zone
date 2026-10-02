/* Firebase connection for CMA Tracker */

const firebaseConfig = {
  apiKey: "AIzaSyB5K_NQFZcgx5MxF16FgnOmUkoJTKuzDQw",
  authDomain: "cma-tracker-bdf7e.firebaseapp.com",
  projectId: "cma-tracker-bdf7e",
  storageBucket: "cma-tracker-bdf7e.firebasestorage.app",
  messagingSenderId: "398847721682",
  appId: "1:398847721682:web:1ee46925e1affd0b2a2d0b",
  measurementId: "G-FL5RCJZLBX"
};


/* ================================
   INITIALIZE FIREBASE
================================ */

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const fbAuth = firebase.auth();
const fbDb = firebase.firestore();

window.fbAuth = fbAuth;
window.fbDb = fbDb;


/* ================================
   DATA COLLECTIONS
================================ */

const DATA_COLLECTIONS = {
  cmaProgress: "topicProgress",
  cmaTasks: "tasks",
  cmaClasses: "classes",
  cmaRevisions: "revisions",
  cmaPractice: "practice",
  cmaTests: "tests"
};


/* ================================
   LOCAL CACHE
================================ */

function cacheUser(user) {
  localStorage.setItem("cmaUser", JSON.stringify(user));
}


/* ================================
   LOAD USER + CLOUD DATA
================================ */

async function loadCloudUser(firebaseUser) {

  if (!firebaseUser) {
    return null;
  }

  const snap = await fbDb
    .collection("users")
    .doc(firebaseUser.uid)
    .get();

  if (!snap.exists) {
    return null;
  }

  const user = {
    uid: firebaseUser.uid,
    ...snap.data()
  };

  cacheUser(user);


  /* Load all user data */

  for (const [key, collectionName] of Object.entries(DATA_COLLECTIONS)) {

    try {

      const dataSnap = await fbDb
        .collection("users")
        .doc(firebaseUser.uid)
        .collection(collectionName)
        .doc("state")
        .get();

      if (dataSnap.exists) {

        localStorage.setItem(
          key,
          JSON.stringify(dataSnap.data().value)
        );

      }

    } catch (error) {

      console.error(
        "Error loading " + key + ":",
        error
      );

    }

  }

  return user;
}


/* ================================
   SAVE USER PROFILE
================================ */

window.saveCloudUser = async function(user) {

  const current = fbAuth.currentUser;

  if (!current) {
    return;
  }

  const clean = {
    ...user
  };

  delete clean.uid;

  await fbDb
    .collection("users")
    .doc(current.uid)
    .set(
      {
        ...clean,
        updatedAt:
          firebase.firestore.FieldValue.serverTimestamp()
      },
      {
        merge: true
      }
    );

  cacheUser({
    uid: current.uid,
    ...clean
  });
};


/* ================================
   SAVE CLOUD DATA
================================ */

window.saveCloudData = async function(key, value) {

  const current = fbAuth.currentUser;

  if (!current) {
    return;
  }

  if (!DATA_COLLECTIONS[key]) {
    console.warn(
      "Unknown CMA Tracker data key:",
      key
    );
    return;
  }

  try {

    await fbDb
      .collection("users")
      .doc(current.uid)
      .collection(DATA_COLLECTIONS[key])
      .doc("state")
      .set({
        value: value,
        updatedAt:
          firebase.firestore.FieldValue.serverTimestamp()
      });

  } catch (error) {

    console.error(
      "Cloud save failed:",
      error
    );

  }
};


/* ================================
   DELETE CLOUD DATA
================================ */

window.deleteCloudData = async function(key) {

  const current = fbAuth.currentUser;

  if (!current) {
    return;
  }

  if (!DATA_COLLECTIONS[key]) {
    return;
  }

  await fbDb
    .collection("users")
    .doc(current.uid)
    .collection(DATA_COLLECTIONS[key])
    .doc("state")
    .delete();
};


/* ================================
   EMAIL/PASSWORD REGISTRATION
================================ */

window.registerCMAUser = async function({
  name,
  email,
  password
}) {

  const credential =
    await fbAuth.createUserWithEmailAndPassword(
      email,
      password
    );

  const user = {

    uid: credential.user.uid,

    name: name,

    email: email,

    course: null,

    groups: [],

    attempt: null,

    dailyHours: 4,

    preferredTime: "Morning",

    weeklyOff: "Sunday",

    setup: false,

    role: "student",

    createdAt:
      firebase.firestore.FieldValue.serverTimestamp()

  };


  await fbDb
    .collection("users")
    .doc(credential.user.uid)
    .set(user);


  cacheUser({
    ...user,
    createdAt: new Date().toISOString()
  });


  /* Send verification email */

  try {

    await credential.user.sendEmailVerification();

  } catch (error) {

    console.warn(
      "Verification email could not be sent:",
      error
    );

  }


  return credential.user;
};


/* ================================
   EMAIL/PASSWORD LOGIN
================================ */

window.loginCMAUser = async function(
  email,
  password
) {

  const credential =
    await fbAuth.signInWithEmailAndPassword(
      email,
      password
    );

  const user =
    await loadCloudUser(credential.user);

  if (!user) {

    throw new Error(
      "PROFILE_MISSING"
    );

  }

  return user;
};


/* ================================
   FINISH GOOGLE USER
================================ */

async function finishGoogleUser(firebaseUser) {

  if (!firebaseUser) {
    return null;
  }


  const userRef =
    fbDb
      .collection("users")
      .doc(firebaseUser.uid);


  const userSnap =
    await userRef.get();


  /* New Google user */

  if (!userSnap.exists) {

    const user = {

      uid: firebaseUser.uid,

      name:
        firebaseUser.displayName ||
        "CMA Student",

      email:
        firebaseUser.email ||
        "",

      course: null,

      groups: [],

      attempt: null,

      dailyHours: 4,

      preferredTime: "Morning",

      weeklyOff: "Sunday",

      setup: false,

      role: "student",

      createdAt:
        firebase.firestore.FieldValue.serverTimestamp()

    };


    await userRef.set(user);


    cacheUser({
      ...user,
      createdAt:
        new Date().toISOString()
    });


    return user;
  }


  /* Existing Google user */

  return await loadCloudUser(firebaseUser);
}


/* ================================
   GOOGLE LOGIN
   REDIRECT METHOD
================================ */

/*
   IMPORTANT:
   This function is attached directly to window
   so onclick="startGoogleLogin()" works from HTML.
*/

window.startGoogleLogin = async function() {

  try {

    const provider =
      new firebase.auth.GoogleAuthProvider();


    provider.setCustomParameters({
      prompt: "select_account"
    });


    /*
       Redirect is more reliable on
       mobile browsers and GitHub Pages.
    */

    await fbAuth.signInWithRedirect(
      provider
    );

  } catch (error) {

    console.error(
      "Google login start error:",
      error
    );

    alert(
      error.message ||
      "Unable to start Google sign-in."
    );

  }

};


/* ================================
   HANDLE GOOGLE REDIRECT
================================ */

window.handleGoogleRedirect = async function() {

  try {

    const result =
      await fbAuth.getRedirectResult();


    if (
      !result ||
      !result.user
    ) {

      return null;

    }


    return await finishGoogleUser(
      result.user
    );

  } catch (error) {

    console.error(
      "Google redirect error:",
      error
    );

    alert(
      error.message ||
      "Google sign-in failed."
    );

    return null;
  }

};


/* ================================
   GOOGLE LOGIN COMPATIBILITY
================================ */

/*
   Some existing pages may call:

   googleCMAUser()

   Keep this function so old HTML
   continues to work.
*/

window.googleCMAUser = async function() {

  return await window.startGoogleLogin();

};


/* ================================
   LOGOUT
================================ */

window.logoutCMA = async function() {

  try {

    await fbAuth.signOut();

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  }


  [
    "cmaUser",
    "cmaProgress",
    "cmaTasks",
    "cmaClasses",
    "cmaRevisions",
    "cmaPractice",
    "cmaTests"
  ].forEach(function(key) {

    localStorage.removeItem(key);

  });

};


/* ================================
   FIREBASE READY STATE
================================ */

window.cloudReady = new Promise(
  function(resolve) {

    let finished = false;


    function done(value) {

      if (!finished) {

        finished = true;

        resolve(value);

      }

    }


    fbAuth.onAuthStateChanged(
      async function(firebaseUser) {

        /*
           User is logged out.
        */

        if (!firebaseUser) {

          done(null);

          return;

        }


        /*
           User is logged in.
           Load Firestore profile/data.
        */

        try {

          const user =
            await loadCloudUser(
              firebaseUser
            );

          done(user);

        } catch (error) {

          console.error(
            "Firebase hydration failed:",
            error
          );


          /*
             If cloud loading fails,
             use locally cached user.
          */

          let localUser = null;

          try {

            localUser =
              JSON.parse(
                localStorage.getItem(
                  "cmaUser"
                ) || "null"
              );

          } catch (_) {

            localUser = null;

          }


          done(localUser);

        }

      }
    );

  }
);
