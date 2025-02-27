import { Form, ActionPanel, Action } from "@raycast/api";
import { confirmSignup } from "./utils/api";
import { useRef } from "react";

interface Props {
  phone: string;
}

export default function Command({ phone }: Readonly<Props>) {
    const codeRef = useRef<string>();

  async function handleSubmit(values: { code: string }) {
    await confirmSignup(phone, values.code);
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Verify Code" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description text={`Enter the code sent to ${phone}`} />
      <Form.TextField
        id="code"
        title="Verification Code"
        placeholder="123456"
        onChange={(value) => codeRef.current = value}
      />
    </Form>
  );
}

