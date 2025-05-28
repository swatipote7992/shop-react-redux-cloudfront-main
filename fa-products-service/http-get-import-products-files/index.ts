import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  ContainerSASPermissions,
} from "@azure/storage-blob";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("HTTP trigger function processed a request.");

  const accountName = "stgsandimportne001stgs";
  const accountKey = process.env.STORAGE_ACCOUNT_KEY;

  const containerName = "uploaded";
  const blobName = req.query.name;
  const sharedKeyCredential = new StorageSharedKeyCredential(
    accountName,
    accountKey
  );
  const expiresOn = new Date(new Date().valueOf() + 86400 * 1000);
  const permissions = ContainerSASPermissions.parse("w");

  const sasToken = generateBlobSASQueryParameters(
    { containerName, blobName, expiresOn, permissions },
    sharedKeyCredential
  ).toString();

  const blobUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;

  context.res = {
    status: 200,
    body: {
      uploadUrl: blobUrl,
    },
  };
};

export default httpTrigger;