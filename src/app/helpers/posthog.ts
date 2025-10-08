import { PostHog } from "posthog-node";

export default function PostHogClient() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;

  return new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    disableSurveys: true,
  });
}
