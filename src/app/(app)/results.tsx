import { Redirect } from 'expo-router';

// Preserve existing bookmarks without adding a fifth Member tab.
export default function Results() { return <Redirect href="/progress" />; }
