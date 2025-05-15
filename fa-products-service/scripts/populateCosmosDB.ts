import { CosmosClient } from "@azure/cosmos";
import { faker } from "@faker-js/faker";
import { config } from "dotenv";

config();
const key = process.env.COSMOS_KEY!;
const endpoint = process.env.COSMOS_ENDPOINT!;

const cosmosClient = new CosmosClient({ endpoint, key });

const database = cosmosClient.database("products-db");
const productsContainer = database.container("products");
const stocksContainer = database.container("stocks");

const createRandomProducts = () => {
  return {
    id: faker.string.uuid(),
    title: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: faker.number.float({ min: 1, max: 1000, fractionDigits: 2 }),
  };
};

const products = faker.helpers.multiple(createRandomProducts, { count: 100 });
const stocks = products.map((product) => ({
  product_id: product.id,
  count: faker.number.int({ min: 0, max: 100 }),
}));

const run = async () => {
  const productsResponses = products.map((product) => productsContainer.items.upsert(product));
  const stocksResponses = stocks.map((stock) => stocksContainer.items.upsert(stock));
  
  await Promise.all([...productsResponses, ...stocksResponses]);
};

run();