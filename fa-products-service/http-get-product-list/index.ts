import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { products } from "../mock/products";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request.');
    const selectedProducts = products;
    context.res = {
        status: 200, // HTTP Status Code
        headers: { "Content-Type": "application/json" },
        body: selectedProducts // JSON response
    };

};

export default httpTrigger;