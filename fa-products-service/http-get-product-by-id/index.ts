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

  const { resource: product } = await productsContainer
    .item(req.params.productId)
    .read();
  const { resource: stock } = await stocksContainer
    .item(req.params.productId)
    .read();

  const body = {
    id: product.id,
    count: stock.count,
    price: product.price,
    title: product.title,
    description: product.description,
  };

  context.res = {
    status: product && stock ? 200 : 404,
    body: product && stock ? body : "Product not found",
  };
};

export default httpTrigger;
