'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

interface SecurityContextType {
  isBiometricSupported: boolean;
  isBiometricEnabled: boolean;
  hasPin: boolean;
  isLocked: boolean;
  lockOnBlur: boolean;
  enableBiometrics: () => Promise<boolean>;
  disableBiometrics: () => void;
  setSecurityPin: (pin: string) => Promise<boolean>;
  removeSecurityPin: () => void;
  setLockOnBlur: (enabled: boolean) => void;
  authenticateWithBiometrics: () => Promise<boolean>;
  authenticateWithPin: (pin: string) => Promise<boolean>;
  lockApp: () => void;
  unlockApp: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

// Helper: base64 to buffer and back
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper: SHA-256 hash
async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`mm_salt_2026_${pin}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToBase64(hashBuffer);
}

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockOnBlur, setLockOnBlurState] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check support and load saved settings
  useEffect(() => {
    async function initSecurity() {
      // 1. Check WebAuthn platform authenticator support (Fingerprint / Face ID)
      if (
        typeof window !== 'undefined' &&
        window.PublicKeyCredential &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
      ) {
        try {
          const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsBiometricSupported(available);
        } catch {
          setIsBiometricSupported(false);
        }
      }

      // 2. Load stored settings from localStorage
      const bioEnabled = localStorage.getItem('mm_biometric_enabled') === 'true';
      const storedPinHash = localStorage.getItem('mm_pin_hash');
      const lockOnBlurSetting = localStorage.getItem('mm_lock_on_blur') !== 'false';

      setIsBiometricEnabled(bioEnabled);
      setHasPin(Boolean(storedPinHash));
      setLockOnBlurState(lockOnBlurSetting);

      // 3. If either biometrics or PIN is enabled, lock upon app opening
      if (bioEnabled || storedPinHash) {
        setIsLocked(true);
      }

      setIsInitialized(true);
    }

    initSecurity();
  }, []);

  // Auto-lock when user leaves the app (minimize, tab switch, screen lock)
  useEffect(() => {
    if (!isInitialized || !lockOnBlur) return;
    if (!isBiometricEnabled && !hasPin) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsLocked(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isInitialized, lockOnBlur, isBiometricEnabled, hasPin]);

  // Lock and Unlock handlers
  const lockApp = useCallback(() => {
    if (isBiometricEnabled || hasPin) {
      setIsLocked(true);
    }
  }, [isBiometricEnabled, hasPin]);

  const unlockApp = useCallback(() => {
    setIsLocked(false);
  }, []);

  // Set Lock on Blur
  const setLockOnBlur = (enabled: boolean) => {
    setLockOnBlurState(enabled);
    localStorage.setItem('mm_lock_on_blur', String(enabled));
  };

  // Register / Enable Biometrics
  const enableBiometrics = async (): Promise<boolean> => {
    if (!window.PublicKeyCredential) {
      alert('המכשיר או הדפדפן אינם תומכים ב-WebAuthn');
      return false;
    }

    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = crypto.getRandomValues(new Uint8Array(16));

      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'Money Manager',
            id: window.location.hostname,
          },
          user: {
            id: userId,
            name: 'user@moneymanager.local',
            displayName: 'משתמש Money Manager',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },  // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'preferred',
          },
          timeout: 60000,
          attestation: 'none',
        },
      })) as PublicKeyCredential | null;

      if (credential) {
        const credId = bufferToBase64(credential.rawId);
        localStorage.setItem('mm_biometric_cred_id', credId);
        localStorage.setItem('mm_biometric_enabled', 'true');
        setIsBiometricEnabled(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Biometric registration error:', err);
      return false;
    }
  };

  // Disable Biometrics
  const disableBiometrics = () => {
    localStorage.removeItem('mm_biometric_cred_id');
    localStorage.removeItem('mm_biometric_enabled');
    setIsBiometricEnabled(false);
  };

  // Authenticate with Biometrics
  const authenticateWithBiometrics = async (): Promise<boolean> => {
    if (!window.PublicKeyCredential) return false;

    const credIdStr = localStorage.getItem('mm_biometric_cred_id');
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    try {
      const getOptions: CredentialRequestOptions = {
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'required',
          ...(credIdStr
            ? {
                allowCredentials: [
                  {
                    id: base64ToBuffer(credIdStr),
                    type: 'public-key',
                  },
                ],
              }
            : {}),
        },
      };

      const assertion = await navigator.credentials.get(getOptions);
      if (assertion) {
        setIsLocked(false);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Biometric auth cancelled or failed:', err);
      return false;
    }
  };

  // Set PIN
  const setSecurityPin = async (pin: string): Promise<boolean> => {
    if (!pin || pin.length < 4) return false;
    const hash = await hashPin(pin);
    localStorage.setItem('mm_pin_hash', hash);
    setHasPin(true);
    return true;
  };

  // Remove PIN
  const removeSecurityPin = () => {
    localStorage.removeItem('mm_pin_hash');
    setHasPin(false);
  };

  // Authenticate with PIN
  const authenticateWithPin = async (enteredPin: string): Promise<boolean> => {
    const storedHash = localStorage.getItem('mm_pin_hash');
    if (!storedHash) return false;

    const enteredHash = await hashPin(enteredPin);
    if (enteredHash === storedHash) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  return (
    <SecurityContext.Provider
      value={{
        isBiometricSupported,
        isBiometricEnabled,
        hasPin,
        isLocked,
        lockOnBlur,
        enableBiometrics,
        disableBiometrics,
        setSecurityPin,
        removeSecurityPin,
        setLockOnBlur,
        authenticateWithBiometrics,
        authenticateWithPin,
        lockApp,
        unlockApp,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
