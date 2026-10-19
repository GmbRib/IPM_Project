import { router } from 'expo-router';

/**
 * Back, or home when there is nothing to go back to (a deep link, or a web page
 * refresh), so "back" and "save" never leave the user stuck on the same screen.
 */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
