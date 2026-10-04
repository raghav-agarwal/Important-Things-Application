// Port of data/model/Categories.java
export const Categories = {
  BANK_ACCOUNT: {
    key: "BANK_ACCOUNT",
    category: "baccount",
    displayName: "Bank Accounts",
  },
  APPLICATIONS: {
    key: "APPLICATIONS",
    category: "application",
    displayName: "Applications",
  },
  NOTES: {
    key: "NOTES",
    category: "notes",
    displayName: "Notes",
  },
};

export const CategoriesList = [
  Categories.BANK_ACCOUNT,
  Categories.APPLICATIONS,
  Categories.NOTES,
];

export function getCategoryByFirestoreName(name) {
  return CategoriesList.find((c) => c.category === name) || null;
}

// Port of common/constants/DetailKeys.java
// Each entry: [firebaseKey, displayLabel]
export const DetailKeys = {
  CATEGORY_TYPE: { firebaseKey: "category_type", displayLabel: "Category" },
  NAME: { firebaseKey: "name", displayLabel: "Name" },
  NOTES: { firebaseKey: "notes", displayLabel: "Notes" },
  TYPE: { firebaseKey: "type", displayLabel: "" },
  OTHER_DETAILS_MAP: { firebaseKey: "others", displayLabel: "Others" },

  // Account Detail keys
  ACC_NO: { firebaseKey: "a_no", displayLabel: "Account No." },
  CARD_NO: { firebaseKey: "atm_no", displayLabel: "Card" },
  ATM_KEY: { firebaseKey: "atm_key", displayLabel: "Pin" },
  ATM_EXPIRY: { firebaseKey: "atm_expiry", displayLabel: "Expiry" },
  ATM_CV: { firebaseKey: "atm_cv", displayLabel: "CVV" },
  NET_USER: { firebaseKey: "net_username", displayLabel: "Username" },
  NET_KEY: { firebaseKey: "net_key", displayLabel: "Password" },

  // Application Detail keys
  APP_USER: { firebaseKey: "user", displayLabel: "Username" },
  APP_KEY: { firebaseKey: "key", displayLabel: "Password" },
};

// Field layout per category, in the order the original Android forms used them
// (does NOT include name/notes/type, which every category shares)
export const CategoryFieldLayout = {
  BANK_ACCOUNT: [
    "ACC_NO",
    "CARD_NO",
    "ATM_KEY",
    "ATM_EXPIRY",
    "ATM_CV",
    "NET_USER",
    "NET_KEY",
  ],
  APPLICATIONS: ["APP_USER", "APP_KEY"],
  NOTES: [],
};

// Maps DetailKeys entry -> the object property name used in JS detail objects
// (port of the @JsonElement-annotated Java field names)
export const FieldPropertyName = {
  NAME: "name",
  NOTES: "notes",
  TYPE: "type",
  ACC_NO: "accNo",
  CARD_NO: "cardNo",
  ATM_KEY: "atmKey",
  ATM_EXPIRY: "atmExpiry",
  ATM_CV: "atmCvv",
  NET_USER: "netUserName",
  NET_KEY: "netKey",
  APP_USER: "userName",
  APP_KEY: "key",
};

// Every JsonElement-annotated field per category (common fields + specific ones),
// port of Detail.java + AccountDetail/ApplicationDetail/NotesDetail.java
export const CategoryEncryptedFields = {
  BANK_ACCOUNT: ["NAME", "NOTES", "TYPE", ...CategoryFieldLayout.BANK_ACCOUNT],
  APPLICATIONS: ["NAME", "NOTES", "TYPE", ...CategoryFieldLayout.APPLICATIONS],
  NOTES: ["NAME", "NOTES", "TYPE"],
};

// Port of common/constants/Action.java
export const Action = {
  CREATE: { actionType: "create", displayValue: "Add" },
  UPDATE: { actionType: "update", displayValue: "Edit" },
  DELETE: { actionType: "delete", displayValue: "Delete" },
};

// Port of common/constants/FirebaseConstants.java
export const FirebaseConstants = {
  userCollection: "users",
  userName: "userId",
  userKey: "key",
  userDisplayName: "display_name",
  lastUpdated: "last_updated",
};

// Port of common/error/ErrorCodes.java
export const ErrorCodes = {
  NETWORK_ERROR: { code: 101, message: "Unknown Network Error" },
  VALIDATION_ERROR: { code: 201, message: "Validation Error" },
  DUPLICATE_ERROR: { code: 299, message: "Record not unique" },
  NOT_FOUND: { code: 301, message: "Value not Found Error" },
  MAPPING_ERROR: { code: 401, message: "Mapper Error" },
  AUTH_ERROR: { code: 501, message: "Authentication Failed" },
  UNKNOWN_ERROR: { code: 999, message: "Unknown Application Error" },
};

export class ApplicationError extends Error {
  constructor(errorCode, message) {
    super(message || errorCode?.message || "Unknown error");
    this.error = errorCode;
    this.appMessage = message || errorCode?.message;
  }
}
