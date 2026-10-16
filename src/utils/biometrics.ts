/**
 * Web Authentication API (WebAuthn / Biometrics) helper
 * Supports fingerprint / Face ID platform authenticators with graceful fallback to PIN.
 */

export async function isBiometricsAvailable(): Promise<boolean> {
  if (
    typeof window === 'undefined' ||
    !window.PublicKeyCredential ||
    !navigator.credentials
  ) {
    return false;
  }

  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return !!available;
  } catch {
    return false;
  }
}

// Convert string to Uint8Array challenge
function strToBuffer(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert ArrayBuffer to base64url string
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Register biometric platform credential on the user's device
 */
export async function registerBiometricCredential(
  userName: string = 'Centra User'
): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  try {
    const isAvail = await isBiometricsAvailable();
    if (!isAvail) {
      return { success: false, error: 'Biometric authenticator is not available on this device' };
    }

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const userId = new Uint8Array(16);
    crypto.getRandomValues(userId);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Centra Finance Vault',
        id: window.location.hostname || 'localhost',
      },
      user: {
        id: userId,
        name: userName,
        displayName: userName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential;

    if (!credential) {
      return { success: false, error: 'Failed to create biometric credential' };
    }

    const credentialId = bufferToBase64Url(credential.rawId);
    return { success: true, credentialId };
  } catch (err: any) {
    console.warn('Biometric registration error/canceled:', err);
    return {
      success: false,
      error: err.name === 'NotAllowedError' ? 'Fingerprint request was canceled or timed out.' : err.message,
    };
  }
}

/**
 * Authenticate with biometric fingerprint / Face ID
 */
export async function authenticateWithBiometrics(
  credentialId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!window.PublicKeyCredential || !navigator.credentials) {
      return { success: false, error: 'WebAuthn is not supported by this browser.' };
    }

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const allowCredentials: PublicKeyCredentialDescriptor[] = [];
    if (credentialId) {
      // Decode base64url to Uint8Array
      try {
        const binary = atob(credentialId.replace(/-/g, '+').replace(/_/g, '/'));
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        allowCredentials.push({
          id: bytes,
          type: 'public-key',
          transports: ['internal'],
        });
      } catch {}
    }

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId: window.location.hostname || 'localhost',
      userVerification: 'required',
      timeout: 60000,
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    };

    const assertion = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    })) as PublicKeyCredential;

    if (assertion) {
      return { success: true };
    }
    return { success: false, error: 'Biometric verification failed.' };
  } catch (err: any) {
    console.warn('Biometric verification error/canceled:', err);
    return {
      success: false,
      error:
        err.name === 'NotAllowedError'
          ? 'Biometric prompt was canceled.'
          : err.message || 'Biometric authentication failed.',
    };
  }
}
