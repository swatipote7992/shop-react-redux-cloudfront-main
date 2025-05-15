import { CosmosClient } from "@azure/cosmos";
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { randomUUID } from "node:crypto";

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

  const id = randomUUID();

  const newProduct = {
    id,
    title: req.body.title,
    description: req.body.description,
    price: req.body.price,
  };

  const newStock = {
    product_id: id,
    count: req.body.count,
  };

  await productsContainer.items.upsert(newProduct);
  await stocksContainer.items.upsert(newStock);

  context.res = {
    body: req.body,
  };
};

export default httpTrigger;