import { Prose } from "@sorbet/component-library";

export function ArticleBody() {
  return (
    <Prose style={{ maxWidth: 560 }}>
      <h2>Shipping and returns</h2>
      <p>
        Orders placed before 2pm ET ship the same business day. Standard
        shipping arrives in 3–5 business days; expedited options are
        available at checkout.
      </p>
      <p>
        Not the right fit? Returns are free within 30 days of delivery,
        provided the item is unworn and in its original packaging.
      </p>
      <ul>
        <li>Free standard shipping on orders over $75</li>
        <li>Track your package from the order confirmation email</li>
        <li>Exchanges process faster than refunds</li>
      </ul>
    </Prose>
  );
}

export function WithHeadingsAndQuote() {
  return (
    <Prose style={{ maxWidth: 560 }}>
      <h3>Why we redesigned the dashboard</h3>
      <p>
        Customers told us the old layout buried the numbers that mattered
        most. We rebuilt the home screen around three questions: what
        happened today, what needs attention, and what's next.
      </p>
      <blockquote>
        "It finally feels like the dashboard is doing the summarizing, not
        me." — Beta tester feedback
      </blockquote>
      <p>The result ships to everyone next week.</p>
    </Prose>
  );
}
