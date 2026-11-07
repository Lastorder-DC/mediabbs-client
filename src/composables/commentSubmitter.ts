import { shallowRef } from "vue";

/**
 * Set by the topic page while it is shown, so an editor rendered elsewhere
 * (e.g. a modal in the layout) can post a comment and refresh the list.
 */
export const commentSubmitter = shallowRef<((content: string) => Promise<boolean>) | null>(null);
