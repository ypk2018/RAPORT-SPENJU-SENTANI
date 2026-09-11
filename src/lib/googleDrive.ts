import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token might have expired or wasn't cached in this session.
        // On refresh, we can trigger sign-in button state, but wait for user interaction to sign in again.
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

/**
 * Searches for a folder with the given name on Google Drive.
 */
export const searchFolder = async (accessToken: string, folderName: string): Promise<string | null> => {
  const query = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`);
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    } else {
      console.error('Failed to search folder:', await res.text());
    }
  } catch (err) {
    console.error('Search folder error:', err);
  }
  return null;
};

/**
 * Creates a folder with the given name on Google Drive.
 */
export const createFolder = async (accessToken: string, folderName: string): Promise<string> => {
  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gagal membuat folder Google Drive: ${text}`);
  }
  const data = await res.json();
  return data.id;
};

/**
 * Uploads a PDF Blob to Google Drive inside a specific folder.
 */
export const uploadPdfToDrive = async (
  accessToken: string,
  pdfBlob: Blob,
  filename: string,
  folderId?: string
): Promise<string> => {
  const metadata: any = {
    name: filename,
    mimeType: "application/pdf",
  };
  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = '324324324324324324';
  const delimiter = `\r\n--${boundary}\r\n`;
  const close_delim = `\r\n--${boundary}--`;

  // Construct a multipart/related body with metadata and PDF binary stream
  const parts = [
    delimiter,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    JSON.stringify(metadata),
    delimiter,
    'Content-Type: application/pdf\r\n\r\n',
    pdfBlob,
    close_delim
  ];

  const multipartBody = new Blob(parts, { type: `multipart/related; boundary=${boundary}` });

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartBody
  });

  if (!response.ok) {
    const errMsg = await response.text();
    throw new Error(`Google Drive API error: ${response.status} - ${errMsg}`);
  }

  const resData = await response.json();
  return resData.id;
};
