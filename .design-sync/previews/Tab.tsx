import { Tab, TabList, TabPanel, Tabs, Text } from "@sorbet/component-library";

export function Default() {
  return (
    <Tabs defaultValue="instructions" style={{ maxWidth: 420 }}>
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

export function Disabled() {
  return (
    <Tabs defaultValue="upcoming" style={{ maxWidth: 420 }}>
      <TabList aria-label="Order status">
        <Tab value="upcoming">Upcoming</Tab>
        <Tab value="past">Past orders</Tab>
        <Tab value="draft" disabled>
          Draft (locked)
        </Tab>
      </TabList>
      <TabPanel value="upcoming">
        <Text size="sm">Your next box ships Tuesday, March 4th.</Text>
      </TabPanel>
      <TabPanel value="past">
        <Text size="sm">12 boxes delivered since January 2025.</Text>
      </TabPanel>
      <TabPanel value="draft">
        <Text size="sm">Draft orders unlock once your plan renews.</Text>
      </TabPanel>
    </Tabs>
  );
}
