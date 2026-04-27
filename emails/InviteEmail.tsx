import { Html, Body, Text, Link } from "@react-email/components";

interface InviteEmailProps {
  groupName: string;
  joinUrl: string;
}

export default function InviteEmail({ groupName, joinUrl }: InviteEmailProps) {
  return (
    <Html>
      <Body>
        <Text>You've been invited to join {groupName}.</Text>
        <Link href={joinUrl}>Join the group</Link>
      </Body>
    </Html>
  );
}
