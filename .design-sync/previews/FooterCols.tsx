import { Footer, FooterCol, FooterCols, FooterMeta } from "@sorbet/component-library";

/** Three columns — `grid-template-columns: repeat(auto-fit, minmax(min(10rem,100%),1fr))`,
 *  so they sit evenly across the footer's width. */
export function ThreeColumns() {
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
        <span>© 2026 Fizz Inc.</span>
      </FooterMeta>
    </Footer>
  );
}

/** Four columns — the same auto-fit grid reflows to fit an extra group
 *  (here, Legal) without any layout change from the caller. */
export function FourColumns() {
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
        <FooterCol heading="Resources">
          <li>
            <a href="#">Docs</a>
          </li>
          <li>
            <a href="#">Support</a>
          </li>
        </FooterCol>
        <FooterCol heading="Legal">
          <li>
            <a href="#">Privacy</a>
          </li>
          <li>
            <a href="#">Terms</a>
          </li>
        </FooterCol>
      </FooterCols>
      <FooterMeta>
        <span>© 2026 Fizz Inc.</span>
      </FooterMeta>
    </Footer>
  );
}
