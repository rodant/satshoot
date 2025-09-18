import NDKSvelte from '@nostr-dev-kit/ndk-svelte';
import NDK from '@nostr-dev-kit/ndk';
import { writable } from 'svelte/store';

import { persisted } from 'svelte-persisted-store';
import type { Writable } from 'svelte/store';
import { bytesToHex, hexToBytes } from '@noble/ciphers/utils';
import { decryptSecret, encryptSecret } from '$lib/utils/crypto';

export const DEFAULTRELAYURLS = [
    // "wss://relay.nostr.band/",
    'wss://nos.lol/',
    'wss://bitcoiner.social/',
    'wss://relay.damus.io/',
];

export const BOOTSTRAPOUTBOXRELAYS = [
    'wss://purplepag.es/',
    'wss://indexer.coracle.social/',
    'wss://relay.damus.io/',
    // "wss://relay.nostr.band/",
    // "wss://nos.lol/",
    // "wss://bitcoiner.social/",
];

export const blastrUrl = 'wss://sendit.nosflare.com';

export enum RestoreMethod {
    Seed = 1,
    Nsec = 2,
}

export enum LoginMethod {
    Bunker = 'bunker',
    Nip07 = 'nip07',
    Local = 'local',
    NostrConnect = 'nostrconnect',
    Register = 'Register',
}

// save this in session storage when logging in or restoring cipher pk
// then check for pk store in login before trying to decrypt
// Saves us from decryption every time user reloads page during a session
export const sessionPK: Writable<string> = persisted('pk', '', { storage: 'session' });

export const sessionInitialized = writable(false);

const passphrase = "a0d4c4f38e7370b7fcea8fc49582724e614c97486d894eb8392af06f24051910";
const salt = "fbcf1278c4edf42c35adc3c923f252e9d043bccbe98f3c48df81d04f72f63d24";
export const nut13SeedStorage: Writable<Uint8Array | undefined> = persisted("nut13Seed", undefined, { 
    storage: "local",
    serializer: {
        stringify(seed: Uint8Array | undefined) {
            if (seed) {
                return encryptSecret(
                    bytesToHex(seed), 
                    passphrase, 
                    salt
                );
            } else return "";
        },
        parse(encrypted: string) {
            return hexToBytes(decryptSecret(encrypted, passphrase, salt));
        }
    }
});

// Client-side caching. Used for performance enhancement as well as a solution to identify
// new data and serve push notifications. Notify user when 'jobs of interest' change,
// that is, my jobs and jobs I bid on, as well as new messages
const ndkSvelte = new NDKSvelte({
    enableOutboxModel: true,
    outboxRelayUrls: BOOTSTRAPOUTBOXRELAYS,
    blacklistRelayUrls: [],
    autoConnectUserRelays: true,
    autoFetchUserMutelist: true,
    explicitRelayUrls: DEFAULTRELAYURLS,
});

export const bunkerNDK = writable(new NDK({ enableOutboxModel: false }));
export const bunkerRelayConnected = writable(false);

// Create a singleton instance that is the default export
const ndk = writable(ndkSvelte);

export default ndk;
