import { Html, Body, Text, Link } from "@react-email/components";

interface ConfirmEmailProps {
  confirmUrl: string;
  groupName: string;
}

export default function ConfirmEmail({ confirmUrl, groupName }: ConfirmEmailProps) {
  return (
    <Html>
      <Body>
        <Text>You've been invited to join {groupName}.</Text>
        <Link href={confirmUrl}>Confirm your email</Link>
      </Body>
    </Html>
  );
}
