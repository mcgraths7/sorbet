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

export function Pills() {
  return (
    <Tabs defaultValue="week" pills style={{ maxWidth: 420 }}>
      <TabList aria-label="Meal plan range">
        <Tab value="week">This week</Tab>
        <Tab value="next">Next week</Tab>
        <Tab value="full">Full menu</Tab>
      </TabList>
      <TabPanel value="week">
        <Text size="sm">3 dinners scheduled, delivering Tuesday.</Text>
      </TabPanel>
      <TabPanel value="next">
        <Text size="sm">Pick your meals by Friday to lock in next week's box.</Text>
      </TabPanel>
      <TabPanel value="full">
        <Text size="sm">Browse all 24 recipes available this season.</Text>
      </TabPanel>
    </Tabs>
  );
}
