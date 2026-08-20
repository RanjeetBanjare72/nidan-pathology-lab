import { supabase } from "./supabase";

const SESSION_STORAGE_PREFIXES = [
  "sb-",
  "supabase.auth.token",
];

const APP_STORAGE_KEYS = [
  "nidanPatient",
  "nidanSelectedTests",
  "nidanResults",
  "nidanBilling",
];

function clearStorage(storage, shouldRemove) {
  if (!storage) return;

  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);

    if (key && shouldRemove(key)) {
      storage.removeItem(key);
    }
  }
}

export async function logoutAndRedirect(redirectTo = "/login") {
  const { error } = await supabase.auth.signOut({
    scope: "local",
  });

  if (error) {
    throw error;
  }

  if (typeof window !== "undefined") {
    clearStorage(window.localStorage, (key) =>
      SESSION_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix)) ||
      APP_STORAGE_KEYS.includes(key)
    );

    clearStorage(window.sessionStorage, () => true);

    window.location.replace(redirectTo);
  }
}
