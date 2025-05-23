#Resource group
resource "azurerm_resource_group" "import_rg" {
  name     = "rg-import-sand-ne-001"
  location = "northeurope"
}

#Create Storage Account
resource "azurerm_storage_account" "import_storage_account" {
  name                             = "importstgaccsand001"
  resource_group_name              = azurerm_resource_group.import_rg.name
  location                         = azurerm_resource_group.import_rg.location
  account_tier                     = "Standard"
  account_replication_type         = "LRS" /*  GRS, RAGRS, ZRS, GZRS, RAGZRS */
  access_tier                      = "Cool"
  enable_https_traffic_only        = true
  allow_nested_items_to_be_public  = true
  shared_access_key_enabled        = true
  public_network_access_enabled    = true

  /* edge_zone = "North Europe" */
}

#Create Storage Account Container
resource "azurerm_storage_container" "import_sa_container" {
  name                  = "import-sa-sand-container"
  storage_account_name  = azurerm_storage_account. import_storage_account.name
  container_access_type = "private"
}

#Create Storage Account Container Parsed
resource "azurerm_storage_container" "import_container_parsed" {
  name                  = "import-sand-container-parsed"
  storage_account_name  = azurerm_storage_account.import_storage_account.name
  container_access_type = "private"
}

#creating import service
resource "azurerm_storage_share" "import_service_fa" {
  name  = "fa-import-service-share"
  quota = 2

  storage_account_name = azurerm_storage_account.import_storage_account.name
}

#creating import service plan
resource "azurerm_service_plan" "import_service_plan" {
  name     = "asp-import-service-sand-ne-001"
  location = "northeurope"

  os_type  = "Windows"
  sku_name = "Y1"

  resource_group_name = azurerm_resource_group.import_rg.name
}

#creating application_insights
resource "azurerm_application_insights" "import_service_fa" {
  name             = "appins-fa-import-service-sand-ne-001"
  application_type = "web"
  location         = "northeurope"
  # https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/application_insights#workspace_id-1
  workspace_id     = "/subscriptions/8d1bfa8a-66b7-4367-8cac-5b5c866dec04/resourceGroups/ai_appins-fa-import-service-sand-ne-001_2a5c7a5b-f19a-48c5-9003-f1164540a6df_managed/providers/Microsoft.OperationalInsights/workspaces/managed-appins-fa-import-service-sand-ne-001-ws"

  resource_group_name = azurerm_resource_group.import_rg.name
}

#creating import function app
resource "azurerm_windows_function_app" "import_service" {
  name     = "fa-import-service-ne-001"
  location = "northeurope"

  service_plan_id     = azurerm_service_plan.import_service_plan.id
  resource_group_name = azurerm_resource_group.import_rg.name

  storage_account_name       = azurerm_storage_account.import_storage_account.name
  storage_account_access_key = azurerm_storage_account.import_storage_account.primary_access_key

  functions_extension_version = "~4"
  builtin_logging_enabled     = false

  site_config {
    always_on = false

    application_insights_key               = azurerm_application_insights.import_service_fa.instrumentation_key
    application_insights_connection_string = azurerm_application_insights.import_service_fa.connection_string

    # For production systems set this to false, but consumption plan supports only 32bit workers
    use_32_bit_worker = true

    # Enable function invocations from Azure Portal.
    cors {
      allowed_origins = ["https://portal.azure.com"]
    }

    application_stack {
      node_version = "~16"
    }
  }

  app_settings = {
    WEBSITE_CONTENTAZUREFILECONNECTIONSTRING = azurerm_storage_account.import_storage_account.primary_connection_string
    WEBSITE_CONTENTSHARE                     = azurerm_storage_share.import_service_fa.name
  }

  # The app settings changes cause downtime on the Function App. e.g. with Azure Function App Slots
  # Therefore it is better to ignore those changes and manage app settings separately off the Terraform.
  lifecycle {
    ignore_changes = [
      app_settings,
      site_config["application_stack"], // workaround for a bug when azure just "kills" your app
      tags["hidden-link: /app-insights-instrumentation-key"],
      tags["hidden-link: /app-insights-resource-id"],
      tags["hidden-link: /app-insights-conn-string"]
    ]
  }
}