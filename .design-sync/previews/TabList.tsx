import { Tab, TabList, TabPanel, Tabs, Text } from "@sorbet/component-library";

export function Default() {
  return (
    <Tabs defaultValue="ingredients" style={{ maxWidth: 420 }}>
      <TabList aria-label="Recipe details">
        <Tab value="ingredients">Ingredients</Tab>
        <Tab value="instructions">Instructions</Tab>
        <Tab value="nutrition">Nutrition</Tab>
      </TabList>
      <TabPanel value="ingredients">
        <Text size="sm">2 salmon fillets, 1 cup jasmine rice, 1 lemon, 2 tbsp soy sauce, 1 bunch scallions.</Text>
      </TabPanel>
      <TabPanel value="instructions">
        <Text size="sm">
          Rinse the rice, then simmer covered for 15 minutes. Pan-sear the salmon 4 minutes per side.
        </Text>
      </TabPanel>
      <TabPanel value="nutrition">
        <Text size="sm">520 calories · 38g protein · 42g carbs · 18g fat per serving.</Text>
      </TabPanel>
    </Tabs>
  );
}

export function ManyTabs() {
  return (
    <Tabs defaultValue="all" style={{ maxWidth: 480 }}>
      <TabList aria-label="Order filters">
        <Tab value="all">All</Tab>
        <Tab value="processing">Processing</Tab>
        <Tab value="shipped">Shipped</Tab>
        <Tab value="delivered">Delivered</Tab>
        <Tab value="cancelled">Cancelled</Tab>
      </TabList>
      <TabPanel value="all">
        <Text size="sm">148 orders total.</Text>
      </TabPanel>
      <TabPanel value="processing">
        <Text size="sm">6 orders being packed right now.</Text>
      </TabPanel>
      <TabPanel value="shipped">
        <Text size="sm">22 orders on their way to customers.</Text>
      </TabPanel>
      <TabPanel value="delivered">
        <Text size="sm">118 orders delivered this month.</Text>
      </TabPanel>
      <TabPanel value="cancelled">
        <Text size="sm">2 orders cancelled, refunds issued.</Text>
      </TabPanel>
    </Tabs>
  );
}
