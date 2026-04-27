import { Html, Body, Text, Link } from "@react-email/components";

interface NewsletterEmailProps {
  groupName: string;
  content: string;
  unsubscribeUrl: string;
}

export default function NewsletterEmail({
  groupName,
  content,
  unsubscribeUrl,
}: NewsletterEmailProps) {
  return (
    <Html>
      <Body>
        <Text>{groupName} — this week's newsletter:</Text>
        <Text>{content}</Text>
        <Text>
          <Link href={unsubscribeUrl}>Unsubscribe</Link>
        </Text>
      </Body>
    </Html>
  );
}
