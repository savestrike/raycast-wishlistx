import { Form, ActionPanel, Action } from "@raycast/api";
import { signIn } from "./utils/auth";

export default function Command() {
  async function handleSubmit(values: { phone: string; password: string }) {
    await signIn(values.phone, values.password);
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Sign In" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="phone"
        title="Phone"
        placeholder="+491234567890"
      />
      <Form.PasswordField
        id="password"
        title="Password"
      />
    </Form>
  );
}
