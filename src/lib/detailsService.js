import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { hide, unHide } from "./crypto";
import {
  Categories,
  DetailKeys,
  FieldPropertyName,
  CategoryEncryptedFields,
  FirebaseConstants,
  ErrorCodes,
  ApplicationError,
} from "../models/constants";

/**
 * Faithful port of firebase/dao/UserDetailsDao.java + the detail-related
 * methods of firebase/services/FirebaseMapper.java.
 *
 * Kept 1:1 with the original app, including its quirks:
 *  - EVERY string field on a detail (including "name") is individually
 *    AES-encrypted before being stored, the same way the Android app does it.
 *  - The (encrypted) "name" value is used as the Firestore document ID for
 *    that detail. AES-ECB/base64 output can contain "/", which Firestore
 *    document IDs can't contain - if you hit this, the save will fail. This
 *    is a pre-existing limitation of the original app, not something this
 *    port introduces.
 *  - category_type and last_updated are stored in plaintext.
 *  - Details live under users/{loggedInUser.username.toLowerCase()}/{category}.
 */

function dateString(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

export function buildEmptyDetail(categoryKey) {
  const fields = CategoryEncryptedFields[categoryKey] || [];
  const detail = {
    categoryType: categoryKey,
    lastUpdatedDate: dateString(),
    otherDetailsMap: {},
  };
  fields.forEach((f) => {
    detail[FieldPropertyName[f]] = "";
  });
  detail.type = Categories[categoryKey]?.displayName || "";
  return detail;
}

function detailsMapper(data, secret) {
  const categoryKey = Object.keys(Categories).find(
    (k) => Categories[k].category === data[DetailKeys.CATEGORY_TYPE.firebaseKey]
  );
  if (!categoryKey) {
    throw new ApplicationError(ErrorCodes.MAPPING_ERROR, "Unknown category type");
  }

  const detail = { categoryType: categoryKey, otherDetailsMap: {} };
  const fields = CategoryEncryptedFields[categoryKey] || [];

  fields.forEach((f) => {
    const key = DetailKeys[f].firebaseKey;
    const prop = FieldPropertyName[f];
    detail[prop] = unHide(data[key], secret);
  });

  if (data[FirebaseConstants.lastUpdated]) {
    detail.lastUpdatedDate = String(data[FirebaseConstants.lastUpdated]);
  }

  const others = data[DetailKeys.OTHER_DETAILS_MAP.firebaseKey];
  if (others) {
    const decoded = {};
    Object.entries(others).forEach(([k, v]) => {
      decoded[unHide(k, secret)] = unHide(v, secret);
    });
    detail.otherDetailsMap = decoded;
  }

  return detail;
}

function getObjectMap(detail, secret) {
  const fields = CategoryEncryptedFields[detail.categoryType] || [];
  const map = {};

  fields.forEach((f) => {
    const key = DetailKeys[f].firebaseKey;
    const prop = FieldPropertyName[f];
    map[key] = hide(detail[prop] ?? "", secret);
  });

  map[DetailKeys.CATEGORY_TYPE.firebaseKey] = Categories[detail.categoryType].category;
  map[FirebaseConstants.lastUpdated] = detail.lastUpdatedDate || dateString();

  const otherEncoded = {};
  Object.entries(detail.otherDetailsMap || {}).forEach(([k, v]) => {
    otherEncoded[hide(k, secret)] = hide(v, secret);
  });
  map[DetailKeys.OTHER_DETAILS_MAP.firebaseKey] = otherEncoded;

  return map;
}

function categoryCollection(username, categoryKey) {
  return collection(
    db,
    FirebaseConstants.userCollection,
    username.toLowerCase(),
    Categories[categoryKey].category
  );
}

export async function getCategoryDetails(username, secret, categoryKey) {
  try {
    const snap = await getDocs(categoryCollection(username, categoryKey));
    const map = {};
    snap.forEach((docSnap) => {
      const detail = detailsMapper(docSnap.data(), secret);
      map[detail.name] = detail;
    });
    return map;
  } catch (e) {
    if (e instanceof ApplicationError) throw e;
    throw new ApplicationError(ErrorCodes.NETWORK_ERROR, "Error getting category documents.");
  }
}

export async function saveDetail(username, secret, detail) {
  try {
    const objectMap = getObjectMap(detail, secret);
    const docId = objectMap[DetailKeys.NAME.firebaseKey];
    const ref = doc(categoryCollection(username, detail.categoryType), docId);
    await setDoc(ref, objectMap);
    return detail;
  } catch (e) {
    throw new ApplicationError(ErrorCodes.NETWORK_ERROR, "Error saving detail.");
  }
}

export async function deleteDetail(username, secret, detail) {
  try {
    const objectMap = getObjectMap(detail, secret);
    const docId = objectMap[DetailKeys.NAME.firebaseKey];
    const ref = doc(categoryCollection(username, detail.categoryType), docId);
    await deleteDoc(ref);
    return detail;
  } catch (e) {
    throw new ApplicationError(ErrorCodes.NETWORK_ERROR, "Error deleting detail.");
  }
}

export function validateDetail(detail, action) {
  if (!detail.name || !detail.name.trim()) {
    throw new ApplicationError(ErrorCodes.VALIDATION_ERROR, "Detail Name is empty");
  }

  if (detail.categoryType === "APPLICATIONS") {
    if (!detail.userName || !detail.key) {
      throw new ApplicationError(ErrorCodes.VALIDATION_ERROR, "Username or Password is empty");
    }
  } else if (detail.categoryType === "BANK_ACCOUNT") {
    if (!detail.accNo && !detail.cardNo && !detail.netUserName) {
      throw new ApplicationError(
        ErrorCodes.VALIDATION_ERROR,
        "Account Number, Card & username are empty at the same time"
      );
    }
  }
}
