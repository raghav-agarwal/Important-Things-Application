import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { hide, unHide } from "./crypto";
import { FirebaseConstants, ErrorCodes, ApplicationError } from "../models/constants";

/**
 * Faithful port of:
 *  - firebase/dao/AuthenticationDao.java
 *  - the user-related methods of firebase/services/FirebaseMapper.java
 *
 * Kept 1:1 with the original app's behaviour, including its quirks:
 *
 *  - The "userId" field stored in Firestore is actually the registration
 *    "Name" value (not the login username) - see getUserMap().
 *  - The PIN is encrypted with a key derived from the *login username* at
 *    registration time, but decrypted with a key derived from the "userId"
 *    field (= Name) at login time. These only match if Name and Username
 *    are the same string. In practice, register with the same value for
 *    both fields (this is what the original Android app has always
 *    required in order to work).
 *  - Detail documents (bank accounts / applications / notes) live under
 *    users/{Name, lowercased} - i.e. keyed off the "Name" field, not the
 *    original registration document ID.
 *
 * These are documented here rather than "fixed" so the web app reads and
 * writes data compatibly with your existing Firestore project.
 */

function userMapper(data) {
  return {
    username: String(data[FirebaseConstants.userName]),
    displayName: String(data[FirebaseConstants.userDisplayName]),
  };
}

function getUserKey(data) {
  const secret = String(data[FirebaseConstants.userName]);
  try {
    return unHide(data[FirebaseConstants.userKey], secret);
  } catch (e) {
    return "";
  }
}

function getUserMap({ name, user, pin }) {
  const map = {};
  map[FirebaseConstants.userName] = name;
  map[FirebaseConstants.userDisplayName] = name;
  map[FirebaseConstants.userKey] = hide(pin, user);
  return map;
}

export async function login(user, key) {
  const ref = doc(db, FirebaseConstants.userCollection, user.toLowerCase());
  let snap;
  try {
    snap = await getDoc(ref);
  } catch (e) {
    throw new ApplicationError(ErrorCodes.NETWORK_ERROR, "Error getting user.");
  }

  const data = snap.exists() ? snap.data() : null;
  if (!data) {
    throw new ApplicationError(ErrorCodes.NOT_FOUND, "User not found");
  }

  if (getUserKey(data) === key) {
    return userMapper(data);
  }
  throw new ApplicationError(ErrorCodes.AUTH_ERROR, "Authentication Error");
}

export async function register({ name, user, pin, pinVerify }) {
  if (!name || !user || !pin || !pinVerify) {
    throw new ApplicationError(ErrorCodes.VALIDATION_ERROR, "All fields are required.");
  }
  if (pin !== pinVerify) {
    throw new ApplicationError(ErrorCodes.VALIDATION_ERROR, "Pin do not match!");
  }

  const ref = doc(db, FirebaseConstants.userCollection, user);
  let snap;
  try {
    snap = await getDoc(ref);
  } catch (e) {
    throw new ApplicationError(ErrorCodes.NOT_FOUND, "User not found");
  }

  const data = snap.exists() ? snap.data() : null;

  if (data) {
    if (getUserKey(data) === pin) {
      return userMapper(data);
    }
    throw new ApplicationError(ErrorCodes.DUPLICATE_ERROR, "User already Exists");
  }

  try {
    await setDoc(ref, getUserMap({ name, user, pin }));
    return null; // matches original: onSuccess(null) on fresh registration
  } catch (e) {
    throw new ApplicationError(ErrorCodes.NETWORK_ERROR);
  }
}
