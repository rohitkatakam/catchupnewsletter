import { Html, Body, Text, Link } from "@react-email/components";

interface PromptEmailProps {
  prompt: string;
  groupName: string;
  respondUrl: string;
  unsubscribeUrl: string;
}

export default function PromptEmail({
  prompt,
  groupName,
  respondUrl,
  unsubscribeUrl,
}: PromptEmailProps) {
  return (
    <Html>
      <Body>
        <Text>{groupName} — this week's prompt:</Text>
        <Text>{prompt}</Text>
        <Link href={respondUrl}>Submit your response</Link>
        <Text>
          <Link href={unsubscribeUrl}>Unsubscribe</Link>
        </Text>
      </Body>
    </Html>
  );
}
