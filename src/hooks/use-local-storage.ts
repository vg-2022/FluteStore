
'use client';

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

// This custom hook is no longer the primary source of truth for settings,
// but can still be useful for non-critical, client-side state persistence.

// A custom event to notify other tabs (and this one) of changes
const DISPATCH_STORAGE_EVENT = 'dispatchstoragesyncevent';

function getStoredValue<T>(key: string, initialValue: T): T {
    if (typeof window === 'undefined') {
        return initialValue;
    }
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
    } catch (error) {
        console.warn(`Error reading localStorage key “${key}”:`, error);
        return initialValue;
    }
}

function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => getStoredValue(key, initialValue));

    useEffect(() => {
        setStoredValue(getStoredValue(key, initialValue));
    }, [key, initialValue]);

    const setValue: Dispatch<SetStateAction<T>> = useCallback(
        (value) => {
            if (typeof window === 'undefined') {
              console.warn(`Tried to set localStorage key “${key}” even though window is not defined.`);
              return;
            }

            const newValue = value instanceof Function ? value(storedValue) : value;

            try {
                window.localStorage.setItem(key, JSON.stringify(newValue));
                setStoredValue(newValue);
                window.dispatchEvent(new CustomEvent(DISPATCH_STORAGE_EVENT, { detail: { key, newValue } }));
            } catch (error) {
                console.warn(`Error setting localStorage key “${key}”:`, error);
            }
        },
        [key, storedValue],
    );

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.newValue) {
                try {
                    setStoredValue(JSON.parse(e.newValue));
                } catch (error) {
                    console.warn(`Error parsing newValue for key “${key}” from storage event:`, error);
                }
            }
        };

        const handleCustomEvent = (e: Event) => {
            const { key: eventKey, newValue } = (e as CustomEvent).detail;
            if (eventKey === key) {
                setStoredValue(newValue);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener(DISPATCH_STORAGE_EVENT, handleCustomEvent);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener(DISPATCH_STORAGE_EVENT, handleCustomEvent);
        };
    }, [key]);

    return [storedValue, setValue];
}

export { useLocalStorage };
