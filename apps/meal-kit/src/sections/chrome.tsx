import { Button } from "@sorbet/component-library/atoms";
import {
  Footer,
  FooterCol,
  FooterCols,
  FooterMeta,
  Navbar,
  NavbarActions,
  NavbarBrand,
  NavbarLink,
  NavbarNav,
} from "@sorbet/component-library/organisms";

export function SiteNav() {
  return (
    <Navbar>
      <NavbarBrand href="#top">🌿&nbsp;Sprig</NavbarBrand>
      <NavbarNav>
        <NavbarLink href="#how">How it works</NavbarLink>
        <NavbarLink href="#menu">This week's menu</NavbarLink>
        <NavbarLink href="#plans">Plans</NavbarLink>
        <NavbarLink href="#faq">FAQ</NavbarLink>
      </NavbarNav>
      <NavbarActions>
        <Button variant="ghost" size="sm" as="a" href="#plans">
          Sign in
        </Button>
        <Button size="sm" as="a" href="#build">
          Get started
        </Button>
      </NavbarActions>
    </Navbar>
  );
}

export function SiteFooter() {
  return (
    <Footer>
      <FooterCols>
        <FooterCol heading="Sprig">
          <li>
            <a href="#how">How it works</a>
          </li>
          <li>
            <a href="#menu">This week's menu</a>
          </li>
          <li>
            <a href="#plans">Plans &amp; pricing</a>
          </li>
        </FooterCol>
        <FooterCol heading="Support">
          <li>
            <a href="#faq">FAQ</a>
          </li>
          <li>
            <a href="#faq">Delivery areas</a>
          </li>
          <li>
            <a href="#faq">Contact us</a>
          </li>
        </FooterCol>
        <FooterCol heading="Company">
          <li>
            <a href="#top">Our sourcing</a>
          </li>
          <li>
            <a href="#top">Careers</a>
          </li>
        </FooterCol>
      </FooterCols>
      <FooterMeta>
        <span>© 2026 Sprig Foods. Cooked up with Sorbet.</span>
        <a href="#top">Back to top</a>
      </FooterMeta>
    </Footer>
  );
}
