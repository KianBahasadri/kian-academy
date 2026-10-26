terraform {
  required_version = ">= 1.10.0, < 2.0.0"
  required_providers {
    cloudflare = { source = "cloudflare/cloudflare", version = "= 5.27.0" }
  }
}

provider "cloudflare" {}

variable "account_id" { type = string }
variable "zone_id" { type = string }
variable "hostname" { type = string }
variable "release" { type = string }
variable "clerk_jwt_key" { type = string }
variable "clerk_issuer" { type = string }
variable "clerk_cnames" { type = map(string) }
variable "worker_exists" { type = bool }

locals {
  root = abspath("${path.module}/../..")
  name = "kian-academy"
}

resource "cloudflare_d1_database" "accounts" {
  account_id       = var.account_id
  name             = "${local.name}-accounts"
  read_replication = { mode = "disabled" }
  lifecycle { prevent_destroy = true }
}

resource "terraform_data" "schema" {
  triggers_replace = {
    database_id = cloudflare_d1_database.accounts.id
    migrations  = sha256(join("", [for file in sort(tolist(fileset("${local.root}/cloudflare/migrations", "*.sql"))) : filesha256("${local.root}/cloudflare/migrations/${file}")]))
    runner      = filesha256("${local.root}/scripts/cloudflare-migrate.mjs")
  }
  provisioner "local-exec" {
    working_dir = local.root
    command     = "node scripts/cloudflare-migrate.mjs"
    environment = {
      CLOUDFLARE_ACCOUNT_ID = var.account_id
      ACADEMY_DATABASE_ID   = cloudflare_d1_database.accounts.id
    }
  }
}

resource "cloudflare_workers_script" "app" {
  account_id          = var.account_id
  script_name         = local.name
  main_module         = "worker.js"
  content_file        = "${local.root}/build/cloudflare/worker.js"
  content_sha256      = filesha256("${local.root}/build/cloudflare/worker.js")
  compatibility_date  = "2026-10-01"
  compatibility_flags = ["nodejs_compat"]
  assets = {
    directory = "${local.root}/dist"
    config = {
      html_handling      = "none"
      not_found_handling = "single-page-application"
      run_worker_first   = true
    }
  }
  bindings = [
    { name = "ASSETS", type = "assets" },
    { name = "DB", type = "d1", id = cloudflare_d1_database.accounts.id },
    { name = "ACCOUNTS", type = "durable_object_namespace", class_name = "AccountGateway" },
    { name = "ACCOUNTS_ORIGIN", type = "plain_text", text = "https://${var.hostname}" },
    { name = "CLERK_JWT_KEY", type = "plain_text", text = var.clerk_jwt_key },
    { name = "CLERK_ISSUER", type = "plain_text", text = var.clerk_issuer },
    { name = "RELEASE", type = "plain_text", text = var.release },
  ]
  migrations = {
    new_tag            = "v1"
    old_tag            = var.worker_exists ? "v1" : null
    new_sqlite_classes = var.worker_exists ? null : ["AccountGateway"]
  }
  depends_on = [terraform_data.schema]
  lifecycle { prevent_destroy = true }
}

resource "cloudflare_workers_script_subdomain" "app" {
  account_id       = var.account_id
  script_name      = cloudflare_workers_script.app.script_name
  enabled          = false
  previews_enabled = false
}

resource "cloudflare_workers_route" "primary" {
  zone_id = var.zone_id
  pattern = "${var.hostname}/*"
  script  = cloudflare_workers_script.app.script_name
}

resource "cloudflare_dns_record" "clerk" {
  for_each = var.clerk_cnames
  zone_id  = var.zone_id
  name     = "${each.key}.${var.hostname}"
  type     = "CNAME"
  content  = each.value
  proxied  = false
  ttl      = 1
}

output "url" { value = "https://${var.hostname}" }
output "database_id" { value = cloudflare_d1_database.accounts.id }
output "worker_name" { value = cloudflare_workers_script.app.script_name }
