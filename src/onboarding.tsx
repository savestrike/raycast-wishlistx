import { Form, ActionPanel, Action, useNavigation } from "@raycast/api";
import { signup } from "./utils/api";
import VerifyCode from "./verify-code";

export default function Command() {
  const { push } = useNavigation();

  async function handleSubmit(values: {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    password_confirmation: string;
    phone: string;
  }) {
    const success = await signup(values);
    if (success) {
      push(<VerifyCode phone={values.phone} />);
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Account" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="email" title="Email" placeholder="your@email.com" />
      <Form.TextField id="first_name" title="First Name" placeholder="John" />
      <Form.TextField id="last_name" title="Last Name" placeholder="Doe" />
      <Form.PasswordField id="password" title="Password" />
      <Form.PasswordField id="password_confirmation" title="Confirm Password" />
      <Form.TextField
        id="phone"
        title="Phone"
        placeholder="+491234567890"
      />
    </Form>
  );
}
