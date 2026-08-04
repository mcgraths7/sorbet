import { Footer, FooterCol, FooterCols, FooterMeta } from "@sorbet/component-library";

/** Every column with a heading — FooterCol's usual shape: an optional
 *  `sb-footer__heading` label above the link list. */
export function Default() {
  return (
    <Footer>
      <FooterCols>
        <FooterCol heading="Product">
          <li>
            <a href="#">Features</a>
          </li>
          <li>
            <a href="#">Pricing</a>
          </li>
        </FooterCol>
        <FooterCol heading="Company">
          <li>
            <a href="#">About</a>
          </li>
          <li>
            <a href="#">Careers</a>
          </li>
        </FooterCol>
      </FooterCols>
      <FooterMeta>
        <span>© 2026 Fizz Inc.</span>
      </FooterMeta>
    </Footer>
  );
}

/** `heading` is optional — a plain link list (like a "Follow us" group)
 *  sitting next to headed columns, with no label rendered above it. */
export function NoHeading() {
  return (
    <Footer>
      <FooterCols>
        <FooterCol heading="Product">
          <li>
            <a href="#">Features</a>
          </li>
          <li>
            <a href="#">Pricing</a>
          </li>
        </FooterCol>
        <FooterCol>
          <li>
            <a href="#">Twitter/X</a>
          </li>
          <li>
            <a href="#">GitHub</a>
          </li>
          <li>
            <a href="#">Discord</a>
          </li>
        </FooterCol>
      </FooterCols>
      <FooterMeta>
        <span>© 2026 Fizz Inc.</span>
      </FooterMeta>
    </Footer>
  );
}
