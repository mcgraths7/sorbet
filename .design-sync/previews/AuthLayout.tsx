import {
  AuthLayout,
  Button,
  Card,
  CardBody,
  Checkbox,
  Choice,
  Field,
  Input,
  Stack,
} from "@sorbet/component-library";

/** Sign-in panel: brand wordmark, a real credentials form, an alt line below. */
export function SignIn() {
  return (
    <AuthLayout brand="🌿 Sprig" alt="No account? Sign up">
      <Card>
        <CardBody>
          <Stack gap={4} as="form">
            <Field label="Email">
              <Input type="email" placeholder="you@company.com" defaultValue="maya@sprig.app" />
            </Field>
            <Field label="Password">
              <Input type="password" placeholder="••••••••" defaultValue="hunter22" />
            </Field>
            <Choice>
              <Checkbox defaultChecked /> Keep me signed in
            </Choice>
            <Button type="submit" full>
              Sign in
            </Button>
          </Stack>
        </CardBody>
      </Card>
    </AuthLayout>
  );
}

/** No brand slot, different alt line — a create-account variant of the same panel. */
export function CreateAccount() {
  return (
    <AuthLayout alt="Already have an account? Sign in">
      <Card>
        <CardBody>
          <Stack gap={4} as="form">
            <Field label="Full name">
              <Input placeholder="Ada Lovelace" defaultValue="Priya Raman" />
            </Field>
            <Field label="Work email">
              <Input type="email" placeholder="you@company.com" defaultValue="priya@brightlinemedia.com" />
            </Field>
            <Field label="Password" hint="At least 8 characters.">
              <Input type="password" placeholder="••••••••" defaultValue="brightline26" />
            </Field>
            <Choice>
              <Checkbox defaultChecked /> I agree to the Terms and Privacy Policy
            </Choice>
            <Button type="submit" full>
              Create account
            </Button>
          </Stack>
        </CardBody>
      </Card>
    </AuthLayout>
  );
}
