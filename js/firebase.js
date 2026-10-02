/* Firebase connection for CMA Tracker */
const firebaseConfig = {
  apiKey: "AIzaSyB5K_NQFZcg5MxF16FgnOmUkoJTKuzDQw",
  authDomain: "cma-tracker-bdf7e.firebaseapp.com",
  projectId: "cma-tracker-bdf7e",
  storageBucket: "cma-tracker-bdf7e.firebasestorage.app",
  messagingSenderId: "398847721682",
  appId: "1:398847721682:web:1ee46925e1affd0b2a2d0b",
  measurementId: "G-FL5RCJZLBX"
};

firebase.initializeApp(firebaseConfig);
const fbAuth = firebase.auth();
const fbDb = firebase.firestore();
window.fbAuth = fbAuth;
window.fbDb = fbDb;

const DATA_COLLECTIONS = {
  cmaProgress: "topicProgress",
  cmaTasks: "tasks",
  cmaClasses: "classes",
  cmaRevisions: "revisions",
  cmaPractice: "practice",
  cmaTests: "tests"
};

function cacheUser(user) {
  localStorage.setItem("cmaUser", JSON.stringify(user));
}

async function loadCloudUser(firebaseUser) {
  if (!firebaseUser) return null;
  const snap = await fbDb.collection("users").doc(firebaseUser.uid).get();
  if (!snap.exists) return null;
  const user = { uid: firebaseUser.uid, ...snap.data() };
  cacheUser(user);

  for (const [key, collectionName] of Object.entries(DATA_COLLECTIONS)) {
    const dataSnap = await fbDb.collection("users").doc(firebaseUser.uid)
      .collection(collectionName).doc("state").get();
    if (dataSnap.exists) localStorage.setItem(key, JSON.stringify(dataSnap.data().value));
  }
  return user;
}

window.saveCloudUser = async function(user) {
  const current = fbAuth.currentUser;
  if (!current) return;
  const clean = { ...user };
  delete clean.uid;
  await fbDb.collection("users").doc(current.uid).set({
    ...clean,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  cacheUser({ uid: current.uid, ...clean });
};

window.saveCloudData = async function(key, value) {
  const current = fbAuth.currentUser;
  if (!current || !DATA_COLLECTIONS[key]) return;
  await fbDb.collection("users").doc(current.uid)
    .collection(DATA_COLLECTIONS[key]).doc("state").set({
      value,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
};

window.deleteCloudData = async function(key) {
  const current = fbAuth.currentUser;
  if (!current || !DATA_COLLECTIONS[key]) return;
  await fbDb.collection("users").doc(current.uid)
    .collection(DATA_COLLECTIONS[key]).doc("state").delete();
};

window.registerCMAUser = async function({name, email, password}) {
  const credential = await fbAuth.createUserWithEmailAndPassword(email, password);
  const user = {
    uid: credential.user.uid,
    name,
    email,
    course: null,
    groups: [],
    attempt: null,
    dailyHours: 4,
    preferredTime: "Morning",
    weeklyOff: "Sunday",
    setup: false,
    role: "student",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  await fbDb.collection("users").doc(credential.user.uid).set(user);
  cacheUser({ ...user, createdAt: new Date().toISOString() });
  try { await credential.user.sendEmailVerification(); } catch (_) {}
  return credential.user;
};

window.loginCMAUser = async function(email, password) {
  const credential = await fbAuth.signInWithEmailAndPassword(email, password);
  const user = await loadCloudUser(credential.user);
  if (!user) throw new Error("PROFILE_MISSING");
  return user;
};

async function finishGoogleUser(firebaseUser) {
  let userSnap = await fbDb.collection("users").doc(firebaseUser.uid).get();
  if (!userSnap.exists) {
    const user = {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName || "CMA Student",
      email: firebaseUser.email || "",
      course: null,
      groups: [],
      attempt: null,
      dailyHours: 4,
      preferredTime: "Morning",
      weeklyOff: "Sunday",
      setup: false,
      role: "student",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await fbDb.collection("users").doc(firebaseUser.uid).set(user);
    cacheUser({ ...user, createdAt: new Date().toISOString() });
    return user;
  }
  return loadCloudUser(firebaseUser);
}

// Redirect is used instead of popup because mobile browsers and GitHub Pages
// can block popup windows. This is the more reliable Google-login flow.
window.startGoogleLogin = async function() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await fbAuth.signInWithRedirect(provider);
};

window.handleGoogleRedirect = async function() {
  const result = await fbAuth.getRedirectResult();
  if (!result || !result.user) return null;
  return finishGoogleUser(result.user);
};

window.googleCMAUser = async function() {
  // Kept as a compatibility wrapper for existing pages.
  return startGoogleLogin();
};

window.logoutCMA = async function() {
  await fbAuth.signOut();
  ["cmaUser","cmaProgress","cmaTasks","cmaClasses","cmaRevisions","cmaPractice","cmaTests"].forEach(k => localStorage.removeItem(k));
};

window.cloudReady = new Promise(resolve => {
  let finished = false;
  const done = value => { if (!finished) { finished = true; resolve(value); } };
  fbAuth.onAuthStateChanged(async firebaseUser => {
    if (!firebaseUser) return done(null);
    try { done(await loadCloudUser(firebaseUser)); }
    catch (e) { console.error("Firebase hydration failed:", e); done(JSON.parse(localStorage.getItem("cmaUser") || "null")); }
  });
});
