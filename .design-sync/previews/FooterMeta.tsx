import { Footer, FooterCol, FooterCols, FooterMeta } from "@sorbet/component-library";

/** Copyright plus a single trailing link — `justify-content: space-between`
 *  pushes them to opposite ends of the row. */
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
        <FooterCol heading="Resources">
          <li>
            <a href="#">Docs</a>
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

/** More than two items — `flex-wrap: wrap` on the meta row keeps copyright
 *  plus a run of legal links from overflowing a narrower footer. */
export function WithLinks() {
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
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
        <a href="#top">Back to top ↑</a>
      </FooterMeta>
    </Footer>
  );
}
