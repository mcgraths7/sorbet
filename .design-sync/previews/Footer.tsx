import { Footer, FooterCol, FooterCols, FooterMeta } from "@sorbet/component-library";

/** Canonical shape: three link columns plus a meta row (copyright + a
 *  trailing link), the same layout as the README's own footer example. */
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
          <li>
            <a href="#">Changelog</a>
          </li>
        </FooterCol>
        <FooterCol heading="Company">
          <li>
            <a href="#">About</a>
          </li>
          <li>
            <a href="#">Careers</a>
          </li>
          <li>
            <a href="#">Blog</a>
          </li>
        </FooterCol>
        <FooterCol heading="Resources">
          <li>
            <a href="#">Docs</a>
          </li>
          <li>
            <a href="#">Support</a>
          </li>
        </FooterCol>
      </FooterCols>
      <FooterMeta>
        <span>© 2026 Fizz Inc. All rights reserved.</span>
        <a href="#top">Back to top ↑</a>
      </FooterMeta>
    </Footer>
  );
}

/** A lighter footer: two columns and a shorter meta row — a smaller
 *  product's whole site footer, not a padded-out enterprise one. */
export function Minimal() {
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
        <FooterCol heading="Resources">
          <li>
            <a href="#">Docs</a>
          </li>
        </FooterCol>
      </FooterCols>
      <FooterMeta>
        <span>© 2026 Fizz Inc.</span>
      </FooterMeta>
    </Footer>
  );
}
