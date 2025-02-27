import { Form, ActionPanel, Action, useNavigation } from "@raycast/api";
import { signup } from "./utils/api";
import VerifyCode from "./verify-code";
import { useForm, FormValidation } from "@raycast/utils";

interface SignupFormValues {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirmation: string;
  phone: string;
}

export default function Command() {
  const { push } = useNavigation();

  const { handleSubmit, itemProps } = useForm<SignupFormValues>({
    onSubmit: async (values) => {
      const success = await signup(values);
      if (success) {
        push(<VerifyCode phone={values.phone} />);
      }
    },
    validation: {
      email: (value) => {
        if (!value) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email address";
      },
      first_name: FormValidation.Required,
      last_name: FormValidation.Required,
      phone: (value) => {
        if (!value) return "Phone is required";
        if (!/^\+?[1-9]\d{1,14}$/.test(value)) return "Invalid phone number";
      },
      password: (value) => {
        if (!value) return "Password is required";
        if (value.length < 8) return "min. 8 characters";
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return "min. 1 special character";
        if (!/\d/.test(value)) return "min. 1 number";
      },
      password_confirmation: (value) => {
        if (!value) return "Please confirm your password";
        if (value !== itemProps.password.value) return "Passwords do not match";
      },
    },
  });

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Account" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        {...itemProps.email}
        title="Email"
        placeholder="your@email.com"
      />
      <Form.TextField
        {...itemProps.first_name}
        title="First Name"
        placeholder="John"
      />
      <Form.TextField
        {...itemProps.last_name}
        title="Last Name"
        placeholder="Doe"
      />
      <Form.PasswordField
        {...itemProps.password}
        title="Password"
      />
      <Form.PasswordField
        {...itemProps.password_confirmation}
        title="Confirm Password"
      />
      <Form.TextField
        {...itemProps.phone}
        title="Phone"
        placeholder="+491234567890"
      />
    </Form>
  );
}
