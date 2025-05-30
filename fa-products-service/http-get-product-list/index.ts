import { CosmosClient } from "@azure/cosmos";
import { AzureFunction, Context, HttpRequest } from "@azure/functions";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("HTTP trigger function processed a request.");

  const key = process.env.COSMOS_KEY;
  const endpoint = process.env.COSMOS_ENDPOINT;
  const cosmosClient = new CosmosClient({ endpoint, key });

  const database = cosmosClient.database("products-db");
  const productsContainer = database.container("products");
  const stocksContainer = database.container("stocks");

  const { resources: products } = await productsContainer.items
    .readAll()
    .fetchAll();
  const { resources: stocks } = await stocksContainer.items
    .readAll()
    .fetchAll();

  const body = products.map(({ id, price, title, description }) => ({
    id,
    count: stocks.find((stock) => stock.product_id === id)?.count || 0,
    price,
    title,
    description,
  }));

  context.res = { body };
};

export default httpTrigger;
