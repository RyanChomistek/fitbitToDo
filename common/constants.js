
// AUTHENTICATION
export const CLIENT_ID = "ae3c7cda-fbcd-4e66-83df-5ad6d682cd39";
export const CLIENT_SECRET = "e7j6xwEh3v2tx].Age_ehvZFP=BVu3vO";
export const AUTHORIZE_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
export const TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
export const REDIRECT_URI = "https://app-settings.fitbitdevelopercontent.com/simple-redirect.html";
export const SCOPES = "openid, profile, Tasks.Read, offline_access";

// COMMUNICATION
export const EntityTypes = {
    TaskFolders:0,
    TasksInFolder:1,
    Task:2,
}

export const RequestTypes = {
    Get: 0,
    Update: 1,
}

export const StatusMap = {
    false: "NotStarted",
    true: "Completed"
}

// Named Collection Ids
export const TaskFolderCollectionId = 1;

// DEVICE ONLY
export const SettingsFileName = "settings.txt";
export const TextColorFileName = "TextColor.txt";
export const DeviceFileNames = [TextColorFileName];