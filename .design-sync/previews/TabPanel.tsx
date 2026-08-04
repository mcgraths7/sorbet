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

export function NutritionSelected() {
  return (
    <Tabs defaultValue="nutrition" style={{ maxWidth: 420 }}>
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
        <Text size="sm" weight="semibold">
          Per serving
        </Text>
        <Text size="sm">520 calories · 38g protein · 42g carbs · 18g fat</Text>
        <Text size="sm" tone="muted">
          Contains fish. Prepared in a kitchen that also handles shellfish and tree nuts.
        </Text>
      </TabPanel>
    </Tabs>
  );
}
